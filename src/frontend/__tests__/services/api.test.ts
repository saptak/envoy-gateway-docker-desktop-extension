import { apiService } from '../../services/api';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    request: jest.fn(),
  })),
}));

describe('ApiService', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosInstance = {
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      request: jest.fn(),
    };
    (require('axios').create as jest.Mock).mockReturnValue(mockAxiosInstance);
  });

  describe('System Status', () => {
    test('getSystemStatus should return system status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            docker: { connected: true },
            kubernetes: { connected: true },
            envoyGateway: { status: 'running' },
          },
        },
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await apiService.getSystemStatus();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/status',
      });
      expect(result).toEqual(mockResponse.data.data);
    });

    test('getSystemStatus should handle errors', async () => {
      const mockError = new Error('Network error');
      mockAxiosInstance.request.mockRejectedValue(mockError);

      await expect(apiService.getSystemStatus()).rejects.toThrow('Network error');
    });
  });

  describe('Container Management', () => {
    test('getContainers should return list of containers', async () => {
      const mockContainers = [
        { id: 'container1', name: 'test1', state: 'running' },
        { id: 'container2', name: 'test2', state: 'stopped' },
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockContainers },
      });

      const result = await apiService.getContainers();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/containers',
      });
      expect(result).toEqual(mockContainers);
    });

    test('createContainer should create a new container', async () => {
      const containerConfig = { image: 'nginx', name: 'test-nginx' };
      const mockResponse = { id: 'new-container', ...containerConfig };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const result = await apiService.createContainer(containerConfig);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/containers',
        data: containerConfig,
      });
      expect(result).toEqual(mockResponse);
    });

    test('startContainer should start a container', async () => {
      const containerId = 'test-container';

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: undefined },
      });

      await apiService.startContainer(containerId);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: `/containers/${containerId}/start`,
      });
    });

    test('stopContainer should stop a container', async () => {
      const containerId = 'test-container';

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: undefined },
      });

      await apiService.stopContainer(containerId);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: `/containers/${containerId}/stop`,
      });
    });

    test('getContainerLogs should return container logs', async () => {
      const containerId = 'test-container';
      const mockLogs = ['log line 1', 'log line 2', 'log line 3'];

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockLogs },
      });

      const result = await apiService.getContainerLogs(containerId, 50);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: `/containers/${containerId}/logs`,
        params: { tail: 50 },
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('Gateway Management', () => {
    test('getGateways should return list of gateways', async () => {
      const mockGateways = [
        { id: 'gw1', name: 'gateway1', namespace: 'default' },
        { id: 'gw2', name: 'gateway2', namespace: 'production' },
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockGateways },
      });

      const result = await apiService.getGateways();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/gateways',
      });
      expect(result).toEqual(mockGateways);
    });

    test('createGateway should create a new gateway', async () => {
      const gatewayData = { name: 'new-gateway', namespace: 'default' };
      const mockResponse = { id: 'new-gw-id', ...gatewayData };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const result = await apiService.createGateway(gatewayData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/gateways',
        data: gatewayData,
      });
      expect(result).toEqual(mockResponse);
    });

    test('deleteGateway should delete a gateway', async () => {
      const namespace = 'default';
      const name = 'test-gateway';

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: undefined },
      });

      await apiService.deleteGateway(namespace, name);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: `/gateways/${namespace}/${name}`,
      });
    });
  });

  describe('HTTP Route Management', () => {
    test('getHTTPRoutes should return list of routes', async () => {
      const mockRoutes = [
        { id: 'route1', name: 'api-route', namespace: 'default' },
        { id: 'route2', name: 'web-route', namespace: 'default' },
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockRoutes },
      });

      const result = await apiService.getHTTPRoutes();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/routes',
      });
      expect(result).toEqual(mockRoutes);
    });

    test('createHTTPRoute should create a new route', async () => {
      const routeData = { name: 'new-route', namespace: 'default' };
      const mockResponse = { id: 'new-route-id', ...routeData };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const result = await apiService.createHTTPRoute(routeData);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/routes',
        data: routeData,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Monitoring', () => {
    test('getMetrics should return current metrics', async () => {
      const mockMetrics = {
        timestamp: Date.now(),
        gateways: { total: 2, healthy: 2, unhealthy: 0 },
        routes: { total: 5, attached: 5, detached: 0 },
        traffic: { requestRate: 100, errorRate: 0.1 },
      };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockMetrics },
      });

      const result = await apiService.getMetrics();

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/monitoring/metrics',
      });
      expect(result).toEqual(mockMetrics);
    });

    test('getLogs should return log entries', async () => {
      const mockLogs = [
        { id: '1', timestamp: '2025-01-01T00:00:00Z', level: 'info', message: 'Test log' },
        { id: '2', timestamp: '2025-01-01T00:01:00Z', level: 'error', message: 'Error log' },
      ];

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockLogs },
      });

      const result = await apiService.getLogs('gateway', 'info', 100);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/monitoring/logs',
        params: { component: 'gateway', level: 'info', limit: 100 },
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('Configuration', () => {
    test('validateConfig should validate configuration', async () => {
      const config = { apiVersion: 'v1', kind: 'Gateway' };
      const mockResponse = { valid: true, errors: [] };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const result = await apiService.validateConfig(config);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/configurations/validate',
        data: config,
      });
      expect(result).toEqual(mockResponse);
    });

    test('applyConfig should apply configuration', async () => {
      const config = { apiVersion: 'v1', kind: 'Gateway' };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: undefined },
      });

      await apiService.applyConfig(config);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/configurations/apply',
        data: config,
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors with error message', async () => {
      mockAxiosInstance.request.mockResolvedValue({
        data: { success: false, error: 'Custom error message' },
      });

      await expect(apiService.getSystemStatus()).rejects.toThrow('Custom error message');
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.request.mockRejectedValue(networkError);

      await expect(apiService.getSystemStatus()).rejects.toThrow('Network Error');
    });
  });

  describe('Utility Functions', () => {
    test('convertYamlToJson should convert YAML to JSON', async () => {
      const yaml = 'apiVersion: v1\nkind: Gateway';
      const mockResponse = { apiVersion: 'v1', kind: 'Gateway' };

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const result = await apiService.convertYamlToJson(yaml);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/utils/yaml-to-json',
        data: { yaml },
      });
      expect(result).toEqual(mockResponse);
    });

    test('convertJsonToYaml should convert JSON to YAML', async () => {
      const json = { apiVersion: 'v1', kind: 'Gateway' };
      const mockResponse = 'apiVersion: v1\nkind: Gateway';

      mockAxiosInstance.request.mockResolvedValue({
        data: { success: true, data: mockResponse },
      });

      const result = await apiService.convertJsonToYaml(json);

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/utils/json-to-yaml',
        data: { json },
      });
      expect(result).toEqual(mockResponse);
    });
  });
});
