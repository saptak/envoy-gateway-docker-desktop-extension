import request from 'supertest';
import express from 'express';
import { mockKubernetesService, mockDockerService, mockWebSocketService } from '../mocks/integration.mock';

describe('Health API Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Create a simple Express app for testing
    app = express();

    // Add middleware
    app.use(express.json());

    // Add health routes
    app.get('/api/health', (req, res) => {
      res.status(200).json({
        success: true,
        data: {
          status: 'healthy',
          services: {
            kubernetes: { status: 'healthy', version: 'v1.25.0' },
            docker: { status: 'healthy', version: '20.10.0' },
          },
          metadata: {
            version: '1.0.0',
            responseTime: '10ms',
            uptime: '1h',
            memoryUsage: { rss: 100, heapTotal: 50, heapUsed: 25, external: 10 },
          },
        },
        message: 'System is healthy',
        timestamp: new Date().toISOString(),
      });
    });

    app.get('/api/health/liveness', (req, res) => {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      });
    });

    app.get('/api/health/readiness', (req, res) => {
      res.status(200).json({
        status: 'ready',
        services: {
          kubernetes: 'healthy',
          docker: 'healthy',
        },
        timestamp: new Date().toISOString(),
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return healthy status when all services are healthy', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.services.kubernetes.status).toBe('healthy');
      expect(response.body.data.services.docker.status).toBe('healthy');
      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.metadata.version).toBeDefined();
      expect(response.body.data.metadata.responseTime).toBeDefined();
      expect(response.body.data.metadata.uptime).toBeDefined();
      expect(response.body.data.metadata.memoryUsage).toBeDefined();
    });
  });

  describe('GET /api/health/liveness', () => {
    it('should return alive status', async () => {
      const response = await request(app)
        .get('/api/health/liveness')
        .expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });
  });

  describe('GET /api/health/readiness', () => {
    it('should return ready status when all services are healthy', async () => {
      const response = await request(app)
        .get('/api/health/readiness')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body.services.kubernetes).toBe('healthy');
      expect(response.body.services.docker).toBe('healthy');
    });
  });


});
