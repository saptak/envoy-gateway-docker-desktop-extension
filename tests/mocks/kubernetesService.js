// Mock for KubernetesService
const EventEmitter = require('events');
const { KubernetesError, GatewayStatus, RouteStatus } = require('../../src/shared/types');

class MockKubernetesService extends EventEmitter {
  static instance;

  constructor() {
    super();

    // Create mock methods
    this.initializeKubernetesClient = jest.fn().mockResolvedValue(true);
    this.validateConnection = jest.fn().mockResolvedValue(true);

    // Namespace operations
    this.listNamespaces = jest.fn().mockResolvedValue(['default', 'kube-system', 'envoy-gateway-system']);
    this.ensureNamespace = jest.fn().mockResolvedValue(undefined);

    // Gateway operations
    this.listGateways = jest.fn().mockResolvedValue([
      {
        id: 'gateway-uid',
        name: 'test-gateway',
        namespace: 'default',
        status: GatewayStatus.READY,
        listeners: [
          {
            name: 'http',
            port: 8080,
            protocol: 'HTTP',
          }
        ],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        spec: {
          gatewayClassName: 'test-class',
          listeners: [
            {
              name: 'http',
              port: 8080,
              protocol: 'HTTP',
            }
          ],
        },
      }
    ]);

    this.getGateway = jest.fn().mockResolvedValue({
      id: 'gateway-uid',
      name: 'test-gateway',
      namespace: 'default',
      status: GatewayStatus.READY,
      listeners: [
        {
          name: 'http',
          port: 8080,
          protocol: 'HTTP',
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
      spec: {
        gatewayClassName: 'test-class',
        listeners: [
          {
            name: 'http',
            port: 8080,
            protocol: 'HTTP',
          }
        ],
      },
    });

    this.createGateway = jest.fn().mockResolvedValue({
      id: 'gateway-uid',
      name: 'test-gateway',
      namespace: 'default',
      status: GatewayStatus.READY,
      listeners: [],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
      spec: {
        gatewayClassName: 'test-class',
        listeners: [
          {
            name: 'http',
            port: 8080,
            protocol: 'HTTP',
          }
        ],
      },
    });

    this.updateGateway = jest.fn().mockResolvedValue({
      id: 'gateway-uid',
      name: 'test-gateway',
      namespace: 'default',
      status: GatewayStatus.READY,
      listeners: [],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
      spec: {
        gatewayClassName: 'test-class',
        listeners: [
          {
            name: 'http',
            port: 8080,
            protocol: 'HTTP',
          }
        ],
      },
    });

    this.deleteGateway = jest.fn().mockResolvedValue(undefined);

    // HTTPRoute operations
    this.listHTTPRoutes = jest.fn().mockResolvedValue([
      {
        id: 'route-uid',
        name: 'test-route',
        namespace: 'default',
        status: RouteStatus.ACCEPTED,
        parentRefs: [
          {
            name: 'test-gateway',
            namespace: 'default',
          }
        ],
        rules: [
          {
            backendRefs: [
              {
                name: 'test-service',
                port: 8080,
              }
            ],
          }
        ],
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
      }
    ]);

    this.getHTTPRoute = jest.fn().mockResolvedValue({
      id: 'route-uid',
      name: 'test-route',
      namespace: 'default',
      status: RouteStatus.ACCEPTED,
      parentRefs: [
        {
          name: 'test-gateway',
          namespace: 'default',
        }
      ],
      rules: [
        {
          backendRefs: [
            {
              name: 'test-service',
              port: 8080,
            }
          ],
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
    });

    this.createHTTPRoute = jest.fn().mockResolvedValue({
      id: 'route-uid',
      name: 'test-route',
      namespace: 'default',
      status: RouteStatus.ACCEPTED,
      parentRefs: [
        {
          name: 'test-gateway',
          namespace: 'default',
        }
      ],
      rules: [
        {
          backendRefs: [
            {
              name: 'test-service',
              port: 8080,
            }
          ],
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
    });

    this.updateHTTPRoute = jest.fn().mockResolvedValue({
      id: 'route-uid',
      name: 'test-route',
      namespace: 'default',
      status: RouteStatus.ACCEPTED,
      parentRefs: [
        {
          name: 'test-gateway',
          namespace: 'default',
        }
      ],
      rules: [
        {
          backendRefs: [
            {
              name: 'test-service',
              port: 8080,
            }
          ],
        }
      ],
      createdAt: new Date('2023-01-01T00:00:00Z'),
      updatedAt: new Date('2023-01-01T00:00:00Z'),
    });

    this.deleteHTTPRoute = jest.fn().mockResolvedValue(undefined);

    // YAML Configuration
    this.applyYamlConfiguration = jest.fn().mockResolvedValue([
      {
        kind: 'Gateway',
        name: 'test-gateway',
        namespace: 'default',
        operation: 'created',
      }
    ]);

    // Cluster Information
    this.getClusterInfo = jest.fn().mockResolvedValue({
      version: 'v1.25.0',
      nodes: 1,
      platform: 'docker-desktop',
      status: 'healthy',
    });

    this.isEnvoyGatewayInstalled = jest.fn().mockResolvedValue(true);

    // Health Check
    this.healthCheck = jest.fn().mockResolvedValue({
      status: 'healthy',
      version: 'v1.25.0',
      details: {
        gitVersion: 'v1.25.0',
      },
    });

    // Status Mapping
    this.mapGatewayStatus = jest.fn().mockReturnValue(GatewayStatus.READY);
    this.mapRouteStatus = jest.fn().mockReturnValue(RouteStatus.ACCEPTED);

    // Watching
    this.watchGateways = jest.fn().mockResolvedValue(undefined);
    this.watchHTTPRoutes = jest.fn().mockResolvedValue(undefined);
    this.stopWatching = jest.fn().mockResolvedValue(undefined);

    // Status
    this.getGatewayStatus = jest.fn().mockResolvedValue({
      status: GatewayStatus.READY,
      addresses: [{ value: '127.0.0.1' }],
      conditions: [{ type: 'Ready', status: 'True' }],
    });

    this.getHTTPRouteStatus = jest.fn().mockResolvedValue({
      status: RouteStatus.ACCEPTED,
      conditions: [{ type: 'Accepted', status: 'True' }],
    });

    // Services
    this.getServices = jest.fn().mockResolvedValue([
      {
        name: 'kubernetes',
        namespace: 'default',
        clusterIP: '10.96.0.1',
        ports: [{ port: 443 }],
      },
    ]);
  }

  static getInstance() {
    if (!MockKubernetesService.instance) {
      MockKubernetesService.instance = new MockKubernetesService();
    }
    return MockKubernetesService.instance;
  }
}

const KubernetesService = MockKubernetesService;

module.exports = {
  KubernetesService,
  default: KubernetesService,
};
