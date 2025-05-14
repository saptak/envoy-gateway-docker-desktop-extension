// Mock for WebSocketService test
const mockEmit = jest.fn();
const mockToEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({
  emit: mockToEmit,
});
const mockOn = jest.fn();

const mockSocket = {
  id: 'test-socket-id',
  emit: jest.fn(),
  on: jest.fn(),
  join: jest.fn(),
  leave: jest.fn(),
  disconnect: jest.fn(),
  handshake: {
    address: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent',
    },
  },
};

const mockServer = {
  on: mockOn,
  to: mockTo,
  emit: mockEmit,
  use: jest.fn(),
  close: jest.fn(),
  listen: jest.fn(),
};

// Mock for the Socket.IO Server constructor
jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => mockServer),
}));

// Mock for the Kubernetes service
jest.mock('../../src/backend/services/kubernetesService', () => {
  return jest.fn().mockImplementation(() => ({
    healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
    getGateways: jest.fn().mockResolvedValue([]),
    getRoutes: jest.fn().mockResolvedValue([]),
  }));
});

// Mock for the Docker service
jest.mock('../../src/backend/services/dockerService', () => {
  return jest.fn().mockImplementation(() => ({
    healthCheck: jest.fn().mockResolvedValue({ status: 'healthy' }),
    getContainers: jest.fn().mockResolvedValue([]),
  }));
});

// Mock for the Logger
jest.mock('../../src/backend/utils/logger', () => {
  return {
    createLogger: jest.fn().mockReturnValue({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  };
});

module.exports = {
  mockServer,
  mockSocket,
  mockEmit,
  mockToEmit,
  mockTo,
  mockOn,
};
