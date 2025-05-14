import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateRequest } from './middleware/validation';

import gatewayRoutes from './controllers/gatewayController';
import routeRoutes from './controllers/routeController';
import healthRoutes from './controllers/healthController';
import configRoutes from './controllers/configController';

import { WebSocketService } from './services/websocketService';
import { LoggerService } from './utils/logger';

// Load environment variables
dotenv.config();

const logger = LoggerService.getInstance();

class Application {
  public app: express.Application;
  public server: any;
  public io: SocketIOServer;
  private readonly port: number;
  private websocketService: WebSocketService;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '8080', 10);
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeWebSocket();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://localhost:3000'] 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Compression middleware
    this.app.use(compression());

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (process.env.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim())
        }
      }));
    }

    // Custom middleware
    this.app.use(requestLogger);
    this.app.use(validateRequest);
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/health', healthRoutes);
    this.app.use('/api/gateways', gatewayRoutes);
    this.app.use('/api/routes', routeRoutes);
    this.app.use('/api/config', configRoutes);

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Envoy Gateway Docker Desktop Extension API',
        version: process.env.npm_package_version || '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeWebSocket(): void {
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://localhost:3000'] 
          : ['http://localhost:3000', 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.websocketService = new WebSocketService(this.io);
    this.websocketService.initialize();
  }

  public listen(): void {
    this.server.listen(this.port, () => {
      logger.info(`🚀 Envoy Gateway Extension API server is running on port ${this.port}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 WebSocket server initialized`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getServer(): any {
    return this.server;
  }

  public close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          logger.info('Server closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Create and start the application
const application = new Application();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Starting graceful shutdown...');
  await application.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Starting graceful shutdown...');
  await application.close();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  application.listen();
}

export default application;
export { Application };
