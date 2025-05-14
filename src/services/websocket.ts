import { io, Socket } from 'socket.io-client';

// WebSocket event types
export type WebSocketEventType = 
  | 'connect'
  | 'disconnect'
  | 'error'
  | 'gateway:update'
  | 'route:update'
  | 'system:status'
  | 'metrics:update'
  | 'container:update';

// WebSocket service for real-time communication
class WebSocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private eventHandlers: Map<string, Set<Function>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 3000; // 3 seconds
  private reconnectTimer: NodeJS.Timeout | null = null;

  // Connect to the WebSocket server
  public async connect(): Promise<void> {
    if (this.socket && this.connected) {
      console.log('WebSocket already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        // Create socket connection
        this.socket = io('/', {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: this.reconnectInterval,
          timeout: 10000,
        });

        // Set up event handlers
        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.triggerEvent('connect', null);
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.connected = false;
          this.triggerEvent('disconnect', reason);
          
          // Handle reconnection if not initiated by client
          if (reason === 'io server disconnect') {
            this.reconnect();
          }
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          this.triggerEvent('error', error);
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Failed to connect to WebSocket server after multiple attempts'));
          } else {
            this.reconnectAttempts++;
          }
        });

        // Set up event listeners for various updates
        this.socket.on('gateway:update', (data) => {
          this.triggerEvent('gateway:update', data);
        });

        this.socket.on('route:update', (data) => {
          this.triggerEvent('route:update', data);
        });

        this.socket.on('system:status', (data) => {
          this.triggerEvent('system:status', data);
        });

        this.socket.on('metrics:update', (data) => {
          this.triggerEvent('metrics:update', data);
        });

        this.socket.on('container:update', (data) => {
          this.triggerEvent('container:update', data);
        });

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        reject(error);
      }
    });
  }

  // Disconnect from the WebSocket server
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      
      console.log('WebSocket disconnected by client');
    }
  }

  // Register an event handler
  public on(event: WebSocketEventType, callback: Function): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    
    this.eventHandlers.get(event)?.add(callback);
    
    // Return a function to remove this specific handler
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(callback);
      }
    };
  }

  // Send a message to the server
  public send(event: string, data: any): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot send message, WebSocket not connected');
    }
  }

  // Subscribe to metrics updates
  public subscribeToMetrics(): void {
    if (this.socket && this.connected) {
      this.socket.emit('subscribe:metrics');
    }
  }

  // Unsubscribe from metrics updates
  public unsubscribeFromMetrics(): void {
    if (this.socket && this.connected) {
      this.socket.emit('unsubscribe:metrics');
    }
  }

  // Check if the WebSocket is connected
  public isConnected(): boolean {
    return this.connected;
  }

  // Trigger an event for all registered handlers
  private triggerEvent(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event handler for ${event}:`, error);
        }
      });
    }
  }

  // Attempt to reconnect
  private reconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      console.log(`Attempting to reconnect (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})...`);
      this.connect().catch((error) => {
        console.error('Reconnection attempt failed:', error);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          this.reconnect();
        } else {
          console.error('Max reconnection attempts reached');
          this.triggerEvent('error', new Error('Failed to reconnect after maximum attempts'));
        }
      });
    }, this.reconnectInterval);
  }
}

// Create and export a singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;
