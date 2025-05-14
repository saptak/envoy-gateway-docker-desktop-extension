import { Gateway, HTTPRoute, GatewayStatus, RouteStatus } from '../../src/shared/types';

export class MockKubernetesService {
  private mockLogger: any;
  private mockWebSocketService: any;
  private mockEventHandlers: Map<string, Function[]>;
  private mockGateways: Gateway[];
  private mockRoutes: HTTPRoute[];

  constructor() {
    this.mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    
    this.mockWebSocketService = {
      broadcastGatewayEvent: jest.fn(),
      broadcastRouteEvent: jest.fn(),
    };
    
    this.mockEventHandlers = new Map();
    this.mockGateways = [];
    this.mockRoutes = [];
  }

  initialize() {
    return this;
  }

  shutdown() {
    return Promise.resolve();
  }

  on(event: string, handler: Function) {
    if (!this.mockEventHandlers.has(event)) {
      this.mockEventHandlers.set(event, []);
    }
    this.mockEventHandlers.get(event)?.push(handler);
    return this;
  }

  emit(event: string, ...args: any[]) {
    const handlers = this.mockEventHandlers.get(event) || [];
    handlers.forEach(handler => handler(...args));
    return this;
  }

  async listGateways() {
    return this.mockGateways;
  }

  async getGateway(name: string, namespace = 'default') {
    return this.mockGateways.find(g => g.name === name && g.namespace === namespace) || null;
  }

  async createGateway(gateway: Partial<Gateway>) {
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
    
    this.mockGateways.push(newGateway);
    this.emit('gatewayCreated', newGateway);
    return newGateway;
  }

  async updateGateway(name: string, namespace: string, updates: Partial<Gateway>) {
    const gateway = await this.getGateway(name, namespace);
    if (!gateway) return null;
    
    Object.assign(gateway, updates, { updatedAt: new Date() });
    this.emit('gatewayUpdated', gateway);
    return gateway;
  }

  async deleteGateway(name: string, namespace = 'default') {
    const index = this.mockGateways.findIndex(g => g.name === name && g.namespace === namespace);
    if (index === -1) return false;
    
    const gateway = this.mockGateways[index];
    this.mockGateways.splice(index, 1);
    this.emit('gatewayDeleted', gateway);
    return true;
  }

  async listHTTPRoutes() {
    return this.mockRoutes;
  }

  async getHTTPRoute(name: string, namespace = 'default') {
    return this.mockRoutes.find(r => r.name === name && r.namespace === namespace) || null;
  }

  async createHTTPRoute(route: Partial<HTTPRoute>) {
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
    
    this.mockRoutes.push(newRoute);
    this.emit('routeCreated', newRoute);
    return newRoute;
  }

  async updateHTTPRoute(name: string, namespace: string, updates: Partial<HTTPRoute>) {
    const route = await this.getHTTPRoute(name, namespace);
    if (!route) return null;
    
    Object.assign(route, updates, { updatedAt: new Date() });
    this.emit('routeUpdated', route);
    return route;
  }

  async deleteHTTPRoute(name: string, namespace = 'default') {
    const index = this.mockRoutes.findIndex(r => r.name === name && r.namespace === namespace);
    if (index === -1) return false;
    
    const route = this.mockRoutes[index];
    this.mockRoutes.splice(index, 1);
    this.emit('routeDeleted', route);
    return true;
  }

  async healthCheck() {
    return { status: 'healthy', version: 'v1.25.0' };
  }

  // Mock helpers for testing
  getMockLogger() {
    return this.mockLogger;
  }

  getMockWebSocketService() {
    return this.mockWebSocketService;
  }

  setMockGateways(gateways: Gateway[]) {
    this.mockGateways = gateways;
    return this;
  }

  setMockRoutes(routes: HTTPRoute[]) {
    this.mockRoutes = routes;
    return this;
  }
}
