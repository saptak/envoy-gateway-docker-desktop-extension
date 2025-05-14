// Mock for controllers
import express from 'express';

// Create mock routers
const gatewayRouter = express.Router();
const routeRouter = express.Router();
const healthRouter = express.Router();
const configRouter = express.Router();

// Mock health endpoints
healthRouter.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      services: {
        kubernetes: { status: 'healthy', version: 'v1.25.0' },
        docker: { status: 'healthy', version: '20.10.0' },
      },
      metadata: {
        version: '1.0.0',
        responseTime: '10ms',
        uptime: '1h',
        memoryUsage: { rss: 100, heapTotal: 50, heapUsed: 25, external: 10 },
      },
    },
    message: 'System is healthy',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

healthRouter.get('/readiness', (req, res) => {
  res.status(200).json({
    status: 'ready',
    services: {
      kubernetes: 'healthy',
      docker: 'healthy',
    },
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/kubernetes', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      version: 'v1.25.0',
      cluster: {
        version: 'v1.25.0',
        platform: 'linux/amd64',
        nodes: [
          { name: 'node1', status: 'Ready', version: 'v1.25.0' },
        ],
      },
      namespaceCount: 5,
      envoyGatewayInstalled: true,
    },
    message: 'Kubernetes is healthy',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/docker', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      version: '20.10.0',
      containers: {
        total: 3,
        running: 2,
        stopped: 1,
      },
      images: {
        total: 2,
      },
      networks: {
        total: 2,
      },
    },
    message: 'Docker is healthy',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.get('/metrics', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      system: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.version,
      },
      application: {
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        pid: process.pid,
      },
      timestamp: new Date().toISOString(),
    },
    message: 'System metrics',
    timestamp: new Date().toISOString(),
  });
});

healthRouter.post('/ping', (req, res) => {
  res.status(200).json({
    pong: true,
    message: req.body.message || 'pong',
    timestamp: new Date().toISOString(),
    requestId: req.headers['x-request-id'],
  });
});

// Mock gateway endpoints
gatewayRouter.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      gateways: [],
      total: 0,
      page: 1,
      pageSize: 10,
      hasNext: false,
    },
    message: 'Gateways retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

gatewayRouter.get('/:namespace/:name', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: 'gateway-id',
      name: req.params.name,
      namespace: req.params.namespace,
      status: 'Ready',
      listeners: [],
      createdAt: new Date(),
      updatedAt: new Date(),
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
    message: 'Gateway retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

gatewayRouter.post('/', (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      id: 'gateway-id',
      name: req.body.name,
      namespace: req.body.namespace,
      status: 'Pending',
      listeners: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      spec: req.body.spec,
    },
    message: 'Gateway created successfully',
    timestamp: new Date().toISOString(),
  });
});

gatewayRouter.put('/:namespace/:name', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: 'gateway-id',
      name: req.params.name,
      namespace: req.params.namespace,
      status: 'Ready',
      listeners: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      spec: req.body.spec,
    },
    message: 'Gateway updated successfully',
    timestamp: new Date().toISOString(),
  });
});

gatewayRouter.delete('/:namespace/:name', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: req.params.name,
      namespace: req.params.namespace,
    },
    message: 'Gateway deleted successfully',
    timestamp: new Date().toISOString(),
  });
});

// Export the routers
module.exports = {
  gatewayRoutes: gatewayRouter,
  routeRoutes: routeRouter,
  healthRoutes: healthRouter,
  configRoutes: configRouter,
  default: {
    gatewayRoutes: gatewayRouter,
    routeRoutes: routeRouter,
    healthRoutes: healthRouter,
    configRoutes: configRouter,
  },
};
