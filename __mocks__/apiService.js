// Mock API service for testing
const apiService = {
  getSystemStatus: jest.fn().mockResolvedValue({
    docker: { connected: true, containers: { running: 2, stopped: 0, total: 2 } },
    kubernetes: { connected: true, context: 'test-context', namespace: 'default' },
    envoyGateway: { installed: true, status: 'running', version: '1.0.0' },
  }),

  healthCheck: jest.fn().mockResolvedValue({ status: 'ok', timestamp: Date.now() }),

  getGateways: jest.fn().mockResolvedValue([
    {
      id: 'gateway-1',
      name: 'test-gateway',
      namespace: 'default',
      status: 'Ready',
      listeners: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spec: {
        gatewayClassName: 'test-class',
        listeners: [
          {
            name: 'http',
            port: 8080,
            protocol: 'HTTP',
          },
        ],
      },
    },
  ]),

  getGateway: jest.fn().mockImplementation((namespace, name) => {
    return Promise.resolve({
      id: 'gateway-1',
      name,
      namespace,
      status: 'Ready',
      listeners: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      spec: {
        gatewayClassName: 'test-class',
        listeners: [
          {
            name: 'http',
            port: 8080,
            protocol: 'HTTP',
          },
        ],
      },
    });
  }),

  createGateway: jest.fn().mockImplementation((gateway) => {
    return Promise.resolve({
      id: 'new-gateway',
      ...gateway,
      status: 'Pending',
      listeners: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  updateGateway: jest.fn().mockImplementation((namespace, name, gateway) => {
    return Promise.resolve({
      id: 'gateway-1',
      name,
      namespace,
      ...gateway,
      status: 'Ready',
      listeners: [],
      updatedAt: new Date().toISOString(),
    });
  }),

  deleteGateway: jest.fn().mockResolvedValue({ success: true }),

  getHTTPRoutes: jest.fn().mockResolvedValue([
    {
      id: 'route-1',
      name: 'test-route',
      namespace: 'default',
      status: 'Accepted',
      parentRefs: [
        {
          name: 'test-gateway',
          namespace: 'default',
        },
      ],
      rules: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]),

  getHTTPRoute: jest.fn().mockImplementation((namespace, name) => {
    return Promise.resolve({
      id: 'route-1',
      name,
      namespace,
      status: 'Accepted',
      parentRefs: [
        {
          name: 'test-gateway',
          namespace: 'default',
        },
      ],
      rules: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  createHTTPRoute: jest.fn().mockImplementation((route) => {
    return Promise.resolve({
      id: 'new-route',
      ...route,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }),

  updateHTTPRoute: jest.fn().mockImplementation((namespace, name, route) => {
    return Promise.resolve({
      id: 'route-1',
      name,
      namespace,
      ...route,
      status: 'Accepted',
      updatedAt: new Date().toISOString(),
    });
  }),

  deleteHTTPRoute: jest.fn().mockResolvedValue({ success: true }),

  getContainers: jest.fn().mockResolvedValue([
    {
      id: 'container-1',
      name: 'test-container',
      image: 'test-image:latest',
      status: 'Up 2 hours',
      state: 'running',
      created: new Date().toISOString(),
      ports: [{ privatePort: 8080, publicPort: 8080, type: 'tcp' }],
      networks: ['bridge'],
      labels: {},
    },
  ]),

  getMetrics: jest.fn().mockResolvedValue({
    timestamp: Date.now(),
    gateways: { total: 1, healthy: 1, unhealthy: 0 },
    routes: { total: 1, attached: 1, detached: 0 },
    traffic: { requestRate: 10, errorRate: 0, p50Latency: 5, p95Latency: 10, p99Latency: 15 },
    resources: { cpu: { usage: 10, limit: 100 }, memory: { usage: 100, limit: 1024 } },
  }),

  applyYAML: jest.fn().mockResolvedValue({
    results: [
      {
        kind: 'Gateway',
        name: 'test-gateway',
        namespace: 'default',
        operation: 'created',
      },
    ],
  }),

  getNamespaces: jest.fn().mockResolvedValue(['default', 'kube-system', 'envoy-gateway-system']),

  getServices: jest.fn().mockResolvedValue([
    {
      name: 'kubernetes',
      namespace: 'default',
      clusterIP: '10.96.0.1',
      ports: [{ port: 443 }],
    },
  ]),
};

module.exports = {
  apiService,
  default: apiService
};
