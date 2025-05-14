// Mock for WebSocketService
const EventEmitter = require('events');

class MockWebSocketService extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.clients = new Map();
    
    // Create mock methods
    this.initialize = jest.fn().mockReturnThis();
    this.setupConnectionHandlers = jest.fn();
    this.setupServiceEventListeners = jest.fn();
    this.startHeartbeat = jest.fn();
    this.stopHeartbeat = jest.fn();
    this.sendToClient = jest.fn();
    this.sendToChannel = jest.fn();
    this.sendToAll = jest.fn();
    this.getConnectedClients = jest.fn().mockReturnValue([]);
    this.getClientCount = jest.fn().mockReturnValue(0);
    this.sendSystemStatus = jest.fn().mockResolvedValue(undefined);
    this.monitorConnections = jest.fn().mockResolvedValue({
      clientCount: 0,
      averageConnectedTime: 0,
      subscriptionStats: {},
    });
    this.shutdown = jest.fn().mockResolvedValue(undefined);
    this.sendInitialData = jest.fn().mockResolvedValue(undefined);
    this.broadcastGatewayEvent = jest.fn();
    this.broadcastRouteEvent = jest.fn();
    this.broadcastDockerEvent = jest.fn();
  }
}

module.exports = {
  WebSocketService: MockWebSocketService,
  default: MockWebSocketService,
};
