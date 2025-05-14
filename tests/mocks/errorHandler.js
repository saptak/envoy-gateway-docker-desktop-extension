// Mock for errorHandler
const logger = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

function errorHandler(error, req, res, next) {
  // If response is already sent, delegate to default error handler
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details = undefined;

  // Handle custom errors
  if (error.statusCode) {
    statusCode = error.statusCode;
    errorCode = error.code || 'EXTENSION_ERROR';
    message = error.message;
    details = error.details;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = error.message;
    details = error.details;
  } else if (error.name === 'KubernetesError') {
    statusCode = 500;
    errorCode = 'KUBERNETES_ERROR';
    message = error.message;
    details = error.details;
  } else if (error.name === 'DockerError') {
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
  const errorResponse = {
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
  if (req.headers && req.headers['x-request-id']) {
    errorResponse.error.requestId = req.headers['x-request-id'];
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = {
  errorHandler,
  default: errorHandler,
};
