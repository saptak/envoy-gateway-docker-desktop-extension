import { io, Socket } from 'socket.io-client';
import { WebSocketMessage, SystemStatus, MonitoringMetrics, LogEntry } from '@/types';

export type WebSocketEventMap = {
  'status_update': (status: SystemStatus) => void;
  'gateway_changed': (event: { type: 'created' | 'updated' | 'deleted'; gateway: any }) => void;
  'route_changed': (event: { type: 'created' | 'updated' | 'deleted'; route: any }) => void;
  'metrics_update': (metrics: MonitoringMetrics) => void;
  'log_entry': (log: LogEntry) => void;
  'container_changed': (event: { type: 'started' | 'stopped' | 'created' | 'removed'; container: any }) => void;
  'test_run_update': (event: { runId: string; status: string; progress?: number }) => void;
  'error': (error: { message: string; code?: string }) => void;
  'connection_status': (status: { connected: boolean; reconnecting?: boolean }) => void;
};

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventListeners: Map<keyof WebSocketEventMap, Set<Function>> = new Map();
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    Object.keys({} as WebSocketEventMap).forEach(event => {
      this.eventListeners.set(event as keyof WebSocketEventMap, new Set());
    });
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.doConnect();
    return this.connectionPromise;
  }

  private async doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        return;
      }

      this.isConnecting = true;
      console.log('Connecting to WebSocket server...');

      // Determine WebSocket URL based on environment
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = process.env.NODE_ENV === 'development' 
        ? 'ws://localhost:8080'
        : `${protocol}//${host}`;

      this.socket = io(wsUrl, {
        path: '/ws',
        transports: ['websocket', 'polling'],
        timeout: 10000,
        reconnection: true,
        reconnectionDelay: this.reconnectDelay,
        reconnectionAttempts: this.maxReconnectAttempts,
        autoConnect: true
      });

      this.socket.on('connect', () => {
        console.log('WebSocket connected successfully');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connection_status', { connected: true });
        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        this.emit('connection_status', { connected: false });
        
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.handleReconnect();
        }
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.handleConnectionError(error);
        
        if (this.reconnectAttempts === 0) {
          reject(new Error(`Failed to connect to WebSocket: ${error.message}`));
        }
      });

      this.socket.on('reconnect', (attemptNumber) => {
        console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
        this.emit('connection_status', { connected: true, reconnecting: false });
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('WebSocket reconnection error:', error);
        this.emit('connection_status', { connected: false, reconnecting: true });
      });

      this.socket.on('reconnect_failed', () => {
        console.error('WebSocket reconnection failed after maximum attempts');
        this.emit('error', { 
          message: 'Failed to reconnect to server after multiple attempts',
          code: 'RECONNECT_FAILED'
        });
      });

      // Register message handlers
      this.registerMessageHandlers();
    });
  }

  private registerMessageHandlers() {
    if (!this.socket) return;

    this.socket.on('message', (message: WebSocketMessage) => {
      console.log('WebSocket message received:', message.type);
      this.handleMessage(message);
    });

    // Handle specific event types
    this.socket.on('status_update', (data: SystemStatus) => {
      this.emit('status_update', data);
    });

    this.socket.on('gateway_changed', (data: any) => {
      this.emit('gateway_changed', data);
    });

    this.socket.on('route_changed', (data: any) => {
      this.emit('route_changed', data);
    });

    this.socket.on('metrics_update', (data: MonitoringMetrics) => {
      this.emit('metrics_update', data);
    });

    this.socket.on('log_entry', (data: LogEntry) => {
      this.emit('log_entry', data);
    });

    this.socket.on('container_changed', (data: any) => {
      this.emit('container_changed', data);
    });

    this.socket.on('test_run_update', (data: any) => {
      this.emit('test_run_update', data);
    });

    this.socket.on('error', (data: any) => {
      this.emit('error', data);
    });
  }

  private handleMessage(message: WebSocketMessage) {
    try {
      switch (message.type) {
        case 'status_update':
          this.emit('status_update', message.data);
          break;
        case 'gateway_changed':
          this.emit('gateway_changed', message.data);
          break;
        case 'route_changed':
          this.emit('route_changed', message.data);
          break;
        case 'metrics_update':
          this.emit('metrics_update', message.data);
          break;
        case 'log_entry':
          this.emit('log_entry', message.data);
          break;
        default:
          console.warn('Unknown WebSocket message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private handleConnectionError(error: Error) {
    this.isConnecting = false;
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => {
        this.handleReconnect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      this.emit('error', {
        message: 'Maximum reconnection attempts reached',
        code: 'MAX_RECONNECT_ATTEMPTS'
      });
    }
  }

  private handleReconnect() {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting WebSocket...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionPromise = null;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Event listener management
  on<K extends keyof WebSocketEventMap>(
    event: K,
    callback: WebSocketEventMap[K]
  ): () => void {
    const listeners = this.eventListeners.get(event) || new Set();
    listeners.add(callback);
    this.eventListeners.set(event, listeners);

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
    };
  }

  off<K extends keyof WebSocketEventMap>(
    event: K,
    callback: WebSocketEventMap[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private emit<K extends keyof WebSocketEventMap>(
    event: K,
    ...args: Parameters<WebSocketEventMap[K]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as any)(...args);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Send message to server
  send(event: string, data?: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  // Subscribe to specific resource updates
  subscribeToGateway(namespace: string, name: string): void {
    this.send('subscribe', { type: 'gateway', namespace, name });
  }

  unsubscribeFromGateway(namespace: string, name: string): void {
    this.send('unsubscribe', { type: 'gateway', namespace, name });
  }

  subscribeToRoute(namespace: string, name: string): void {
    this.send('subscribe', { type: 'route', namespace, name });
  }

  unsubscribeFromRoute(namespace: string, name: string): void {
    this.send('unsubscribe', { type: 'route', namespace, name });
  }

  subscribeToMetrics(interval?: number): void {
    this.send('subscribe', { type: 'metrics', interval });
  }

  unsubscribeFromMetrics(): void {
    this.send('unsubscribe', { type: 'metrics' });
  }

  subscribeTeLogs(component?: string, level?: string): void {
    this.send('subscribe', { type: 'logs', component, level });
  }

  unsubscribeFromLogs(): void {
    this.send('unsubscribe', { type: 'logs' });
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionId(): string | undefined {
    return this.socket?.id;
  }
}

// Create singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
