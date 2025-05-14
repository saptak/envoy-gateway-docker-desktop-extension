import { WebSocketMessage } from '../../src/backend/types/websocket';

export class MockWebSocketService {
  private mockIo: any;
  private mockLogger: any;
  private mockClients: Map<string, any>;
  private mockHeartbeatInterval: NodeJS.Timeout | null;

  constructor() {
    this.mockIo = {
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
      use: jest.fn(),
      close: jest.fn(),
    };
    
    this.mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    
    this.mockClients = new Map();
    this.mockHeartbeatInterval = null;
  }

  initialize() {
    return this;
  }

  shutdown() {
    if (this.mockHeartbeatInterval) {
      clearInterval(this.mockHeartbeatInterval);
      this.mockHeartbeatInterval = null;
    }
    return Promise.resolve();
  }

  broadcastGatewayEvent(event: string, data: any) {
    const message: WebSocketMessage = {
      type: 'gateway',
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    this.mockIo.to('gateways').emit('message', message);
    return this;
  }

  broadcastRouteEvent(event: string, data: any) {
    const message: WebSocketMessage = {
      type: 'route',
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    this.mockIo.to('routes').emit('message', message);
    return this;
  }

  broadcastDockerEvent(event: string, data: any) {
    const message: WebSocketMessage = {
      type: 'docker',
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    this.mockIo.to('docker').emit('message', message);
    return this;
  }

  sendToChannel(channel: string, type: string, event: string, data: any) {
    const message: WebSocketMessage = {
      type,
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    this.mockIo.to(channel).emit('message', message);
    return this;
  }

  sendToAll(type: string, event: string, data: any) {
    const message: WebSocketMessage = {
      type,
      event,
      data,
      timestamp: new Date().toISOString(),
    };
    this.mockIo.emit('message', message);
    return this;
  }

  getConnectionStats() {
    return {
      totalConnections: this.mockClients.size,
      activeConnections: Array.from(this.mockClients.values()).filter(client => client.connected).length,
    };
  }

  // Mock helpers for testing
  getMockIo() {
    return this.mockIo;
  }

  getMockLogger() {
    return this.mockLogger;
  }

  getMockClients() {
    return this.mockClients;
  }

  setMockHeartbeatInterval(interval: NodeJS.Timeout) {
    this.mockHeartbeatInterval = interval;
    return this;
  }
}
