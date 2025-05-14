// Mock WebSocket service for testing
const webSocketService = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn(),
  on: jest.fn().mockReturnValue(() => {}),
  send: jest.fn(),
  subscribeToMetrics: jest.fn(),
  unsubscribeFromMetrics: jest.fn(),
  isConnected: jest.fn().mockReturnValue(true),
};

module.exports = {
  webSocketService,
  default: webSocketService
};
