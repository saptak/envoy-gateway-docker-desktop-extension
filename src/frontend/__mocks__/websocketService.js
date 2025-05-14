// Mock WebSocket service
export class WebSocketService {
  constructor() {
    this.connect = jest.fn();
    this.disconnect = jest.fn();
    this.subscribe = jest.fn();
    this.unsubscribe = jest.fn();
    this.send = jest.fn();
  }
}