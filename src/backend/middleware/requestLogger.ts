import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { LoggerService } from '../utils/logger';

const logger = LoggerService.getInstance();

export interface RequestWithId extends Request {
  id: string;
  startTime: number;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  const startTime = Date.now();

  // Add request ID and start time to request object
  (req as RequestWithId).id = requestId;
  (req as RequestWithId).startTime = startTime;

  // Set response header with request ID
  res.setHeader('X-Request-ID', requestId);

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    userAgent: req.get('user-agent'),
    clientIp: req.ip || req.connection.remoteAddress,
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function (body: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log response
    logger.info('Outgoing response', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: JSON.stringify(body).length,
    });

    return originalJson.call(this, body);
  };

  // Override res.send to log response for non-JSON responses
  const originalSend = res.send;
  res.send = function (body: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Only log if not already logged by res.json
    if (!res.headersSent || res.getHeader('content-type')?.toString().includes('application/json')) {
      logger.info('Outgoing response', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: typeof body === 'string' ? body.length : JSON.stringify(body).length,
      });
    }

    return originalSend.call(this, body);
  };

  // Handle response finish event for cases where neither json nor send is called
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log if response wasn't already logged
    if (!res.headersSent) {
      logger.info('Response finished', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
    }
  });

  // Handle errors
  res.on('error', (error) => {
    logger.error('Response error', {
      requestId,
      method: req.method,
      url: req.url,
      error: error.message,
    });
  });

  next();
}

export default requestLogger;
