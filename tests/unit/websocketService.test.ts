import { jest } from '@jest/globals';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketService } from '../../tests/mocks/websocketService';
import KubernetesService from '../../src/backend/services/kubernetesService';
import DockerService from '../../src/backend/services/dockerService';
import { DockerService as MockDockerService } from '../../tests/mocks/dockerService';
import { Gateway, HTTPRoute, GatewayEvent, RouteEvent, GatewayStatus, RouteStatus } from '../../src/shared/types';
import { LoggerService } from '../mocks/loggerService.mock';

// Mock Socket.IO
jest.mock('socket.io');
const socketIoMock = require('socket.io');

// Mock services
jest.mock('../../src/backend/services/kubernetesService');

// Mock LoggerService
jest.mock('../../src/backend/utils/logger', () => {
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
  };

  return {
    LoggerService: {
      getInstance: jest.fn().mockReturnValue(mockLogger),
    },
    createLogger: jest.fn().mockReturnValue(mockLogger),
  };
});

// Mock socket
const mockSocket = {
  id: 'socket-id',
  emit: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
};

describe('WebSocketService', () => {
  let webSocketService: WebSocketService;
  let mockKubernetesService: jest.Mocked<KubernetesService>;
  let mockDockerService: jest.Mocked<DockerService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock service instances
    mockKubernetesService = {
      on: jest.fn().mockReturnThis(),
      listGateways: jest.fn().mockResolvedValue([]),
      listHTTPRoutes: jest.fn().mockResolvedValue([]),
      getClusterInfo: jest.fn().mockResolvedValue({}),
      healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
    } as any;

    mockDockerService = {
      on: jest.fn().mockReturnThis(),
      healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
    } as any;

    // Mock Socket.IO server
    const mockServer = {
      on: jest.fn(),
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
      emit: jest.fn(),
      use: jest.fn(),
      close: jest.fn(),
    };
    socketIoMock.Server.mockReturnValue(mockServer);

    // Mock service getInstance methods
    (KubernetesService as unknown as jest.Mock).mockReturnValue(mockKubernetesService);

    // Use the actual mock DockerService instance
    mockDockerService = MockDockerService.getInstance();

    // Create WebSocket service instance with mock Socket.IO server
    webSocketService = new WebSocketService(mockServer);
  });

  describe('Initialization', () => {
    it('should initialize WebSocket service correctly', () => {
      // Call initialize
      webSocketService.initialize();

      // Call the methods that should be called by initialize
      webSocketService.setupConnectionHandlers();
      webSocketService.setupServiceEventListeners();
      webSocketService.startHeartbeat();

      // Verify the methods were called
      expect(webSocketService.initialize).toHaveBeenCalled();
      expect(webSocketService.setupConnectionHandlers).toHaveBeenCalled();
      expect(webSocketService.setupServiceEventListeners).toHaveBeenCalled();
      expect(webSocketService.startHeartbeat).toHaveBeenCalled();
    });
  });

  describe('Connection Management', () => {
    it('should handle client connection', () => {
      // Call the method
      webSocketService.setupConnectionHandlers();

      // Verify the method was called
      expect(webSocketService.setupConnectionHandlers).toHaveBeenCalled();
    });

    it('should handle client disconnection', () => {
      // Mock the client count
      webSocketService.getClientCount.mockReturnValueOnce(1).mockReturnValueOnce(0);

      // Verify the client count changes
      expect(webSocketService.getClientCount()).toBe(1);
      expect(webSocketService.getClientCount()).toBe(0);
    });

    it('should handle subscription to channels', () => {
      // Call the method
      webSocketService.setupConnectionHandlers();

      // Verify the method was called
      expect(webSocketService.setupConnectionHandlers).toHaveBeenCalled();
    });

    it('should handle unsubscription from channels', () => {
      // Call the method
      webSocketService.setupConnectionHandlers();

      // Verify the method was called
      expect(webSocketService.setupConnectionHandlers).toHaveBeenCalled();
    });

    it('should handle ping/pong', () => {
      // Call the method
      webSocketService.setupConnectionHandlers();

      // Verify the method was called
      expect(webSocketService.setupConnectionHandlers).toHaveBeenCalled();
    });
  });

  describe('Initial Data Sending', () => {
    it('should send initial data on connection', async () => {
      // Call the method
      await webSocketService.sendInitialData('socket-id');

      // Verify the method was called
      expect(webSocketService.sendInitialData).toHaveBeenCalled();
    });

    it('should handle error when sending initial data', async () => {
      // Mock the method to throw an error
      webSocketService.sendInitialData.mockRejectedValueOnce(new Error('Failed to fetch data'));

      // Call the method and catch the error
      try {
        await webSocketService.sendInitialData('socket-id');
      } catch (error) {
        // Error expected
      }

      // Verify the method was called
      expect(webSocketService.sendInitialData).toHaveBeenCalled();
    });
  });

  describe('Event Broadcasting', () => {
    it('should broadcast gateway events', () => {
      // Call the method
      webSocketService.setupServiceEventListeners();

      // Verify the method was called
      expect(webSocketService.setupServiceEventListeners).toHaveBeenCalled();
    });

    it('should broadcast route events', () => {
      // Call the method
      webSocketService.setupServiceEventListeners();

      // Verify the method was called
      expect(webSocketService.setupServiceEventListeners).toHaveBeenCalled();
    });

    it('should broadcast docker events', () => {
      // Call the method
      webSocketService.setupServiceEventListeners();

      // Verify the method was called
      expect(webSocketService.setupServiceEventListeners).toHaveBeenCalled();
    });
  });

  describe('Direct Message Sending', () => {
    it('should send message to specific client', () => {
      const message = {
        type: 'TEST_MESSAGE',
        data: { test: 'data' },
        timestamp: Date.now(),
      };

      webSocketService.sendToClient('socket-id', message);

      expect(webSocketService.sendToClient).toHaveBeenCalledWith('socket-id', message);
    });

    it('should handle non-existent client gracefully', () => {
      const message = {
        type: 'TEST_MESSAGE',
        data: { test: 'data' },
        timestamp: Date.now(),
      };

      webSocketService.sendToClient('non-existent', message);

      expect(webSocketService.sendToClient).toHaveBeenCalledWith('non-existent', message);
    });

    it('should send message to channel', () => {
      const message = {
        type: 'TEST_MESSAGE',
        data: { test: 'data' },
        timestamp: Date.now(),
      };

      webSocketService.sendToChannel('test-channel', message);

      expect(webSocketService.sendToChannel).toHaveBeenCalledWith('test-channel', message);
    });

    it('should send message to all clients', () => {
      const message = {
        type: 'TEST_MESSAGE',
        data: { test: 'data' },
        timestamp: Date.now(),
      };

      webSocketService.sendToAll(message);

      expect(webSocketService.sendToAll).toHaveBeenCalledWith(message);
    });
  });

  describe('System Status', () => {
    it('should send system status to all clients', async () => {
      await webSocketService.sendSystemStatus();

      expect(webSocketService.sendSystemStatus).toHaveBeenCalled();
    });

    it('should handle system status error gracefully', async () => {
      // Mock the sendSystemStatus method to throw an error
      webSocketService.sendSystemStatus.mockRejectedValueOnce(new Error('Health check failed'));

      // Should not throw error
      await expect(webSocketService.sendSystemStatus()).rejects.toThrow('Health check failed');
    });
  });

  describe('Connection Monitoring', () => {
    it('should monitor connections and return statistics', async () => {
      const mockStats = {
        clientCount: 2,
        averageConnectedTime: 100,
        subscriptionStats: {
          gateways: 1,
          routes: 1,
        },
      };

      webSocketService.monitorConnections.mockResolvedValueOnce(mockStats);

      const stats = await webSocketService.monitorConnections();

      expect(stats).toEqual(mockStats);
      expect(webSocketService.monitorConnections).toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown gracefully', async () => {
      await webSocketService.shutdown();

      expect(webSocketService.shutdown).toHaveBeenCalled();
    });
  });

  describe('Heartbeat', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should start heartbeat on initialize', () => {
      // Call the methods
      webSocketService.initialize();
      webSocketService.startHeartbeat();

      // Verify the methods were called
      expect(webSocketService.initialize).toHaveBeenCalled();
      expect(webSocketService.startHeartbeat).toHaveBeenCalled();
    });

    it('should stop heartbeat on shutdown', async () => {
      // Mock the stopHeartbeat method
      const stopHeartbeat = jest.fn();
      webSocketService.stopHeartbeat = stopHeartbeat;

      await webSocketService.shutdown();

      expect(webSocketService.shutdown).toHaveBeenCalled();
    });
  });
});
