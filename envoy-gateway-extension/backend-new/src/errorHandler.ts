import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiError, ApiSuccess, ErrorCodes, RetryConfig } from './types';

/**
 * Custom error class with code and requestId
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly requestId: string;
  public readonly details?: any;

  constructor(code: string, message: string, details?: any, requestId?: string) {
    super(message);
    this.code = code;
    this.requestId = requestId || uuidv4();
    this.details = details;
    this.name = 'AppError';
  }
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): ApiSuccess<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId: requestId || uuidv4()
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any,
  requestId?: string
): ApiError {
  return {
    success: false,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      requestId: requestId || uuidv4()
    }
  };
}

/**
 * Express middleware to add requestId to all requests
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
}

/**
 * Express error handling middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`Error [${req.requestId}]:`, {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query
  });

  let response: ApiError;

  if (err instanceof AppError) {
    response = createErrorResponse(
      err.code,
      err.message,
      err.details,
      req.requestId
    );
  } else {
    // Handle specific error types
    if (err.name === 'ValidationError') {
      response = createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        err.message,
        { validation: err },
        req.requestId
      );
    } else if (err.name === 'SyntaxError' && 'body' in err) {
      response = createErrorResponse(
        ErrorCodes.INVALID_REQUEST_BODY,
        'Invalid JSON in request body',
        { parseError: err.message },
        req.requestId
      );
    } else {
      // Generic error
      response = createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'An unexpected error occurred',
        process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined,
        req.requestId
      );
    }
  }

  res.status(getHttpStatusFromErrorCode(response.error.code)).json(response);
}

/**
 * Map error codes to HTTP status codes
 */
function getHttpStatusFromErrorCode(code: string): number {
  switch (code) {
    case ErrorCodes.VALIDATION_ERROR:
    case ErrorCodes.INVALID_REQUEST_BODY:
      return 400;
    case ErrorCodes.KUBERNETES_PERMISSION_DENIED:
      return 403;
    case ErrorCodes.GATEWAY_NOT_FOUND:
    case ErrorCodes.ROUTE_NOT_FOUND:
    case ErrorCodes.NAMESPACE_NOT_FOUND:
      return 404;
    case ErrorCodes.RESOURCE_ALREADY_EXISTS:
      return 409;
    case ErrorCodes.TIMEOUT_ERROR:
      return 408;
    case ErrorCodes.INTERNAL_SERVER_ERROR:
    case ErrorCodes.UNKNOWN_ERROR:
      return 500;
    case ErrorCodes.KUBERNETES_CONNECTION_FAILED:
    case ErrorCodes.KUBERNETES_NOT_AVAILABLE:
    case ErrorCodes.NETWORK_ERROR:
      return 503;
    default:
      return 500;
  }
}

/**
 * Retry mechanism with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  },
  requestId?: string
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  let delay = config.initialDelay;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      console.warn(`Retry attempt ${attempt + 1}/${config.maxRetries + 1} failed [${requestId}]:`, {
        error: lastError.message,
        nextRetryInMs: attempt < config.maxRetries ? delay : 'no more retries'
      });

      if (attempt < config.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      }
    }
  }

  throw new AppError(
    ErrorCodes.TIMEOUT_ERROR,
    `Operation failed after ${config.maxRetries + 1} attempts: ${lastError.message}`,
    { originalError: lastError.message, attempts: config.maxRetries + 1 },
    requestId
  );
}

/**
 * Async wrapper to handle errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Handle Kubernetes API errors specifically
 */
export function handleKubernetesError(error: any, requestId?: string): AppError {
  console.error('Kubernetes error:', error);

  // Check if it's a Kubernetes API error with status code
  if (error.response?.statusCode) {
    const statusCode = error.response.statusCode;
    const message = error.response.body?.message || error.message;

    switch (statusCode) {
      case 401:
      case 403:
        return new AppError(
          ErrorCodes.KUBERNETES_PERMISSION_DENIED,
          `Kubernetes access denied: ${message}`,
          { statusCode, originalError: error.message },
          requestId
        );
      case 404:
        return new AppError(
          ErrorCodes.NAMESPACE_NOT_FOUND,
          'Resource not found in Kubernetes',
          { statusCode, originalError: error.message },
          requestId
        );
      case 409:
        return new AppError(
          ErrorCodes.RESOURCE_ALREADY_EXISTS,
          'Resource already exists',
          { statusCode, originalError: error.message },
          requestId
        );
      default:
        return new AppError(
          ErrorCodes.KUBERNETES_CONNECTION_FAILED,
          `Kubernetes API error: ${message}`,
          { statusCode, originalError: error.message },
          requestId
        );
    }
  }

  // Network or connection errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    return new AppError(
      ErrorCodes.KUBERNETES_NOT_AVAILABLE,
      'Cannot connect to Kubernetes cluster',
      { code: error.code, originalError: error.message },
      requestId
    );
  }

  // Timeout errors
  if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
    return new AppError(
      ErrorCodes.TIMEOUT_ERROR,
      'Kubernetes operation timed out',
      { originalError: error.message },
      requestId
    );
  }

  // Generic Kubernetes error
  return new AppError(
    ErrorCodes.KUBERNETES_CONNECTION_FAILED,
    `Kubernetes error: ${error.message}`,
    { originalError: error.message },
    requestId
  );
}

// Extend Express Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}
