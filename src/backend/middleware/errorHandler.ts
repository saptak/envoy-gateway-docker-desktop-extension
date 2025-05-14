import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../utils/logger';
import { ExtensionError, ValidationError, KubernetesError, DockerError } from '../../shared/types';

const logger = LoggerService.getInstance();

export function errorHandler(
  error: Error | ExtensionError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response is already sent, delegate to default error handler
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: any = undefined;

  // Handle custom errors
  if (error instanceof ExtensionError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ValidationError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
    details = error.details;
  } else if (error instanceof KubernetesError) {
    statusCode = 500;
    errorCode = 'KUBERNETES_ERROR';
    message = error.message;
    details = error.details;
  } else if (error instanceof DockerError) {
    statusCode = 500;
    errorCode = 'DOCKER_ERROR';
    message = error.message;
    details = error.details;
  } else {
    // Handle standard errors
    statusCode = 500;
    message = process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message || 'Something went wrong';
  }

  // Log the error
  logger.error('API Error:', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    statusCode,
    errorCode,
  });

  // Prepare error response
  const errorResponse: any = {
    success: false,
    error: {
      code: errorCode,
      message,
      timestamp: new Date().toISOString(),
    },
  };

  // Add details in development mode
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.details = details;
    errorResponse.error.stack = error.stack;
  } else if (details) {
    errorResponse.error.details = details;
  }

  // Add request ID if available
  if (req.headers['x-request-id']) {
    errorResponse.error.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
}

export default errorHandler;
