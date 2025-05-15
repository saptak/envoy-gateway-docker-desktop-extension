const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createServer } = require('http');
const { Server } = require('socket.io');
const winston = require('winston');

// Initialize Express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced mock data for comprehensive demo with multiple namespaces
const mockGateways = [
  {
    id: '1',
    name: 'production-gateway',
    namespace: 'envoy-gateway-extension',
    status: 'Ready',
    listeners: [
      { name: 'http', port: 80, protocol: 'HTTP' },
      { name: 'https', port: 443, protocol: 'HTTPS' }
    ],
    conditions: [
      { type: 'Accepted', status: 'True', message: 'Gateway is valid' },
      { type: 'Programmed', status: 'True', message: 'Gateway has been configured' }
    ],
    created: '2024-01-15T10:00:00Z',
    updated: new Date().toISOString(),
    metadata: { 
      name: 'production-gateway',
      namespace: 'envoy-gateway-extension',
      uid: 'gateway-1-uid',
      creationTimestamp: '2024-01-15T10:00:00Z'
    },
    spec: {
      gatewayClassName: 'envoy-gateway',
      listeners: [
        { name: 'http', port: 80, protocol: 'HTTP' },
        { name: 'https', port: 443, protocol: 'HTTPS' }
      ]
    }
  },
  {
    id: '2', 
    name: 'test-gateway',
    namespace: 'envoy-gateway-extension',
    status: 'Pending',
    listeners: [
      { name: 'http', port: 8080, protocol: 'HTTP' }
    ],
    conditions: [
      { type: 'Accepted', status: 'True', message: 'Gateway is valid' },
      { type: 'Programmed', status: 'False', message: 'Waiting for configuration' }
    ],
    created: '2024-02-01T14:30:00Z',
    updated: new Date().toISOString(),
    metadata: { 
      name: 'test-gateway',
      namespace: 'envoy-gateway-extension',
      uid: 'gateway-2-uid',
      creationTimestamp: '2024-02-01T14:30:00Z'
    },
    spec: {
      gatewayClassName: 'envoy-gateway',
      listeners: [
        { name: 'http', port: 8080, protocol: 'HTTP' }
      ]
    }
  },
  {
    id: '3',
    name: 'staging-gateway',
    namespace: 'staging',
    status: 'Ready',
    listeners: [
      { name: 'http', port: 9090, protocol: 'HTTP' }
    ],
    conditions: [
      { type: 'Accepted', status: 'True', message: 'Gateway is valid' },
      { type: 'Programmed', status: 'True', message: 'Gateway has been configured' }
    ],
    created: '2024-03-01T09:00:00Z',
    updated: new Date().toISOString(),
    metadata: { 
      name: 'staging-gateway',
      namespace: 'staging',
      uid: 'gateway-3-uid',
      creationTimestamp: '2024-03-01T09:00:00Z'
    },
    spec: {
      gatewayClassName: 'envoy-gateway',
      listeners: [
        { name: 'http', port: 9090, protocol: 'HTTP' }
      ]
    }
  }
];

const mockRoutes = [
  {
    id: '1',
    name: 'backend-route',
    namespace: 'envoy-gateway-extension',
    gateway: 'production-gateway',
    hosts: ['api.example.com'],
    matches: [{ path: { type: 'PathPrefix', value: '/api' } }],
    backends: [{ name: 'api-service', port: 8080, weight: 100 }],
    status: 'Accepted',
    conditions: [
      { type: 'Accepted', status: 'True', message: 'Route is valid' },
      { type: 'ResolvedRefs', status: 'True', message: 'Service references are valid' }
    ],
    created: '2024-01-15T11:00:00Z',
    updated: new Date().toISOString(),
    metadata: { 
      name: 'backend-route',
      namespace: 'envoy-gateway-extension',
      uid: 'route-1-uid',
      creationTimestamp: '2024-01-15T11:00:00Z'
    },
    parentRefs: [{ name: 'production-gateway', namespace: 'envoy-gateway-extension' }],
    hostnames: ['api.example.com'],
    rules: [{ matches: [{ path: { type: 'PathPrefix', value: '/api' } }] }]
  },
  {
    id: '2',
    name: 'test-route', 
    namespace: 'envoy-gateway-extension',
    gateway: 'test-gateway',
    hosts: ['test.example.com'],
    matches: [{ path: { type: 'Exact', value: '/' } }],
    backends: [{ name: 'test-service', port: 3000, weight: 100 }],
    status: 'Accepted',
    conditions: [
      { type: 'Accepted', status: 'True', message: 'Route is valid' },
      { type: 'ResolvedRefs', status: 'True', message: 'Service references are valid' }
    ],
    created: '2024-01-15T11:30:00Z',
    updated: new Date().toISOString(),
    metadata: { 
      name: 'test-route',
      namespace: 'envoy-gateway-extension',
      uid: 'route-2-uid',
      creationTimestamp: '2024-01-15T11:30:00Z'
    },
    parentRefs: [{ name: 'test-gateway', namespace: 'envoy-gateway-extension' }],
    hostnames: ['test.example.com'],
    rules: [{ matches: [{ path: { type: 'Exact', value: '/' } }] }]
  },
  {
    id: '3',
    name: 'staging-route',
    namespace: 'staging',
    gateway: 'staging-gateway',
    hosts: ['staging.example.com'],
    matches: [{ path: { type: 'PathPrefix', value: '/app' } }],
    backends: [{ name: 'staging-service', port: 5000, weight: 100 }],
    status: 'Accepted',
    conditions: [
      { type: 'Accepted', status: 'True', message: 'Route is valid' },
      { type: 'ResolvedRefs', status: 'True', message: 'Service references are valid' }
    ],
    created: '2024-03-01T10:00:00Z',
    updated: new Date().toISOString(),
    metadata: { 
      name: 'staging-route',
      namespace: 'staging',
      uid: 'route-3-uid',
      creationTimestamp: '2024-03-01T10:00:00Z'
    },
    parentRefs: [{ name: 'staging-gateway', namespace: 'staging' }],
    hostnames: ['staging.example.com'],
    rules: [{ matches: [{ path: { type: 'PathPrefix', value: '/app' } }] }]
  }
];

const mockMetrics = {
  totalRequests: 1542873,
  successRate: 99.2,
  averageLatency: 45,
  p95Latency: 123,
  p99Latency: 456,
  errorRate: 0.8,
  activeConnections: 234,
  requestsPerSecond: 156,
  uptime: process.uptime(),
  memoryUsage: process.memoryUsage(),
  cpuUsage: process.cpuUsage()
};

// System status with multiple components
let systemStatus = {
  envoyGateway: {
    status: 'Running',
    version: '1.0.0',
    namespace: 'envoy-system',
    replicas: { ready: 2, total: 2 }
  },
  cluster: {
    status: 'Connected',
    name: 'docker-desktop',
    version: 'v1.28.2',
    nodes: 1
  },
  extension: {
    status: 'Active',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  },
  dataPlane: {
    proxies: 2,
    healthyProxies: 2,
    version: '1.27.4'
  }
};

// Simulate real-time metrics updates
setInterval(() => {
  mockMetrics.totalRequests += Math.floor(Math.random() * 10) + 1;
  mockMetrics.requestsPerSecond = Math.floor(Math.random() * 50) + 100;
  mockMetrics.averageLatency = Math.floor(Math.random() * 20) + 40;
  mockMetrics.activeConnections = Math.floor(Math.random() * 50) + 200;
  mockMetrics.uptime = process.uptime();
  
  // Emit metrics update
  io.emit('metrics-update', mockMetrics);
}, 5000);

// Helper function to get unique namespaces
function getUniqueNamespaces() {
  const gatewayNamespaces = [...new Set(mockGateways.map(g => g.namespace))];
  const routeNamespaces = [...new Set(mockRoutes.map(r => r.namespace))];
  return [...new Set([...gatewayNamespaces, ...routeNamespaces, 'default', 'kube-system'])];
}

// Helper function to calculate namespace resource counts
function getNamespaceCounts() {
  const namespaces = getUniqueNamespaces();
  return namespaces.reduce((acc, ns) => {
    const gatewayCount = mockGateways.filter(g => g.namespace === ns).length;
    const routeCount = mockRoutes.filter(r => r.namespace === ns).length;
    
    if (gatewayCount > 0 || routeCount > 0) {
      acc[ns] = {
        gatewayCount,
        routeCount,
        totalResources: gatewayCount + routeCount
      };
    }
    return acc;
  }, {});
}

// API Routes
app.get('/api/health', (req, res) => {
  logger.info('Health check requested');
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime()
  });
});

app.get('/api/status', (req, res) => {
  logger.info('System status requested');
  systemStatus.extension.uptime = process.uptime();
  systemStatus.extension.memory = process.memoryUsage();
  res.json(systemStatus);
});

// Namespaces management endpoints
app.get('/api/namespaces', (req, res) => {
  logger.info('Namespaces list requested');
  const includeEmpty = req.query.includeEmpty === 'true';
  const namespaces = getUniqueNamespaces();
  const namespaceCounts = getNamespaceCounts();
  
  const namespacesWithCounts = namespaces.map(ns => ({
    name: ns,
    gatewayCount: namespaceCounts[ns]?.gatewayCount || 0,
    routeCount: namespaceCounts[ns]?.routeCount || 0,
    totalResources: namespaceCounts[ns]?.totalResources || 0
  }));
  
  const filteredNamespaces = includeEmpty 
    ? namespacesWithCounts
    : namespacesWithCounts.filter(ns => ns.totalResources > 0);
  
  res.json({
    success: true,
    data: {
      namespaces: filteredNamespaces,
      total: namespaces.length,
      withResources: filteredNamespaces.length,
    },
    message: `Found ${namespaces.length} namespace(s), ${filteredNamespaces.length} with Gateway/Route resources`,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/namespaces/with-resources', (req, res) => {
  logger.info('Namespaces with resources requested');
  const namespaceCounts = getNamespaceCounts();
  
  const namespacesWithResources = Object.entries(namespaceCounts).map(([name, counts]) => ({
    name,
    ...counts
  }));
  
  res.json({
    success: true,
    data: namespacesWithResources,
    message: `Found ${namespacesWithResources.length} namespace(s) with resources`,
    timestamp: new Date().toISOString(),
  });
});

// Gateway management endpoints with namespace support
app.get('/api/gateways', (req, res) => {
  logger.info('Gateways list requested');
  const { namespace, status } = req.query;
  
  let filteredGateways = [...mockGateways];
  if (namespace) {
    filteredGateways = filteredGateways.filter(g => g.namespace === namespace);
  }
  if (status) {
    filteredGateways = filteredGateways.filter(g => g.status === status);
  }
  
  res.json({
    success: true,
    data: {
      gateways: filteredGateways,
      total: filteredGateways.length,
      page: 1,
      pageSize: 50,
      hasNext: false
    },
    message: `Found ${filteredGateways.length} gateway(s) in ${namespace ? `namespace ${namespace}` : 'default namespace'}`,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/gateways/all-namespaces', (req, res) => {
  logger.info('All namespaces gateways requested');
  const namespaceCounts = getNamespaceCounts();
  
  res.json({
    success: true,
    data: {
      gateways: mockGateways,
      total: mockGateways.length,
      page: 1,
      pageSize: 50,
      hasNext: false,
      namespaceCounts: Object.entries(namespaceCounts).reduce((acc, [ns, counts]) => {
        acc[ns] = counts.gatewayCount;
        return acc;
      }, {})
    },
    message: `Found ${mockGateways.length} gateway(s) across all namespaces`,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/gateways/:namespace/:name', (req, res) => {
  logger.info(`Gateway details requested: ${req.params.namespace}/${req.params.name}`);
  const gateway = mockGateways.find(g => g.name === req.params.name && g.namespace === req.params.namespace);
  if (!gateway) {
    return res.status(404).json({
      success: false,
      error: 'Gateway not found',
      message: `Gateway ${req.params.namespace}/${req.params.name} does not exist`,
      timestamp: new Date().toISOString()
    });
  }
  res.json({
    success: true,
    data: gateway,
    message: `Gateway ${req.params.namespace}/${req.params.name} retrieved successfully`,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/gateways', (req, res) => {
  logger.info('Creating new gateway');
  const newGateway = {
    id: String(mockGateways.length + 1),
    ...req.body,
    status: 'Pending',
    conditions: [
      { type: 'Accepted', status: 'True', message: 'Gateway is valid' },
      { type: 'Programmed', status: 'False', message: 'Configuration in progress' }
    ],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    metadata: {
      name: req.body.name,
      namespace: req.body.namespace,
      uid: `gateway-${mockGateways.length + 1}-uid`,
      creationTimestamp: new Date().toISOString()
    },
    spec: {
      gatewayClassName: req.body.gatewayClassName,
      listeners: req.body.listeners
    }
  };
  mockGateways.push(newGateway);
  
  // Emit real-time update
  io.emit('gateway-created', newGateway);
  
  res.status(201).json({
    success: true,
    data: newGateway,
    message: `Gateway ${newGateway.namespace}/${newGateway.name} created successfully`,
    timestamp: new Date().toISOString()
  });
});

app.put('/api/gateways/:namespace/:name', (req, res) => {
  logger.info(`Updating gateway: ${req.params.namespace}/${req.params.name}`);
  const index = mockGateways.findIndex(g => g.name === req.params.name && g.namespace === req.params.namespace);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Gateway not found',
      message: `Gateway ${req.params.namespace}/${req.params.name} does not exist`,
      timestamp: new Date().toISOString()
    });
  }
  
  mockGateways[index] = { 
    ...mockGateways[index], 
    ...req.body,
    name: req.params.name,
    namespace: req.params.namespace,
    updated: new Date().toISOString()
  };
  
  // Emit real-time update
  io.emit('gateway-updated', mockGateways[index]);
  
  res.json({
    success: true,
    data: mockGateways[index],
    message: `Gateway ${req.params.namespace}/${req.params.name} updated successfully`,
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/gateways/:namespace/:name', (req, res) => {
  logger.info(`Deleting gateway: ${req.params.namespace}/${req.params.name}`);
  const index = mockGateways.findIndex(g => g.name === req.params.name && g.namespace === req.params.namespace);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Gateway not found',
      message: `Gateway ${req.params.namespace}/${req.params.name} does not exist`,
      timestamp: new Date().toISOString()
    });
  }
  
  const deleted = mockGateways.splice(index, 1)[0];
  
  // Emit real-time update
  io.emit('gateway-deleted', deleted);
  
  res.json({
    success: true,
    message: `Gateway ${req.params.namespace}/${req.params.name} deleted successfully`,
    timestamp: new Date().toISOString()
  });
});

// Route management endpoints with namespace support
app.get('/api/routes', (req, res) => {
  logger.info('Routes list requested');
  const { namespace, gateway, status } = req.query;
  
  let filteredRoutes = [...mockRoutes];
  if (namespace) {
    filteredRoutes = filteredRoutes.filter(r => r.namespace === namespace);
  }
  if (gateway) {
    filteredRoutes = filteredRoutes.filter(r => r.gateway === gateway);
  }
  if (status) {
    filteredRoutes = filteredRoutes.filter(r => r.status === status);
  }
  
  res.json({
    success: true,
    data: {
      routes: filteredRoutes,
      total: filteredRoutes.length,
      page: 1,
      pageSize: 50,
      hasNext: false
    },
    message: `Found ${filteredRoutes.length} route(s) in ${namespace ? `namespace ${namespace}` : 'default namespace'}`,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/routes/all-namespaces', (req, res) => {
  logger.info('All namespaces routes requested');
  const namespaceCounts = getNamespaceCounts();
  
  res.json({
    success: true,
    data: {
      routes: mockRoutes,
      total: mockRoutes.length,
      page: 1,
      pageSize: 50,
      hasNext: false,
      namespaceCounts: Object.entries(namespaceCounts).reduce((acc, [ns, counts]) => {
        acc[ns] = counts.routeCount;
        return acc;
      }, {})
    },
    message: `Found ${mockRoutes.length} route(s) across all namespaces`,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/routes/:namespace/:name', (req, res) => {
  logger.info(`Route details requested: ${req.params.namespace}/${req.params.name}`);
  const route = mockRoutes.find(r => r.name === req.params.name && r.namespace === req.params.namespace);
  if (!route) {
    return res.status(404).json({
      success: false,
      error: 'Route not found',
      message: `HTTP route ${req.params.namespace}/${req.params.name} does not exist`,
      timestamp: new Date().toISOString()
    });
  }
  res.json({
    success: true,
    data: route,
    message: `HTTP route ${req.params.namespace}/${req.params.name} retrieved successfully`,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/routes', (req, res) => {
  logger.info('Creating new route');
  const newRoute = {
    id: String(mockRoutes.length + 1),
    ...req.body,
    status: 'Pending',
    conditions: [
      { type: 'Accepted', status: 'True', message: 'Route is valid' },
      { type: 'ResolvedRefs', status: 'False', message: 'Checking service references' }
    ],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    metadata: {
      name: req.body.name,
      namespace: req.body.namespace,
      uid: `route-${mockRoutes.length + 1}-uid`,
      creationTimestamp: new Date().toISOString()
    }
  };
  mockRoutes.push(newRoute);
  
  // Emit real-time update
  io.emit('route-created', newRoute);
  
  res.status(201).json({
    success: true,
    data: newRoute,
    message: `HTTP route ${newRoute.namespace}/${newRoute.name} created successfully`,
    timestamp: new Date().toISOString()
  });
});

app.put('/api/routes/:namespace/:name', (req, res) => {
  logger.info(`Updating route: ${req.params.namespace}/${req.params.name}`);
  const index = mockRoutes.findIndex(r => r.name === req.params.name && r.namespace === req.params.namespace);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Route not found',
      message: `HTTP route ${req.params.namespace}/${req.params.name} does not exist`,
      timestamp: new Date().toISOString()
    });
  }
  
  mockRoutes[index] = { 
    ...mockRoutes[index], 
    ...req.body,
    name: req.params.name,
    namespace: req.params.namespace,
    updated: new Date().toISOString()
  };
  
  // Emit real-time update
  io.emit('route-updated', mockRoutes[index]);
  
  res.json({
    success: true,
    data: mockRoutes[index],
    message: `HTTP route ${req.params.namespace}/${req.params.name} updated successfully`,
    timestamp: new Date().toISOString()
  });
});

app.delete('/api/routes/:namespace/:name', (req, res) => {
  logger.info(`Deleting route: ${req.params.namespace}/${req.params.name}`);
  const index = mockRoutes.findIndex(r => r.name === req.params.name && r.namespace === req.params.namespace);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Route not found', 
      message: `HTTP route ${req.params.namespace}/${req.params.name} does not exist`,
      timestamp: new Date().toISOString()
    });
  }
  
  const deleted = mockRoutes.splice(index, 1)[0];
  
  // Emit real-time update
  io.emit('route-deleted', deleted);
  
  res.json({
    success: true,
    message: `HTTP route ${req.params.namespace}/${req.params.name} deleted successfully`,
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  logger.info('Metrics requested');
  res.json(mockMetrics);
});

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  // Send initial data
  socket.emit('initial-data', {
    gateways: mockGateways,
    routes: mockRoutes,
    metrics: mockMetrics,
    status: systemStatus,
    namespaces: getUniqueNamespaces(),
    namespaceCounts: getNamespaceCounts(),
    timestamp: new Date().toISOString()
  });
  
  // Handle subscriptions
  socket.on('subscribe-metrics', () => {
    logger.info(`Client ${socket.id} subscribed to metrics`);
    socket.join('metrics');
  });
  
  socket.on('subscribe-gateways', () => {
    logger.info(`Client ${socket.id} subscribed to gateways`);
    socket.join('gateways');
  });
  
  socket.on('subscribe-routes', () => {
    logger.info(`Client ${socket.id} subscribed to routes`);
    socket.join('routes');
  });
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.info(`🚀 Envoy Gateway Extension API running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`🔗 WebSocket server ready for connections`);
  logger.info(`🔍 Namespaces endpoint: http://localhost:${PORT}/api/namespaces`);
  logger.info(`✅ Enhanced with cross-namespace support`);
});