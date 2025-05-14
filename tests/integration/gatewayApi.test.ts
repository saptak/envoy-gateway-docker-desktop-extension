import request from 'supertest';
import { Application } from '../../src/backend/index';
import { KubernetesService } from '../../src/backend/services/kubernetesService';
import { DockerService } from '../../src/backend/services/dockerService';

// Mock services
jest.mock('../../src/backend/services/kubernetesService');
jest.mock('../../src/backend/services/dockerService');

describe('Gateway API Integration Tests', () => {
  let app: Application;
  let mockKubernetesService: jest.Mocked<KubernetesService>;
  let mockDockerService: jest.Mocked<DockerService>;

  beforeAll(async () => {
    // Mock service instances
    mockKubernetesService = {
      listGateways: jest.fn(),
      getGateway: jest.fn(),
      createGateway: jest.fn(),
      updateGateway: jest.fn(),
      deleteGateway: jest.fn(),
      ensureNamespace: jest.fn(),
      listNamespaces: jest.fn(),
      healthCheck: jest.fn(),
    } as any;

    mockDockerService = {
      healthCheck: jest.fn(),
    } as any;

    (KubernetesService.getInstance as jest.Mock).mockReturnValue(mockKubernetesService);
    (DockerService.getInstance as jest.Mock).mockReturnValue(mockDockerService);

    // Create application instance
    app = new Application();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/gateways', () => {
    it('should list all gateways', async () => {
      const mockGateways = [
        {
          id: 'gateway1',
          name: 'test-gateway-1',
          namespace: 'default',
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
        {
          id: 'gateway2',
          name: 'test-gateway-2',
          namespace: 'default',
          status: 'Ready',
          listeners: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          spec: {
            gatewayClassName: 'test-class',
            listeners: [
              {
                name: 'https',
                port: 443,
                protocol: 'HTTPS',
              },
            ],
          },
        },
      ];

      mockKubernetesService.listGateways.mockResolvedValue(mockGateways);

      const response = await request(app.getApp())
        .get('/api/gateways')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.gateways).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.pageSize).toBe(10);
    });

    it('should handle pagination', async () => {
      const mockGateways = Array.from({ length: 15 }, (_, i) => ({
        id: `gateway${i + 1}`,
        name: `test-gateway-${i + 1}`,
        namespace: 'default',
        status: 'Ready',
        listeners: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        spec: {
          gatewayClassName: 'test-class',
          listeners: [],
        },
      }));

      mockKubernetesService.listGateways.mockResolvedValue(mockGateways);

      const response = await request(app.getApp())
        .get('/api/gateways?page=1&pageSize=10')
        .expect(200);

      expect(response.body.data.gateways).toHaveLength(10);
      expect(response.body.data.hasNext).toBe(true);

      const response2 = await request(app.getApp())
        .get('/api/gateways?page=2&pageSize=10')
        .expect(200);

      expect(response2.body.data.gateways).toHaveLength(5);
      expect(response2.body.data.hasNext).toBe(false);
    });

    it('should filter by namespace', async () => {
      const mockGateways = [
        {
          id: 'gateway1',
          name: 'test-gateway',
          namespace: 'production',
          status: 'Ready',
          listeners: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          spec: {
            gatewayClassName: 'test-class',
            listeners: [],
          },
        },
      ];

      mockKubernetesService.listGateways.mockResolvedValue(mockGateways);

      await request(app.getApp())
        .get('/api/gateways?namespace=production')
        .expect(200);

      expect(mockKubernetesService.listGateways).toHaveBeenCalledWith('production');
    });

    it('should handle service errors', async () => {
      mockKubernetesService.listGateways.mockRejectedValue(new Error('Service error'));

      const response = await request(app.getApp())
        .get('/api/gateways')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /api/gateways/:namespace/:name', () => {
    it('should get a specific gateway', async () => {
      const mockGateway = {
        id: 'gateway1',
        name: 'test-gateway',
        namespace: 'default',
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
      };

      mockKubernetesService.getGateway.mockResolvedValue(mockGateway);

      const response = await request(app.getApp())
        .get('/api/gateways/default/test-gateway')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('test-gateway');
      expect(response.body.data.namespace).toBe('default');
    });

    it('should return 404 for non-existent gateway', async () => {
      mockKubernetesService.getGateway.mockResolvedValue(null);

      const response = await request(app.getApp())
        .get('/api/gateways/default/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Gateway not found');
    });

    it('should validate path parameters', async () => {
      await request(app.getApp())
        .get('/api/gateways/Invalid_Namespace/test-gateway')
        .expect(400);

      await request(app.getApp())
        .get('/api/gateways/default/Invalid_Gateway_Name')
        .expect(400);
    });
  });

  describe('POST /api/gateways', () => {
    it('should create a new gateway', async () => {
      const gatewayInput = {
        name: 'new-gateway',
        namespace: 'default',
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
      };

      const createdGateway = {
        ...gatewayInput,
        id: 'gateway-id',
        status: 'Pending',
        listeners: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockKubernetesService.ensureNamespace.mockResolvedValue(undefined);
      mockKubernetesService.getGateway.mockResolvedValue(null);
      mockKubernetesService.createGateway.mockResolvedValue(createdGateway);

      const response = await request(app.getApp())
        .post('/api/gateways')
        .send(gatewayInput)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('new-gateway');
      expect(mockKubernetesService.createGateway).toHaveBeenCalledWith(
        expect.objectContaining(gatewayInput)
      );
    });

    it('should prevent creating duplicate gateways', async () => {
      const gatewayInput = {
        name: 'existing-gateway',
        namespace: 'default',
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
      };

      const existingGateway = {
        ...gatewayInput,
        id: 'existing-id',
        status: 'Ready',
        listeners: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockKubernetesService.ensureNamespace.mockResolvedValue(undefined);
      mockKubernetesService.getGateway.mockResolvedValue(existingGateway);

      const response = await request(app.getApp())
        .post('/api/gateways')
        .send(gatewayInput)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Gateway already exists');
    });

    it('should validate gateway input', async () => {
      const invalidGateway = {
        name: '', // Invalid empty name
        namespace: 'default',
        spec: {
          gatewayClassName: 'test-class',
          listeners: [], // Invalid empty listeners
        },
      };

      await request(app.getApp())
        .post('/api/gateways')
        .send(invalidGateway)
        .expect(400);
    });

    it('should sanitize input', async () => {
      const gatewayWithDangerousInput = {
        name: 'test<script>alert("xss")</script>',
        namespace: 'default<>',
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
      };

      const createdGateway = {
        id: 'gateway-id',
        name: 'testscriptalert("xss")/script',
        namespace: 'default',
        status: 'Pending',
        listeners: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        spec: gatewayWithDangerousInput.spec,
      };

      mockKubernetesService.ensureNamespace.mockResolvedValue(undefined);
      mockKubernetesService.getGateway.mockResolvedValue(null);
      mockKubernetesService.createGateway.mockResolvedValue(createdGateway);

      const response = await request(app.getApp())
        .post('/api/gateways')
        .send(gatewayWithDangerousInput)
        .expect(201);

      // Verify sanitization occurred
      expect(mockKubernetesService.createGateway).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'testscriptalert("xss")/script',
          namespace: 'default',
        })
      );
    });
  });

  describe('PUT /api/gateways/:namespace/:name', () => {
    it('should update an existing gateway', async () => {
      const existingGateway = {
        id: 'gateway-id',
        name: 'test-gateway',
        namespace: 'default',
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
      };

      const updatedSpec = {
        gatewayClassName: 'test-class',
        listeners: [
          {
            name: 'http',
            port: 8080,
            protocol: 'HTTP',
          },
          {
            name: 'https',
            port: 443,
            protocol: 'HTTPS',
          },
        ],
      };

      const updateInput = {
        name: 'test-gateway',
        namespace: 'default',
        spec: updatedSpec,
      };

      const updatedGateway = {
        ...existingGateway,
        spec: updatedSpec,
        updatedAt: new Date(),
      };

      mockKubernetesService.getGateway.mockResolvedValue(existingGateway);
      mockKubernetesService.updateGateway.mockResolvedValue(updatedGateway);

      const response = await request(app.getApp())
        .put('/api/gateways/default/test-gateway')
        .send(updateInput)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.spec.listeners).toHaveLength(2);
    });

    it('should return 404 for non-existent gateway', async () => {
      const updateInput = {
        name: 'non-existent',
        namespace: 'default',
        spec: {
          gatewayClassName: 'test-class',
          listeners: [],
        },
      };

      mockKubernetesService.getGateway.mockResolvedValue(null);

      const response = await request(app.getApp())
        .put('/api/gateways/default/non-existent')
        .send(updateInput)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Gateway not found');
    });
  });

  describe('DELETE /api/gateways/:namespace/:name', () => {
    it('should delete an existing gateway', async () => {
      const existingGateway = {
        id: 'gateway-id',
        name: 'test-gateway',
        namespace: 'default',
        status: 'Ready',
        listeners: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        spec: {
          gatewayClassName: 'test-class',
          listeners: [],
        },
      };

      mockKubernetesService.getGateway.mockResolvedValue(existingGateway);
      mockKubernetesService.deleteGateway.mockResolvedValue(undefined);

      const response = await request(app.getApp())
        .delete('/api/gateways/default/test-gateway')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockKubernetesService.deleteGateway).toHaveBeenCalledWith('test-gateway', 'default');
    });

    it('should return 404 for non-existent gateway', async () => {
      mockKubernetesService.getGateway.mockResolvedValue(null);

      const response = await request(app.getApp())
        .delete('/api/gateways/default/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Gateway not found');
    });
  });

  describe('GET /api/gateways/:namespace/:name/status', () => {
    it('should get gateway status', async () => {
      const mockGateway = {
        id: 'gateway-id',
        name: 'test-gateway',
        namespace: 'default',
        status: 'Ready',
        listeners: [
          {
            name: 'http',
            hostname: undefined,
            port: 8080,
            protocol: 'HTTP',
            attachedRoutes: 2,
            conditions: [
              {
                type: 'Ready',
                status: 'True',
                reason: 'Ready',
                message: 'Listener is ready',
                lastTransitionTime: new Date(),
              },
            ],
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        spec: {
          gatewayClassName: 'test-class',
          listeners: [],
        },
        conditions: [
          {
            type: 'Accepted',
            status: 'True',
            reason: 'Accepted',
            message: 'Gateway accepted',
            lastTransitionTime: new Date(),
          },
          {
            type: 'Programmed',
            status: 'True',
            reason: 'Programmed',
            message: 'Gateway programmed',
            lastTransitionTime: new Date(),
          },
        ],
      };

      mockKubernetesService.getGateway.mockResolvedValue(mockGateway);

      const response = await request(app.getApp())
        .get('/api/gateways/default/test-gateway/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('Ready');
      expect(response.body.data.listeners).toHaveLength(1);
      expect(response.body.data.conditions).toHaveLength(2);
    });
  });

  describe('POST /api/gateways/:namespace/:name/validate', () => {
    it('should validate gateway configuration', async () => {
      const validGateway = {
        name: 'test-gateway',
        namespace: 'default',
        spec: {
          gatewayClassName: 'test-class',
          listeners: [
            {
              name: 'http',
              port: 8080,
              protocol: 'HTTP',
            },
            {
              name: 'https',
              port: 443,
              protocol: 'HTTPS',
            },
          ],
        },
      };

      const response = await request(app.getApp())
        .post('/api/gateways/default/test-gateway/validate')
        .send(validGateway)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.errors).toHaveLength(0);
    });

    it('should detect validation errors', async () => {
      const invalidGateway = {
        name: 'test-gateway',
        namespace: 'default',
        spec: {
          gatewayClassName: '', // Missing gateway class
          listeners: [
            {
              name: 'http1',
              port: 8080,
              protocol: 'HTTP',
            },
            {
              name: 'http2',
              port: 8080, // Duplicate port
              protocol: 'HTTP',
            },
          ],
        },
      };

      const response = await request(app.getApp())
        .post('/api/gateways/default/test-gateway/validate')
        .send(invalidGateway)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.errors.length).toBeGreaterThan(0);
    });

    it('should detect invalid protocols', async () => {
      const invalidGateway = {
        name: 'test-gateway',
        namespace: 'default',
        spec: {
          gatewayClassName: 'test-class',
          listeners: [
            {
              name: 'invalid',
              port: 8080,
              protocol: 'INVALID_PROTOCOL',
            },
          ],
        },
      };

      const response = await request(app.getApp())
        .post('/api/gateways/default/test-gateway/validate')
        .send(invalidGateway)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.errors).toContain('Invalid protocol: INVALID_PROTOCOL');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app.getApp())
        .post('/api/gateways')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should include request ID in error responses', async () => {
      mockKubernetesService.listGateways.mockRejectedValue(new Error('Service error'));

      const response = await request(app.getApp())
        .get('/api/gateways')
        .set('X-Request-ID', 'test-request-id')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.headers['x-request-id']).toBe('test-request-id');
    });

    it('should not expose sensitive information in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockKubernetesService.listGateways.mockRejectedValue(new Error('Sensitive error message'));

      const response = await request(app.getApp())
        .get('/api/gateways')
        .expect(500);

      expect(response.body.error.message).toBe('Internal server error');
      expect(response.body.error.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers', async () => {
      mockKubernetesService.listGateways.mockResolvedValue([]);

      const response = await request(app.getApp())
        .get('/api/gateways')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle OPTIONS requests', async () => {
      await request(app.getApp())
        .options('/api/gateways')
        .expect(204);
    });
  });

  describe('Rate Limiting and Security', () => {
    it('should include security headers', async () => {
      mockKubernetesService.listGateways.mockResolvedValue([]);

      const response = await request(app.getApp())
        .get('/api/gateways')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});
