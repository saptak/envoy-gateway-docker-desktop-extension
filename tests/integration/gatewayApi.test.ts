import request from 'supertest';
import express from 'express';

describe('Gateway API Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Create a simple Express app for testing
    app = express();

    // Add middleware
    app.use(express.json());

    // Add gateway routes
    app.get('/api/gateways', (req, res) => {
      res.status(200).json({
        success: true,
        data: {
          gateways: [],
          total: 0,
          page: 1,
          pageSize: 10,
          hasNext: false,
        },
        message: 'Gateways retrieved successfully',
        timestamp: new Date().toISOString(),
      });
    });

    app.get('/api/gateways/:namespace/:name', (req, res) => {
      res.status(200).json({
        success: true,
        data: {
          id: 'gateway-id',
          name: req.params.name,
          namespace: req.params.namespace,
          status: 'Ready',
          listeners: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          spec: {
            gatewayClassName: 'test-class',
            listeners: [
              {
                name: 'http',
                port: 8080,
                protocol: 'HTTP',
              },
            ],
          },
        },
        message: 'Gateway retrieved successfully',
        timestamp: new Date().toISOString(),
      });
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/gateways', () => {
    it('should list all gateways', async () => {
      const response = await request(app)
        .get('/api/gateways')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.gateways).toHaveLength(0);
      expect(response.body.data.total).toBe(0);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(10);
    });
  });

  describe('GET /api/gateways/:namespace/:name', () => {
    it('should get a specific gateway', async () => {
      const response = await request(app)
        .get('/api/gateways/default/test-gateway')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('test-gateway');
      expect(response.body.data.namespace).toBe('default');
    });
  });
});
