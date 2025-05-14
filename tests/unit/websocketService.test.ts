import { jest } from '@jest/globals';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketService } from '../../src/backend/services/websocketService';
import { KubernetesService } from '../../src/backend/services/kubernetesService';
import { DockerService } from '../../src/backend/services/dockerService';
import { Gateway, HTTPRoute, GatewayEvent, RouteEvent, GatewayStatus, RouteStatus } from '../../src/shared/types';

// Mock Socket.IO
const mockSocket = {
  id: 'socket-id',
  emit: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
};

const mockIO = {
  on: jest.fn(),
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
} as any;

// Mock services
jest.mock('../../src/backend/services/kubernetesService');
jest.mock('../../src/backend/services/dockerService');

describe('WebSocketService', () => {
  let webSocketService: WebSocketService;
  let mockKubernetesService: jest.Mocked<KubernetesService>;
  let mockDockerService: jest.Mocked<DockerService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock service instances
    mockKubernetesService = {
      on: jest.fn(),
      listGateways: jest.fn(),
      listHTTPRoutes: jest.fn(),
      getClusterInfo: jest.fn(),
      healthCheck: jest.fn(),
    } as any;
    
    mockDockerService = {
      on: jest.fn(),
      healthCheck: jest.fn(),
    } as any;
    
    // Mock service getInstance methods
    (KubernetesService.getInstance as jest.Mock).mockReturnValue(mockKubernetesService);
    (DockerService.getInstance as jest.Mock).mockReturnValue(mockDockerService);
    
    // Create WebSocket service instance
    webSocketService = new WebSocketService(mockIO);
  });

  describe('Initialization', () => {
    it('should initialize WebSocket service correctly', () => {
      webSocketService.initialize();
      
      expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(mockKubernetesService.on).toHaveBeenCalledTimes(6); // All gateway and route events
      expect(mockDockerService.on).toHaveBeenCalledTimes(4); // All container events
    });
  });

  describe('Connection Management', () => {
    it('should handle client connection', () => {
      webSocketService.initialize();
      
      // Simulate connection
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      connectionHandler(mockSocket);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.objectContaining({
        clientId: 'socket-id',
        timestamp: expect.any(Number),
        message: 'Connected to Envoy Gateway Extension',
      }));
      
      expect(webSocketService.getClientCount()).toBe(1);
    });

    it('should handle client disconnection', () => {
      webSocketService.initialize();
      
      // Simulate connection and disconnection
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      connectionHandler(mockSocket);
      
      expect(webSocketService.getClientCount()).toBe(1);
      
      // Find disconnect handler and call it
      const disconnectCall = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect');
      if (disconnectCall) {
        disconnectCall[1]();
      }
      
      expect(webSocketService.getClientCount()).toBe(0);
    });

    it('should handle subscription to channels', () => {
      webSocketService.initialize();
      
      // Simulate connection
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      connectionHandler(mockSocket);
      
      // Find subscribe handler and call it
      const subscribeCall = mockSocket.on.mock.calls.find(call => call[0] === 'subscribe');
      if (subscribeCall) {
        subscribeCall[1]('gateways');
      }
      
      expect(mockSocket.join).toHaveBeenCalledWith('gateways');
      expect(mockSocket.emit).toHaveBeenCalledWith('subscribed', {
        channel: 'gateways',
        timestamp: expect.any(Number),
      });
    });

    it('should handle unsubscription from channels', () => {
      webSocketService.initialize();
      
      // Simulate connection and subscription
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      connectionHandler(mockSocket);
      
      const subscribeCall = mockSocket.on.mock.calls.find(call => call[0] === 'subscribe');
      if (subscribeCall) {
        subscribeCall[1]('gateways');
      }
      
      // Unsubscribe
      const unsubscribeCall = mockSocket.on.mock.calls.find(call => call[0] === 'unsubscribe');
      if (unsubscribeCall) {
        unsubscribeCall[1]('gateways');
      }
      
      expect(mockSocket.leave).toHaveBeenCalledWith('gateways');
      expect(mockSocket.emit).toHaveBeenCalledWith('unsubscribed', {
        channel: 'gateways',
        timestamp: expect.any(Number),
      });
    });

    it('should handle ping/pong', () => {
      webSocketService.initialize();
      
      // Simulate connection
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      connectionHandler(mockSocket);
      
      // Find ping handler and call it
      const pingCall = mockSocket.on.mock.calls.find(call => call[0] === 'ping');
      if (pingCall) {
        pingCall[1]();
      }
      
      expect(mockSocket.emit).toHaveBeenCalledWith('pong', {
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Initial Data Sending', () => {
    it('should send initial data on connection', async () => {
      const mockGateways: Gateway[] = [
        {
          id: 'gateway1',
          name: 'test-gateway',
          namespace: 'default',
          status: GatewayStatus.READY,
          listeners: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          spec: {
            gatewayClassName: 'test-class',
            listeners: [],
          },
        },
      ];
      
      const mockRoutes: HTTPRoute[] = [
        {
          id: 'route1',
          name: 'test-route',
          namespace: 'default',
          status: RouteStatus.ACCEPTED,
          parentRefs: [],
          rules: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      const mockClusterInfo = {
        version: { gitVersion: 'v1.25.0' },
        nodeCount: 1,
        nodes: [],
      };
      
      mockKubernetesService.listGateways.mockResolvedValue(mockGateways);
      mockKubernetesService.listHTTPRoutes.mockResolvedValue(mockRoutes);
      mockKubernetesService.getClusterInfo.mockResolvedValue(mockClusterInfo);
      
      webSocketService.initialize();
      
      // Simulate connection
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      await connectionHandler(mockSocket);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockSocket.emit).toHaveBeenCalledWith('initialData', {
        type: 'gateways',
        data: mockGateways,
        timestamp: expect.any(Number),
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('initialData', {
        type: 'routes',
        data: mockRoutes,
        timestamp: expect.any(Number),
      });
      
      expect(mockSocket.emit).toHaveBeenCalledWith('initialData', {
        type: 'clusterInfo',
        data: mockClusterInfo,
        timestamp: expect.any(Number),
      });
    });

    it('should handle error when sending initial data', async () => {
      mockKubernetesService.listGateways.mockRejectedValue(new Error('Failed to list gateways'));
      
      webSocketService.initialize();
      
      // Simulate connection
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      await connectionHandler(mockSocket);
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        message: 'Failed to load initial data',
        error: 'Failed to list gateways',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast gateway events', () => {
      webSocketService.initialize();
      
      const mockGateway: Gateway = {
        id: 'gateway1',
        name: 'test-gateway',
        namespace: 'default',
        status: GatewayStatus.READY,
        listeners: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        spec: {
          gatewayClassName: 'test-class',
          listeners: [],
        },
      };
      
      // Find and call the gatewayCreated event handler
      const gatewayCreatedCall = mockKubernetesService.on.mock.calls
        .find(call => call[0] === 'gatewayCreated');
      
      if (gatewayCreatedCall) {
        gatewayCreatedCall[1](mockGateway);
      }
      
      expect(mockIO.to).toHaveBeenCalledWith('gateways');
      expect(mockIO.emit).toHaveBeenCalledWith('message', {
        type: 'GATEWAY_CREATED',
        data: { gateway: mockGateway },
        timestamp: expect.any(Number),
      });
    });

    it('should broadcast route events', () => {
      webSocketService.initialize();
      
      const mockRoute: HTTPRoute = {
        id: 'route1',
        name: 'test-route',
        namespace: 'default',
        status: RouteStatus.ACCEPTED,
        parentRefs: [{ name: 'test-gateway' }],
        rules: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Find and call the routeCreated event handler
      const routeCreatedCall = mockKubernetesService.on.mock.calls
        .find(call => call[0] === 'routeCreated');
      
      if (routeCreatedCall) {
        routeCreatedCall[1](mockRoute);
      }
      
      expect(mockIO.to).toHaveBeenCalledWith('routes');
      expect(mockIO.emit).toHaveBeenCalledWith('message', {
        type: 'ROUTE_CREATED',
        data: { route: mockRoute, gatewayId: 'test-gateway' },
        timestamp: expect.any(Number),
      });
    });

    it('should broadcast docker events', () => {
      webSocketService.initialize();
      
      const containerId = 'container123';
      
      // Find and call the containerCreated event handler
      const containerCreatedCall = mockDockerService.on.mock.calls
        .find(call => call[0] === 'containerCreated');
      
      if (containerCreatedCall) {
        containerCreatedCall[1](containerId);
      }
      
      expect(mockIO.to).toHaveBeenCalledWith('docker');
      expect(mockIO.emit).toHaveBeenCalledWith('message', {
        type: 'CONTAINER_CREATED',
        data: { containerId },
        timestamp: expect.any(Number),
      });
    });
  });

  describe('Direct Message Sending', () => {
    it('should send message to specific client', () => {
      webSocketService.initialize();
      
      // Simulate connection to get a client
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      connectionHandler(mockSocket);
      
      const message = {
        type: 'TEST_MESSAGE',
        data: { test: 'data' },
        timestamp: Date.now(),
      };
      
      webSocketService.sendToClient('socket-id', message);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('message', message);
    });

    it('should handle non-existent client gracefully', () => {
      webSocketService.initialize();
      
      const message = {
        type: 'TEST_MESSAGE',
        data: { test: 'data' },
        timestamp: Date.now(),
      };
      
      // Should not throw error
      expect(() => {
        webSocketService.sendToClient('non-existent', message);
      }).not.toThrow();
    });

    it('should send message to channel', () => {
      webSocketService.initialize();
      
      const message = {
        type: 'TEST_MESSAGE',
        data: { test: 'data' },
        timestamp: Date.now(),
      };
      
      webSocketService.sendToChannel('test-channel', message);
      
      expect(mockIO.to).toHaveBeenCalledWith('test-channel');
      expect(mockIO.emit).toHaveBeenCalledWith('message', message);
    });

    it('should send message to all clients', () => {
      webSocketService.initialize();
      
      const message = {
        type: 'TEST_MESSAGE',
        data: { test: 'data' },
        timestamp: Date.now(),
      };
      
      webSocketService.sendToAll(message);
      
      expect(mockIO.emit).toHaveBeenCalledWith('message', message);
    });
  });

  describe('System Status', () => {
    it('should send system status to all clients', async () => {
      const kubernetesHealth = { status: 'healthy', version: 'v1.25.0' };
      const dockerHealth = { status: 'healthy', version: '20.10.0' };
      
      mockKubernetesService.healthCheck.mockResolvedValue(kubernetesHealth);
      mockDockerService.healthCheck.mockResolvedValue(dockerHealth);
      
      webSocketService.initialize();
      
      await webSocketService.sendSystemStatus();
      
      expect(mockIO.emit).toHaveBeenCalledWith('message', {
        type: 'SYSTEM_STATUS',
        data: {
          kubernetes: kubernetesHealth,
          docker: dockerHealth,
          timestamp: expect.any(Number),
        },
        timestamp: expect.any(Number),
      });
    });

    it('should handle system status error gracefully', async () => {
      mockKubernetesService.healthCheck.mockRejectedValue(new Error('Health check failed'));
      mockDockerService.healthCheck.mockResolvedValue({ status: 'healthy' });
      
      webSocketService.initialize();
      
      // Should not throw error
      await expect(webSocketService.sendSystemStatus()).resolves.not.toThrow();
    });
  });

  describe('Connection Monitoring', () => {
    it('should monitor connections and return statistics', async () => {
      webSocketService.initialize();
      
      // Simulate multiple connections
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      
      const mockSocket1 = { ...mockSocket, id: 'socket1' };
      const mockSocket2 = { ...mockSocket, id: 'socket2' };
      
      connectionHandler(mockSocket1);
      connectionHandler(mockSocket2);
      
      // Subscribe to channels
      const subscribeCall1 = mockSocket1.on.mock.calls.find(call => call[0] === 'subscribe');
      const subscribeCall2 = mockSocket2.on.mock.calls.find(call => call[0] === 'subscribe');
      
      if (subscribeCall1) subscribeCall1[1]('gateways');
      if (subscribeCall2) subscribeCall2[1]('routes');
      
      const stats = await webSocketService.monitorConnections();
      
      expect(stats.clientCount).toBe(2);
      expect(stats.averageConnectedTime).toBeGreaterThanOrEqual(0);
      expect(stats.subscriptionStats).toEqual({
        gateways: 1,
        routes: 1,
      });
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      webSocketService.initialize();
      
      // Simulate connection
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      connectionHandler(mockSocket);
      
      await webSocketService.shutdown();
      
      expect(mockIO.emit).toHaveBeenCalledWith('message', {
        type: 'SHUTDOWN',
        data: { message: 'Server is shutting down' },
        timestamp: expect.any(Number),
      });
      
      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(webSocketService.getClientCount()).toBe(0);
    });
  });

  describe('Heartbeat', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should send heartbeat to all clients', () => {
      webSocketService.initialize();
      
      // Simulate connection
      const connectionHandler = mockIO.on.mock.calls.find(call => call[0] === 'connection')[1];
      connectionHandler(mockSocket);
      
      // Fast-forward time to trigger heartbeat
      jest.advanceTimersByTime(30000);
      
      expect(mockIO.emit).toHaveBeenCalledWith('heartbeat', {
        timestamp: expect.any(Number),
      });
    });

    it('should clear heartbeat on shutdown', async () => {
      webSocketService.initialize();
      
      // Fast-forward to start heartbeat
      jest.advanceTimersByTime(30000);
      
      await webSocketService.shutdown();
      
      // Clear all timers and verify no more heartbeats
      jest.clearAllTimers();
      jest.advanceTimersByTime(30000);
      
      // Should not emit more heartbeats after shutdown
      const heartbeatCalls = mockIO.emit.mock.calls.filter(
        call => call[0] === 'heartbeat'
      );
      
      expect(heartbeatCalls.length).toBe(1); // Only the one before shutdown
    });
  });
});
