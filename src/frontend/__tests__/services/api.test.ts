import React from 'react';
import { render, screen } from '@testing-library/react';
import { apiService } from '../../src/services/api';

// Reset the mock before any import to fix the mocking issue
jest.resetModules();

// Mock axios with the correct structure
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    request: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

const mockAxiosInstance = jest.requireMock('axios').create();

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful response structure
    mockAxiosInstance.request.mockResolvedValue({
      data: {
        success: true,
        data: {}, // This will be overridden in individual tests
      },
    });
  });

  describe('System Status', () => {
    test('getSystemStatus should return system status', async () => {
      const mockStatus = {
        docker: { connected: true },
        kubernetes: { connected: true },
        envoyGateway: { status: 'running' },
      };

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockStatus,
        },
      });

      const result = await apiService.getSystemStatus();
      expect(result).toEqual(mockStatus);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/status',
      });
    });

    test('getSystemStatus should handle errors', async () => {
      const errorMessage = 'Network error';
      mockAxiosInstance.request.mockRejectedValueOnce(new Error(errorMessage));

      await expect(apiService.getSystemStatus()).rejects.toThrow(errorMessage);
    });
  });

  describe('Container Management', () => {
    test('getContainers should return list of containers', async () => {
      const mockContainers = [
        { id: 'c1', name: 'container1', state: 'running' },
        { id: 'c2', name: 'container2', state: 'stopped' },
      ];

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockContainers,
        },
      });

      const result = await apiService.getContainers();
      expect(result).toEqual(mockContainers);
    });

    test('createContainer should create a new container', async () => {
      const containerConfig = { name: 'new-container', image: 'nginx' };
      const createdContainer = { id: 'c3', ...containerConfig, state: 'running' };

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: createdContainer,
        },
      });

      const result = await apiService.createContainer(containerConfig);
      expect(result).toEqual(createdContainer);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/containers',
        data: containerConfig,
      });
    });

    test('startContainer should start a container', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: undefined,
        },
      });

      await apiService.startContainer('c1');
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/containers/c1/start',
      });
    });

    test('stopContainer should stop a container', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: undefined,
        },
      });

      await apiService.stopContainer('c1');
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/containers/c1/stop',
      });
    });

    test('getContainerLogs should return container logs', async () => {
      const mockLogs = ['log line 1', 'log line 2'];

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockLogs,
        },
      });

      const result = await apiService.getContainerLogs('c1', 50);
      expect(result).toEqual(mockLogs);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/containers/c1/logs',
        params: { tail: 50 },
      });
    });
  });

  describe('Gateway Management', () => {
    test('getGateways should return list of gateways', async () => {
      const mockGateways = [
        { id: 'gw1', name: 'gateway1', namespace: 'default' },
        { id: 'gw2', name: 'gateway2', namespace: 'production' },
      ];

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockGateways,
        },
      });

      const result = await apiService.getGateways();
      expect(result).toEqual(mockGateways);
    });

    test('createGateway should create a new gateway', async () => {
      const gatewayData = { name: 'new-gateway', namespace: 'default' };
      const createdGateway = { id: 'gw3', ...gatewayData };

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: createdGateway,
        },
      });

      const result = await apiService.createGateway(gatewayData);
      expect(result).toEqual(createdGateway);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/gateways',
        data: gatewayData,
      });
    });

    test('deleteGateway should delete a gateway', async () => {
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: undefined,
        },
      });

      await apiService.deleteGateway('default', 'test-gateway');
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/gateways/default/test-gateway',
      });
    });
  });

  describe('HTTP Route Management', () => {
    test('getHTTPRoutes should return list of routes', async () => {
      const mockRoutes = [
        { id: 'r1', name: 'route1', namespace: 'default' },
        { id: 'r2', name: 'route2', namespace: 'production' },
      ];

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockRoutes,
        },
      });

      const result = await apiService.getHTTPRoutes();
      expect(result).toEqual(mockRoutes);
    });

    test('createHTTPRoute should create a new route', async () => {
      const routeData = { name: 'new-route', namespace: 'default' };
      const createdRoute = { id: 'r3', ...routeData };

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: createdRoute,
        },
      });

      const result = await apiService.createHTTPRoute(routeData);
      expect(result).toEqual(createdRoute);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/routes',
        data: routeData,
      });
    });
  });

  describe('Monitoring', () => {
    test('getMetrics should return current metrics', async () => {
      const mockMetrics = {
        timestamp: Date.now(),
        gateways: { total: 5, healthy: 5, unhealthy: 0 },
        routes: { total: 10, attached: 10, detached: 0 },
        traffic: { requestRate: 100, errorRate: 0.1 },
      };

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockMetrics,
        },
      });

      const result = await apiService.getMetrics();
      expect(result).toEqual(mockMetrics);
    });

    test('getLogs should return log entries', async () => {
      const mockLogs = [
        { id: '1', timestamp: '2025-01-01T00:00:00Z', level: 'info', message: 'Test log' },
        { id: '2', timestamp: '2025-01-01T00:01:00Z', level: 'error', message: 'Error log' },
      ];

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockLogs,
        },
      });

      const result = await apiService.getLogs('gateway', 'info', 100);
      expect(result).toEqual(mockLogs);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/monitoring/logs',
        params: { component: 'gateway', level: 'info', limit: 100 },
      });
    });
  });

  describe('Configuration', () => {
    test('validateConfig should validate configuration', async () => {
      const mockValidation = { valid: true };
      const config = { gateway: { name: 'test' } };

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: mockValidation,
        },
      });

      const result = await apiService.validateConfig(config);
      expect(result).toEqual(mockValidation);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/configurations/validate',
        data: config,
      });
    });

    test('applyConfig should apply configuration', async () => {
      const config = { gateway: { name: 'test' } };

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: undefined,
        },
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
      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: false,
          error: 'Custom error message',
        },
      });

      await expect(apiService.getSystemStatus()).rejects.toThrow('Custom error message');
    });

    test('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockAxiosInstance.request.mockRejectedValueOnce(networkError);

      await expect(apiService.getSystemStatus()).rejects.toThrow('Network Error');
    });
  });

  describe('Utility Functions', () => {
    test('convertYamlToJson should convert YAML to JSON', async () => {
      const yaml = 'key: value';
      const expectedJson = { key: 'value' };

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: expectedJson,
        },
      });

      const result = await apiService.convertYamlToJson(yaml);
      expect(result).toEqual(expectedJson);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/utils/yaml-to-json',
        data: { yaml },
      });
    });

    test('convertJsonToYaml should convert JSON to YAML', async () => {
      const json = { key: 'value' };
      const expectedYaml = 'key: value\n';

      mockAxiosInstance.request.mockResolvedValueOnce({
        data: {
          success: true,
          data: expectedYaml,
        },
      });

      const result = await apiService.convertJsonToYaml(json);
      expect(result).toBe(expectedYaml);
      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/utils/json-to-yaml',
        data: { json },
      });
    });
  });
});
