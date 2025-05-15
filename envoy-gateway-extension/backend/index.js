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

// Mock data for comprehensive demo
const mockGateways = [
  {
    id: '1',
    name: 'production-gateway',
    namespace: 'envoy-system',
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
    updated: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'staging-gateway',
    namespace: 'envoy-staging',
    status: 'Pending',
    listeners: [
      { name: 'http', port: 8080, protocol: 'HTTP' }
    ],
    conditions: [
      { type: 'Accepted', status: 'True', message: 'Gateway is valid' },
      { type: 'Programmed', status: 'False', message: 'Waiting for configuration' }
    ],
    created: '2024-02-01T14:30:00Z',
    updated: new Date().toISOString()
  }
];

const mockRoutes = [
  {
    id: '1',
    name: 'api-route',
    namespace: 'default',
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
    updated: new Date().toISOString()
  },
  {
    id: '2',
    name: 'web-route', 
    namespace: 'default',
    gateway: 'production-gateway',
    hosts: ['www.example.com'],
    matches: [{ path: { type: 'Exact', value: '/' } }],
    backends: [{ name: 'web-service', port: 3000, weight: 100 }],
    status: 'Accepted',
    conditions: [
      { type: 'Accepted', status: 'True', message: 'Route is valid' },
      { type: 'ResolvedRefs', status: 'True', message: 'Service references are valid' }
    ],
    created: '2024-01-15T11:30:00Z',
    updated: new Date().toISOString()
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

// Gateway management endpoints
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
    data: filteredGateways, 
    total: filteredGateways.length,
    page: 1,
    pageSize: 50
  });
});

app.get('/api/gateways/:id', (req, res) => {
  logger.info(`Gateway details requested: ${req.params.id}`);
  const gateway = mockGateways.find(g => g.id === req.params.id);
  if (!gateway) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  res.json({ data: gateway });
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
    updated: new Date().toISOString()
  };
  mockGateways.push(newGateway);
  
  // Emit real-time update
  io.emit('gateway-created', newGateway);
  
  res.status(201).json({ data: newGateway });
});

app.put('/api/gateways/:id', (req, res) => {
  logger.info(`Updating gateway: ${req.params.id}`);
  const index = mockGateways.findIndex(g => g.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  
  mockGateways[index] = { 
    ...mockGateways[index], 
    ...req.body,
    updated: new Date().toISOString()
  };
  
  // Emit real-time update
  io.emit('gateway-updated', mockGateways[index]);
  
  res.json({ data: mockGateways[index] });
});

app.delete('/api/gateways/:id', (req, res) => {
  logger.info(`Deleting gateway: ${req.params.id}`);
  const index = mockGateways.findIndex(g => g.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Gateway not found' });
  }
  
  const deleted = mockGateways.splice(index, 1)[0];
  
  // Emit real-time update
  io.emit('gateway-deleted', deleted);
  
  res.json({ data: deleted });
});

// Route management endpoints
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
    data: filteredRoutes, 
    total: filteredRoutes.length,
    page: 1,
    pageSize: 50
  });
});

app.get('/api/routes/:id', (req, res) => {
  logger.info(`Route details requested: ${req.params.id}`);
  const route = mockRoutes.find(r => r.id === req.params.id);
  if (!route) {
    return res.status(404).json({ error: 'Route not found' });
  }
  res.json({ data: route });
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
    updated: new Date().toISOString()
  };
  mockRoutes.push(newRoute);
  
  // Emit real-time update
  io.emit('route-created', newRoute);
  
  res.status(201).json({ data: newRoute });
});

app.put('/api/routes/:id', (req, res) => {
  logger.info(`Updating route: ${req.params.id}`);
  const index = mockRoutes.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Route not found' });
  }
  
  mockRoutes[index] = { 
    ...mockRoutes[index], 
    ...req.body,
    updated: new Date().toISOString()
  };
  
  // Emit real-time update
  io.emit('route-updated', mockRoutes[index]);
  
  res.json({ data: mockRoutes[index] });
});

app.delete('/api/routes/:id', (req, res) => {
  logger.info(`Deleting route: ${req.params.id}`);
  const index = mockRoutes.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Route not found' });
  }
  
  const deleted = mockRoutes.splice(index, 1)[0];
  
  // Emit real-time update
  io.emit('route-deleted', deleted);
  
  res.json({ data: deleted });
});

// Metrics endpoint
app.get('/api/metrics', (req, res) => {
  logger.info('Metrics requested');
  res.json(mockMetrics);
});

// Namespaces endpoint
app.get('/api/namespaces', (req, res) => {
  logger.info('Namespaces requested');
  const namespaces = [
    'default',
    'envoy-system',
    'envoy-staging',
    'kube-system'
  ];
  res.json({ data: namespaces });
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
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Envoy Gateway Extension API running on port ${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/api/health`);
  logger.info('WebSocket server ready for connections');
});