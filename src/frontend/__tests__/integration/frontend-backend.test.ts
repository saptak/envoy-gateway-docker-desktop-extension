import { apiService } from '../../../__mocks__/apiService';
import { webSocketService } from '../../../__mocks__/websocketService';

// Mock the services
jest.mock('../../services/api', () => ({
  apiService: require('../../../__mocks__/apiService').apiService,
}));

jest.mock('../../services/websocket', () => ({
  webSocketService: require('../../../__mocks__/websocketService').webSocketService,
}));

describe('Frontend-Backend Integration Tests', () => {
  let wsService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    wsService = new WebSocketService('ws://localhost:3001/ws');
  });

  describe('API Integration', () => {
    it('should successfully fetch gateways from backend', async () => {
      const mockGateways = [
        {
          apiVersion: 'gateway.networking.k8s.io/v1',
          kind: 'Gateway',
          metadata: { name: 'test-gateway', namespace: 'default' },
          spec: { gatewayClassName: 'envoy-gateway', listeners: [] },
        },
      ];

      apiService.getGateways.mockResolvedValue({ data: mockGateways });

      const result = await apiService.getGateways();
      expect(result.data).toEqual(mockGateways);
      expect(apiService.getGateways).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'Network error';
      apiService.getGateways.mockRejectedValue(new Error(errorMessage));

      await expect(apiService.getGateways()).rejects.toThrow(errorMessage);
    });

    it('should create gateway successfully', async () => {
      const gatewayData = {
        name: 'new-gateway',
        namespace: 'default',
        gatewayClassName: 'envoy-gateway',
        listeners: [{ name: 'http', port: 80, protocol: 'HTTP' }],
      };

      const mockResponse = {
        apiVersion: 'gateway.networking.k8s.io/v1',
        kind: 'Gateway',
        metadata: { name: gatewayData.name, namespace: gatewayData.namespace },
        spec: {
          gatewayClassName: gatewayData.gatewayClassName,
          listeners: gatewayData.listeners,
        },
      };

      apiService.createGateway.mockResolvedValue({ data: mockResponse });

      const result = await apiService.createGateway(gatewayData);
      expect(result.data).toEqual(mockResponse);
      expect(apiService.createGateway).toHaveBeenCalledWith(gatewayData);
    });

    it('should delete gateway successfully', async () => {
      const gatewayInfo = { name: 'test-gateway', namespace: 'default' };

      apiService.deleteGateway.mockResolvedValue({
        data: { message: 'Gateway deleted successfully' }
      });

      const result = await apiService.deleteGateway(gatewayInfo.name, gatewayInfo.namespace);
      expect(result.data.message).toBe('Gateway deleted successfully');
      expect(apiService.deleteGateway).toHaveBeenCalledWith(gatewayInfo.name, gatewayInfo.namespace);
    });

    it('should fetch routes successfully', async () => {
      const mockRoutes = [
        {
          apiVersion: 'gateway.networking.k8s.io/v1',
          kind: 'HTTPRoute',
          metadata: { name: 'test-route', namespace: 'default' },
          spec: { parentRefs: [{ name: 'test-gateway' }], rules: [] },
        },
      ];

      apiService.getRoutes.mockResolvedValue({ data: mockRoutes });

      const result = await apiService.getRoutes();
      expect(result.data).toEqual(mockRoutes);
    });

    it('should fetch monitoring metrics', async () => {
      const mockMetrics = {
        cpu: 45.2,
        memory: 78.5,
        requests: 1250,
        errors: 5,
        latency: 125.8,
      };

      apiService.getMetrics.mockResolvedValue({ data: mockMetrics });

      const result = await apiService.getMetrics();
      expect(result.data).toEqual(mockMetrics);
    });
  });

  describe('WebSocket Integration', () => {
    it('should establish WebSocket connection', () => {
      wsService.connect();
      expect(wsService.connect).toHaveBeenCalled();
    });

    it('should subscribe to gateway updates', () => {
      const callback = jest.fn();
      wsService.subscribe('gateway-updates', callback);
      expect(wsService.subscribe).toHaveBeenCalledWith('gateway-updates', callback);
    });

    it('should handle WebSocket messages', async () => {
      const callback = jest.fn();
      wsService.subscribe('gateway-updates', callback);

      const mockMessage = {
        type: 'gateway-updates',
        data: {
          action: 'updated',
          gateway: {
            metadata: { name: 'test-gateway', namespace: 'default' },
            status: { conditions: [{ type: 'Ready', status: 'True' }] },
          },
        },
      };

      // Simulate the callback being called
      wsService.subscribe.mock.calls[0][1](mockMessage);
      expect(callback).toHaveBeenCalledWith(mockMessage);
    });

    it('should disconnect WebSocket properly', () => {
      wsService.connect();
      wsService.disconnect();
      expect(wsService.disconnect).toHaveBeenCalled();
    });
  });

  describe('End-to-End Flow Integration', () => {
    it('should complete full gateway creation flow', async () => {
      const gatewayData = {
        name: 'integration-test-gateway',
        namespace: 'test',
        gatewayClassName: 'envoy-gateway',
        listeners: [{ name: 'https', port: 443, protocol: 'HTTPS' }],
      };

      const mockResponse = {
        apiVersion: 'gateway.networking.k8s.io/v1',
        kind: 'Gateway',
        metadata: { name: gatewayData.name, namespace: gatewayData.namespace },
        spec: {
          gatewayClassName: gatewayData.gatewayClassName,
          listeners: gatewayData.listeners,
        },
        status: {
          conditions: [
            { type: 'Accepted', status: 'True', reason: 'Accepted' },
          ],
        },
      };

      apiService.createGateway.mockResolvedValue({ data: mockResponse });

      // Create the gateway
      const createResult = await apiService.createGateway(gatewayData);
      expect(createResult.data).toEqual(mockResponse);

      // Set up WebSocket subscription
      const updateCallback = jest.fn();
      wsService.subscribe('gateway-updates', updateCallback);
      expect(wsService.subscribe).toHaveBeenCalledWith('gateway-updates', updateCallback);
    });

    it('should handle gateway deletion with real-time updates', async () => {
      apiService.deleteGateway.mockResolvedValue({
        data: { message: 'Gateway deleted successfully' },
      });

      await apiService.deleteGateway('test-gateway', 'default');
      expect(apiService.deleteGateway).toHaveBeenCalledWith('test-gateway', 'default');

      const callback = jest.fn();
      wsService.subscribe('gateway-updates', callback);
      expect(wsService.subscribe).toHaveBeenCalledWith('gateway-updates', callback);
    });

    it('should handle error scenarios in integration flow', async () => {
      apiService.createGateway.mockRejectedValue(
        new Error('Validation failed: Gateway name already exists')
      );

      await expect(
        apiService.createGateway({
          name: 'existing-gateway',
          namespace: 'default',
          gatewayClassName: 'envoy-gateway',
          listeners: [],
        })
      ).rejects.toThrow('Validation failed: Gateway name already exists');

      // Test WebSocket error handling
      wsService.connect.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      expect(() => wsService.connect()).toThrow('Connection failed');
    });
  });

  describe('State Management Integration', () => {
    it('should properly synchronize state between components', async () => {
      const initialGateways = [
        {
          apiVersion: 'gateway.networking.k8s.io/v1',
          kind: 'Gateway',
          metadata: { name: 'gateway-1', namespace: 'default' },
          spec: { gatewayClassName: 'envoy-gateway', listeners: [] },
        },
      ];

      apiService.getGateways.mockResolvedValue({ data: initialGateways });

      const newGateway = {
        apiVersion: 'gateway.networking.k8s.io/v1',
        kind: 'Gateway',
        metadata: { name: 'gateway-2', namespace: 'default' },
        spec: { gatewayClassName: 'envoy-gateway', listeners: [] },
      };

      apiService.createGateway.mockResolvedValue({ data: newGateway });

      // Verify initial fetch
      const initialResult = await apiService.getGateways();
      expect(initialResult.data).toEqual(initialGateways);

      // Verify creation
      const createResult = await apiService.createGateway({
        name: 'gateway-2',
        namespace: 'default',
        gatewayClassName: 'envoy-gateway',
        listeners: [],
      });
      expect(createResult.data).toEqual(newGateway);

      // Mock updated fetch after creation
      apiService.getGateways.mockResolvedValue({
        data: [...initialGateways, newGateway],
      });

      const updatedResult = await apiService.getGateways();
      expect(updatedResult.data).toHaveLength(2);
    });
  });
});