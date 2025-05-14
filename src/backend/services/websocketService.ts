import { Server as SocketIOServer, Socket } from 'socket.io';
import { LoggerService } from '../utils/logger';
import { WebSocketMessage, GatewayEvent, RouteEvent } from '../../shared/types';
import { KubernetesService } from './kubernetesService';
import { DockerService } from './dockerService';

export interface ConnectedClient {
  id: string;
  socket: Socket;
  connectedAt: Date;
  subscriptions: Set<string>;
}

export class WebSocketService {
  private io: SocketIOServer;
  private logger: LoggerService;
  private clients: Map<string, ConnectedClient>;
  private kubernetesService: KubernetesService;
  private dockerService: DockerService;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.logger = LoggerService.getInstance();
    this.clients = new Map();
    this.kubernetesService = KubernetesService.getInstance();
    this.dockerService = DockerService.getInstance();
  }

  public initialize(): void {
    this.setupConnectionHandlers();
    this.setupServiceEventListeners();
    this.startHeartbeat();
    this.logger.info('WebSocket service initialized');
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleClientConnection(socket);

      socket.on('disconnect', () => {
        this.handleClientDisconnection(socket);
      });

      socket.on('subscribe', (channel: string) => {
        this.handleSubscription(socket, channel);
      });

      socket.on('unsubscribe', (channel: string) => {
        this.handleUnsubscription(socket, channel);
      });

      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      socket.on('error', (error: Error) => {
        this.logger.error(`WebSocket error for client ${socket.id}:`, error);
      });
    });
  }

  private handleClientConnection(socket: Socket): void {
    const client: ConnectedClient = {
      id: socket.id,
      socket,
      connectedAt: new Date(),
      subscriptions: new Set(),
    };

    this.clients.set(socket.id, client);
    this.logger.info(`WebSocket client connected: ${socket.id}`);

    // Send welcome message
    socket.emit('connected', {
      clientId: socket.id,
      timestamp: Date.now(),
      message: 'Connected to Envoy Gateway Extension',
    });

    // Send current status
    this.sendInitialStatus(socket);
  }

  private handleClientDisconnection(socket: Socket): void {
    const client = this.clients.get(socket.id);
    if (client) {
      this.clients.delete(socket.id);
      this.logger.info(`WebSocket client disconnected: ${socket.id}`);
    }
  }

  private handleSubscription(socket: Socket, channel: string): void {
    const client = this.clients.get(socket.id);
    if (client) {
      client.subscriptions.add(channel);
      socket.join(channel);
      this.logger.debug(`Client ${socket.id} subscribed to ${channel}`);
      
      socket.emit('subscribed', { channel, timestamp: Date.now() });
    }
  }

  private handleUnsubscription(socket: Socket, channel: string): void {
    const client = this.clients.get(socket.id);
    if (client) {
      client.subscriptions.delete(channel);
      socket.leave(channel);
      this.logger.debug(`Client ${socket.id} unsubscribed from ${channel}`);
      
      socket.emit('unsubscribed', { channel, timestamp: Date.now() });
    }
  }

  private async sendInitialStatus(socket: Socket): Promise<void> {
    try {
      // Send current gateways
      const gateways = await this.kubernetesService.listGateways();
      socket.emit('initialData', {
        type: 'gateways',
        data: gateways,
        timestamp: Date.now(),
      });

      // Send current routes
      const routes = await this.kubernetesService.listHTTPRoutes();
      socket.emit('initialData', {
        type: 'routes',
        data: routes,
        timestamp: Date.now(),
      });

      // Send cluster info
      const clusterInfo = await this.kubernetesService.getClusterInfo();
      socket.emit('initialData', {
        type: 'clusterInfo',
        data: clusterInfo,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error('Error sending initial status:', error);
      socket.emit('error', {
        message: 'Failed to load initial data',
        error: error.message,
        timestamp: Date.now(),
      });
    }
  }

  private setupServiceEventListeners(): void {
    // Kubernetes service events
    this.kubernetesService.on('gatewayCreated', (gateway) => {
      this.broadcastToChannel('gateways', {
        type: 'GATEWAY_CREATED',
        data: { gateway },
        timestamp: Date.now(),
      } as GatewayEvent);
    });

    this.kubernetesService.on('gatewayUpdated', (gateway) => {
      this.broadcastToChannel('gateways', {
        type: 'GATEWAY_UPDATED',
        data: { gateway },
        timestamp: Date.now(),
      } as GatewayEvent);
    });

    this.kubernetesService.on('gatewayDeleted', (gateway) => {
      this.broadcastToChannel('gateways', {
        type: 'GATEWAY_DELETED',
        data: { gateway },
        timestamp: Date.now(),
      } as GatewayEvent);
    });

    this.kubernetesService.on('routeCreated', (route) => {
      this.broadcastToChannel('routes', {
        type: 'ROUTE_CREATED',
        data: { route, gatewayId: route.parentRefs[0]?.name || '' },
        timestamp: Date.now(),
      } as RouteEvent);
    });

    this.kubernetesService.on('routeUpdated', (route) => {
      this.broadcastToChannel('routes', {
        type: 'ROUTE_UPDATED',
        data: { route, gatewayId: route.parentRefs[0]?.name || '' },
        timestamp: Date.now(),
      } as RouteEvent);
    });

    this.kubernetesService.on('routeDeleted', (route) => {
      this.broadcastToChannel('routes', {
        type: 'ROUTE_DELETED',
        data: { route, gatewayId: route.parentRefs[0]?.name || '' },
        timestamp: Date.now(),
      } as RouteEvent);
    });

    // Docker service events
    this.dockerService.on('containerCreated', (containerId) => {
      this.broadcastToChannel('docker', {
        type: 'CONTAINER_CREATED',
        data: { containerId },
        timestamp: Date.now(),
      });
    });

    this.dockerService.on('containerStarted', (containerId) => {
      this.broadcastToChannel('docker', {
        type: 'CONTAINER_STARTED',
        data: { containerId },
        timestamp: Date.now(),
      });
    });

    this.dockerService.on('containerStopped', (containerId) => {
      this.broadcastToChannel('docker', {
        type: 'CONTAINER_STOPPED',
        data: { containerId },
        timestamp: Date.now(),
      });
    });

    this.dockerService.on('containerRemoved', (containerId) => {
      this.broadcastToChannel('docker', {
        type: 'CONTAINER_REMOVED',
        data: { containerId },
        timestamp: Date.now(),
      });
    });
  }

  private broadcastToChannel(channel: string, message: WebSocketMessage): void {
    this.io.to(channel).emit('message', message);
    this.logger.debug(`Broadcasted message to channel ${channel}:`, message.type);
  }

  private broadcastToAll(message: WebSocketMessage): void {
    this.io.emit('message', message);
    this.logger.debug(`Broadcasted message to all clients:`, message.type);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      this.io.emit('heartbeat', { timestamp: now });
      
      // Log connection status
      if (this.clients.size > 0) {
        this.logger.debug(`WebSocket heartbeat sent to ${this.clients.size} clients`);
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Sends a message to a specific client
   */
  public sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.socket.emit('message', message);
      this.logger.debug(`Sent message to client ${clientId}:`, message.type);
    } else {
      this.logger.warn(`Client ${clientId} not found`);
    }
  }

  /**
   * Sends a message to all clients subscribed to a channel
   */
  public sendToChannel(channel: string, message: WebSocketMessage): void {
    this.broadcastToChannel(channel, message);
  }

  /**
   * Sends a message to all connected clients
   */
  public sendToAll(message: WebSocketMessage): void {
    this.broadcastToAll(message);
  }

  /**
   * Gets the list of connected clients
   */
  public getConnectedClients(): ConnectedClient[] {
    return Array.from(this.clients.values());
  }

  /**
   * Gets the count of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Sends system status update to all clients
   */
  public async sendSystemStatus(): Promise<void> {
    try {
      const [kubernetesHealth, dockerHealth] = await Promise.all([
        this.kubernetesService.healthCheck(),
        this.dockerService.healthCheck(),
      ]);

      const systemStatus = {
        kubernetes: kubernetesHealth,
        docker: dockerHealth,
        timestamp: Date.now(),
      };

      this.broadcastToAll({
        type: 'SYSTEM_STATUS',
        data: systemStatus,
        timestamp: Date.now(),
      });

      this.logger.debug('System status sent to all clients');
    } catch (error) {
      this.logger.error('Error sending system status:', error);
    }
  }

  /**
   * Handles client errors and maintains connection health
   */
  private handleClientError(socket: Socket, error: Error): void {
    this.logger.error(`Client error for ${socket.id}:`, error);
    
    // Attempt to reconnect if needed
    if (error.message.includes('connection') || error.message.includes('timeout')) {
      socket.emit('reconnect_request', {
        message: 'Connection issue detected, please reconnect',
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Monitors WebSocket performance and connection health
   */
  public async monitorConnections(): Promise<{
    clientCount: number;
    averageConnectedTime: number;
    subscriptionStats: Record<string, number>;
  }> {
    const now = Date.now();
    let totalConnectedTime = 0;
    const subscriptionStats: Record<string, number> = {};

    for (const client of this.clients.values()) {
      totalConnectedTime += now - client.connectedAt.getTime();
      
      for (const subscription of client.subscriptions) {
        subscriptionStats[subscription] = (subscriptionStats[subscription] || 0) + 1;
      }
    }

    return {
      clientCount: this.clients.size,
      averageConnectedTime: this.clients.size > 0 ? totalConnectedTime / this.clients.size : 0,
      subscriptionStats,
    };
  }

  /**
   * Gracefully shuts down the WebSocket service
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down WebSocket service...');
    
    this.stopHeartbeat();
    
    // Notify all clients of shutdown
    this.broadcastToAll({
      type: 'SHUTDOWN',
      data: { message: 'Server is shutting down' },
      timestamp: Date.now(),
    });

    // Give clients time to receive the message
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Disconnect all clients
    for (const client of this.clients.values()) {
      client.socket.disconnect(true);
    }

    this.clients.clear();
    this.logger.info('WebSocket service shut down complete');
  }
}

export default WebSocketService;
