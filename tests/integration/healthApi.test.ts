import request from 'supertest';
import { Application } from '../../src/backend/index';
import { KubernetesService } from '../../src/backend/services/kubernetesService';
import { DockerService } from '../../src/backend/services/dockerService';

// Mock services
jest.mock('../../src/backend/services/kubernetesService');
jest.mock('../../src/backend/services/dockerService');

describe('Health API Integration Tests', () => {
  let app: Application;
  let mockKubernetesService: jest.Mocked<KubernetesService>;
  let mockDockerService: jest.Mocked<DockerService>;

  beforeAll(async () => {
    // Mock service instances
    mockKubernetesService = {
      healthCheck: jest.fn(),
      getClusterInfo: jest.fn(),
      listNamespaces: jest.fn(),
      isEnvoyGatewayInstalled: jest.fn(),
    } as any;

    mockDockerService = {
      healthCheck: jest.fn(),
      listContainers: jest.fn(),
      listImages: jest.fn(),
      listNetworks: jest.fn(),
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

  describe('GET /api/health', () => {
    it('should return healthy status when all services are healthy', async () => {
      mockKubernetesService.healthCheck.mockResolvedValue({
        status: 'healthy',
        version: 'v1.25.0',
        details: {
          platform: 'linux/amd64',
          namespaceCount: 5,
          envoyGatewayInstalled: true,
        },
      });

      mockDockerService.healthCheck.mockResolvedValue({
        status: 'healthy',
        version: '20.10.0',
        details: {
          apiVersion: '1.41',
          gitCommit: 'abc123',
          goVersion: 'go1.17',
          os: 'linux',
          arch: 'amd64',
        },
      });

      const response = await request(app.getApp())
        .get('/api/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.services.kubernetes.status).toBe('healthy');
      expect(response.body.data.services.docker.status).toBe('healthy');
      expect(response.body.data.metadata).toBeDefined();
      expect(response.body.data.metadata.version).toBeDefined();
      expect(response.body.data.metadata.responseTime).toMatch(/\d+ms/);
      expect(response.body.data.metadata.uptime).toBeDefined();
      expect(response.body.data.metadata.memoryUsage).toBeDefined();
    });

    it('should return degraded status when one service is unhealthy', async () => {
      mockKubernetesService.healthCheck.mockResolvedValue({
        status: 'healthy',
        version: 'v1.25.0',
      });

      mockDockerService.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        details: { error: 'Connection failed' },
      });

      const response = await request(app.getApp())
        .get('/api/health')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('degraded');
      expect(response.body.data.services.kubernetes.status).toBe('healthy');
      expect(response.body.data.services.docker.status).toBe('unhealthy');
    });

    it('should return unhealthy status when all services are unhealthy', async () => {
      mockKubernetesService.healthCheck.mockRejectedValue(new Error('K8s connection failed'));
      mockDockerService.healthCheck.mockRejectedValue(new Error('Docker connection failed'));

      const response = await request(app.getApp())
        .get('/api/health')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
    });

    it('should handle health check errors gracefully', async () => {
      mockKubernetesService.healthCheck.mockRejectedValue(new Error('Unexpected error'));
      mockDockerService.healthCheck.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app.getApp())
        .get('/api/health')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Health check failed');
    });

    it('should measure response time accurately', async () => {
      // Add some delay to health checks
      mockKubernetesService.healthCheck.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({ status: 'healthy' }), 100)
        )
      );
      mockDockerService.healthCheck.mockResolvedValue({ status: 'healthy' });

      const startTime = Date.now();
      const response = await request(app.getApp())
        .get('/api/health')
        .expect(200);
      const endTime = Date.now();

      const responseTime = parseInt(response.body.data.metadata.responseTime.replace('ms', ''));
      const actualTime = endTime - startTime;

      // Response time should be within reasonable bounds
      expect(responseTime).toBeGreaterThan(90);
      expect(responseTime).toBeLessThan(actualTime + 50);
    });
  });

  describe('GET /api/health/liveness', () => {
    it('should return alive status', async () => {
      const response = await request(app.getApp())
        .get('/api/health/liveness')
        .expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
    });

    it('should always return 200 for liveness probe', async () => {
      // Even if services are down, liveness should return 200
      await request(app.getApp())
        .get('/api/health/liveness')
        .expect(200);
    });
  });

  describe('GET /api/health/readiness', () => {
    it('should return ready status when all services are healthy', async () => {
      mockKubernetesService.healthCheck.mockResolvedValue({ status: 'healthy' });
      mockDockerService.healthCheck.mockResolvedValue({ status: 'healthy' });

      const response = await request(app.getApp())
        .get('/api/health/readiness')
        .expect(200);

      expect(response.body.status).toBe('ready');
      expect(response.body.services.kubernetes).toBe('healthy');
      expect(response.body.services.docker).toBe('healthy');
    });

    it('should return not-ready status when services are unhealthy', async () => {
      mockKubernetesService.healthCheck.mockResolvedValue({ status: 'unhealthy' });
      mockDockerService.healthCheck.mockResolvedValue({ status: 'healthy' });

      const response = await request(app.getApp())
        .get('/api/health/readiness')
        .expect(503);

      expect(response.body.status).toBe('not-ready');
    });

    it('should handle readiness check errors', async () => {
      mockKubernetesService.healthCheck.mockRejectedValue(new Error('Health check failed'));
      mockDockerService.healthCheck.mockRejectedValue(new Error('Health check failed'));

      const response = await request(app.getApp())
        .get('/api/health/readiness')
        .expect(503);

      expect(response.body.status).toBe('not-ready');
      expect(response.body.error).toBe('Readiness check failed');
    });
  });

  describe('GET /api/health/kubernetes', () => {
    it('should return detailed Kubernetes health information', async () => {
      mockKubernetesService.healthCheck.mockResolvedValue({
        status: 'healthy',
        version: 'v1.25.0',
        details: {
          platform: 'linux/amd64',
          namespaceCount: 5,
          envoyGatewayInstalled: true,
        },
      });

      mockKubernetesService.getClusterInfo.mockResolvedValue({
        version: {
          gitVersion: 'v1.25.0',
          platform: 'linux/amd64',
        },
        nodeCount: 3,
        nodes: [
          { name: 'node1', status: 'Ready', version: 'v1.25.0' },
          { name: 'node2', status: 'Ready', version: 'v1.25.0' },
          { name: 'node3', status: 'Ready', version: 'v1.25.0' },
        ],
      });

      mockKubernetesService.listNamespaces.mockResolvedValue([
        'default',
        'kube-system',
        'kube-public',
        'kube-node-lease',
        'envoy-gateway-system',
      ]);

      const response = await request(app.getApp())
        .get('/api/health/kubernetes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.version).toBe('v1.25.0');
      expect(response.body.data.cluster).toBeDefined();
      expect(response.body.data.namespaceCount).toBe(5);
      expect(response.body.data.envoyGatewayInstalled).toBe(true);
    });

    it('should return unhealthy status when Kubernetes is not accessible', async () => {
      mockKubernetesService.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        details: { error: 'Connection refused' },
      });

      const response = await request(app.getApp())
        .get('/api/health/kubernetes')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
    });
  });

  describe('GET /api/health/docker', () => {
    it('should return detailed Docker health information', async () => {
      mockDockerService.healthCheck.mockResolvedValue({
        status: 'healthy',
        version: '20.10.0',
        details: {
          apiVersion: '1.41',
          gitCommit: 'abc123',
          goVersion: 'go1.17',
          os: 'linux',
          arch: 'amd64',
        },
      });

      mockDockerService.listContainers.mockResolvedValue([
        { id: 'c1', name: 'container1', state: 'running' },
        { id: 'c2', name: 'container2', state: 'exited' },
        { id: 'c3', name: 'container3', state: 'running' },
      ] as any);

      mockDockerService.listImages.mockResolvedValue([
        { Id: 'i1', RepoTags: ['nginx:latest'] },
        { Id: 'i2', RepoTags: ['redis:latest'] },
      ]);

      mockDockerService.listNetworks.mockResolvedValue([
        { Id: 'n1', Name: 'bridge' },
        { Id: 'n2', Name: 'host' },
      ]);

      const response = await request(app.getApp())
        .get('/api/health/docker')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.version).toBe('20.10.0');
      expect(response.body.data.containers.total).toBe(3);
      expect(response.body.data.containers.running).toBe(2);
      expect(response.body.data.containers.stopped).toBe(1);
      expect(response.body.data.images.total).toBe(2);
      expect(response.body.data.networks.total).toBe(2);
    });

    it('should return unhealthy status when Docker is not accessible', async () => {
      mockDockerService.healthCheck.mockResolvedValue({
        status: 'unhealthy',
        details: { error: 'Docker daemon not running' },
      });

      const response = await request(app.getApp())
        .get('/api/health/docker')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('unhealthy');
    });
  });

  describe('GET /api/health/metrics', () => {
    it('should return system metrics', async () => {
      const response = await request(app.getApp())
        .get('/api/health/metrics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.system).toBeDefined();
      expect(response.body.data.system.uptime).toBeDefined();
      expect(response.body.data.system.memoryUsage).toBeDefined();
      expect(response.body.data.system.cpuUsage).toBeDefined();
      expect(response.body.data.system.platform).toBeDefined();
      expect(response.body.data.system.arch).toBeDefined();
      expect(response.body.data.system.nodeVersion).toBeDefined();

      expect(response.body.data.application).toBeDefined();
      expect(response.body.data.application.version).toBeDefined();
      expect(response.body.data.application.environment).toBeDefined();
      expect(response.body.data.application.pid).toBeDefined();

      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should include memory usage details', async () => {
      const response = await request(app.getApp())
        .get('/api/health/metrics')
        .expect(200);

      const memoryUsage = response.body.data.system.memoryUsage;
      expect(memoryUsage.rss).toBeDefined();
      expect(memoryUsage.heapTotal).toBeDefined();
      expect(memoryUsage.heapUsed).toBeDefined();
      expect(memoryUsage.external).toBeDefined();
    });

    it('should include CPU usage information', async () => {
      const response = await request(app.getApp())
        .get('/api/health/metrics')
        .expect(200);

      const cpuUsage = response.body.data.system.cpuUsage;
      expect(cpuUsage.user).toBeDefined();
      expect(cpuUsage.system).toBeDefined();
    });
  });

  describe('POST /api/health/ping', () => {
    it('should respond to ping requests', async () => {
      const response = await request(app.getApp())
        .post('/api/health/ping')
        .send({ message: 'Hello' })
        .expect(200);

      expect(response.body.pong).toBe(true);
      expect(response.body.message).toBe('Hello');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle ping without message', async () => {
      const response = await request(app.getApp())
        .post('/api/health/ping')
        .send({})
        .expect(200);

      expect(response.body.pong).toBe(true);
      expect(response.body.message).toBe('pong');
    });

    it('should include request ID in ping response', async () => {
      const response = await request(app.getApp())
        .post('/api/health/ping')
        .set('X-Request-ID', 'ping-test-id')
        .send({ message: 'test' })
        .expect(200);

      expect(response.body.requestId).toBe('ping-test-id');
    });
  });

  describe('Health Check Caching and Performance', () => {
    it('should complete health checks within reasonable time', async () => {
      mockKubernetesService.healthCheck.mockResolvedValue({ status: 'healthy' });
      mockDockerService.healthCheck.mockResolvedValue({ status: 'healthy' });

      const startTime = Date.now();
      await request(app.getApp())
        .get('/api/health')
        .expect(200);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent health check requests', async () => {
      mockKubernetesService.healthCheck.mockResolvedValue({ status: 'healthy' });
      mockDockerService.healthCheck.mockResolvedValue({ status: 'healthy' });

      const requests = Array.from({ length: 10 }, () =>
        request(app.getApp()).get('/api/health')
      );

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });

  describe('Health Status Consistency', () => {
    it('should maintain consistent health status format', async () => {
      mockKubernetesService.healthCheck.mockResolvedValue({
        status: 'healthy',
        version: 'v1.25.0',
      });
      mockDockerService.healthCheck.mockResolvedValue({
        status: 'healthy',
        version: '20.10.0',
      });

      const response = await request(app.getApp())
        .get('/api/health')
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');

      // Verify data structure
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('services');
      expect(response.body.data).toHaveProperty('metadata');

      // Verify services structure
      expect(response.body.data.services).toHaveProperty('kubernetes');
      expect(response.body.data.services).toHaveProperty('docker');

      // Verify metadata structure
      expect(response.body.data.metadata).toHaveProperty('timestamp');
      expect(response.body.data.metadata).toHaveProperty('responseTime');
      expect(response.body.data.metadata).toHaveProperty('version');
      expect(response.body.data.metadata).toHaveProperty('uptime');
    });
  });

  describe('Error Conditions', () => {
    it('should handle service timeouts gracefully', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'TimeoutError';
      
      mockKubernetesService.healthCheck.mockRejectedValue(timeoutError);
      mockDockerService.healthCheck.mockResolvedValue({ status: 'healthy' });

      const response = await request(app.getApp())
        .get('/api/health')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.data.status).toBe('degraded');
    });

    it('should handle partial failures in detailed health checks', async () => {
      mockDockerService.healthCheck.mockResolvedValue({ status: 'healthy' });
      mockDockerService.listContainers.mockRejectedValue(new Error('Failed to list containers'));
      mockDockerService.listImages.mockResolvedValue([]);
      mockDockerService.listNetworks.mockResolvedValue([]);

      const response = await request(app.getApp())
        .get('/api/health/docker')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should still return healthy status despite partial failure in additional data
    });
  });
});
