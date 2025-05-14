// Mock for integration tests
import { Gateway, HTTPRoute, GatewayStatus, RouteStatus } from '../../src/shared/types';

// Mock WebSocketService
export const mockWebSocketService = {
  initialize: jest.fn(),
  shutdown: jest.fn().mockResolvedValue(undefined),
  sendToClient: jest.fn(),
  sendToChannel: jest.fn(),
  sendToAll: jest.fn(),
  getConnectedClients: jest.fn().mockReturnValue([]),
  getClientCount: jest.fn().mockReturnValue(0),
  sendSystemStatus: jest.fn().mockResolvedValue(undefined),
  monitorConnections: jest.fn().mockResolvedValue({
    clientCount: 0,
    averageConnectedTime: 0,
    subscriptionStats: {},
  }),
};

// Mock KubernetesService
export const mockKubernetesService = {
  initialize: jest.fn().mockReturnThis(),
  shutdown: jest.fn().mockResolvedValue(undefined),
  on: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  listGateways: jest.fn().mockResolvedValue([]),
  getGateway: jest.fn().mockResolvedValue(null),
  createGateway: jest.fn().mockImplementation(async (gateway) => {
    const newGateway: Gateway = {
      id: `${gateway.namespace || 'default'}-${gateway.name}`,
      name: gateway.name || 'mock-gateway',
      namespace: gateway.namespace || 'default',
      status: GatewayStatus.PENDING,
      listeners: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      spec: gateway.spec || { gatewayClassName: 'mock-class', listeners: [] },
    };
    return newGateway;
  }),
  updateGateway: jest.fn().mockResolvedValue(null),
  deleteGateway: jest.fn().mockResolvedValue(true),
  listHTTPRoutes: jest.fn().mockResolvedValue([]),
  getHTTPRoute: jest.fn().mockResolvedValue(null),
  createHTTPRoute: jest.fn().mockImplementation(async (route) => {
    const newRoute: HTTPRoute = {
      id: `${route.namespace || 'default'}-${route.name}`,
      name: route.name || 'mock-route',
      namespace: route.namespace || 'default',
      status: RouteStatus.PENDING,
      parentRefs: route.parentRefs || [],
      rules: route.rules || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return newRoute;
  }),
  updateHTTPRoute: jest.fn().mockResolvedValue(null),
  deleteHTTPRoute: jest.fn().mockResolvedValue(true),
  healthCheck: jest.fn().mockResolvedValue({ status: 'healthy', version: 'v1.25.0' }),
  getClusterInfo: jest.fn().mockResolvedValue({
    version: { gitVersion: 'v1.25.0' },
    nodeCount: 1,
    nodes: [],
  }),
};

// Mock DockerService
export const mockDockerService = {
  initialize: jest.fn().mockReturnThis(),
  shutdown: jest.fn().mockResolvedValue(undefined),
  on: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  listContainers: jest.fn().mockResolvedValue([]),
  getContainer: jest.fn().mockResolvedValue(null),
  createContainer: jest.fn().mockResolvedValue('container-id'),
  startContainer: jest.fn().mockResolvedValue(true),
  stopContainer: jest.fn().mockResolvedValue(true),
  removeContainer: jest.fn().mockResolvedValue(true),
  getContainerLogs: jest.fn().mockResolvedValue('container logs'),
  getContainerStats: jest.fn().mockResolvedValue({
    cpu: { percentage: 5 },
    memory: { usage: 1073741824, limit: 4294967296, percentage: 25 },
    network: { rx: 1000, tx: 2000 },
    timestamp: new Date(),
  }),
  listImages: jest.fn().mockResolvedValue([]),
  pullImage: jest.fn().mockResolvedValue(true),
  createNetwork: jest.fn().mockResolvedValue('network-id'),
  listNetworks: jest.fn().mockResolvedValue([]),
  healthCheck: jest.fn().mockResolvedValue({ status: 'healthy', version: '20.10.0' }),
  monitorEvents: jest.fn(),
  execInContainer: jest.fn().mockResolvedValue({ stdout: '', stderr: '' }),
};

// Mock for the Application class
export const mockApplication = {
  start: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  getKubernetesService: jest.fn().mockReturnValue(mockKubernetesService),
  getDockerService: jest.fn().mockReturnValue(mockDockerService),
  getWebSocketService: jest.fn().mockReturnValue(mockWebSocketService),
};
