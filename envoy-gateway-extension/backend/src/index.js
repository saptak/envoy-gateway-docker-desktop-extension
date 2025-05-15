const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');
const yaml = require('js-yaml');
const axios = require('axios');
const path = require('path');

const app = express();
const docker = new Docker();

// Enable CORS for all origins in extension context
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Serve static files from the ui directory
app.use(express.static(path.join(__dirname, '../ui')));

// Enhanced logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} from ${req.ip}`);
  
  // Log the response status when the request completes
  const originalSend = res.send;
  res.send = function(...args) {
    console.log(`${timestamp} - Response: ${res.statusCode} for ${req.method} ${req.path}`);
    originalSend.apply(this, args);
  };
  
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: process.env.PORT || 8080
  });
});

// System status
app.get('/api/status', async (req, res) => {
  try {
    const dockerInfo = await docker.info();
    const containers = await docker.listContainers({ all: true });
    
    res.json({
      docker: {
        version: dockerInfo.ServerVersion,
        containers: containers.length,
        running: containers.filter(c => c.State === 'running').length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Gateway management endpoints
app.get('/api/gateways', async (req, res) => {
  try {
    console.log('Fetching gateways...');
    // For now, return mock data - can be enhanced with real Kubernetes integration
    const gateways = [
      {
        id: 'gateway-1',
        name: 'example-gateway',
        namespace: 'default',
        status: 'Ready',
        listeners: [
          { name: 'http', protocol: 'HTTP', port: 80 },
          { name: 'https', protocol: 'HTTPS', port: 443 }
        ],
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({ gateways, total: gateways.length });
  } catch (error) {
    console.error('Error in /api/gateways:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gateways', async (req, res) => {
  try {
    const { name, namespace, listeners } = req.body;
    
    // Mock gateway creation
    const gateway = {
      id: `gateway-${Date.now()}`,
      name,
      namespace: namespace || 'default',
      status: 'Pending',
      listeners: listeners || [],
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(gateway);
  } catch (error) {
    console.error('Error in POST /api/gateways:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route management endpoints
app.get('/api/routes', async (req, res) => {
  try {
    console.log('Fetching routes...');
    const routes = [
      {
        id: 'route-1',
        name: 'example-route',
        namespace: 'default',
        parentRefs: [{ name: 'example-gateway', namespace: 'default' }],
        hostnames: ['example.com'],
        rules: [
          {
            matches: [{ path: { type: 'PathPrefix', value: '/' } }],
            backendRefs: [{ name: 'example-service', port: 8080 }]
          }
        ],
        status: 'Accepted',
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json({ routes, total: routes.length });
  } catch (error) {
    console.error('Error in /api/routes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routes', async (req, res) => {
  try {
    const { name, namespace, parentRefs, hostnames, rules } = req.body;
    
    const route = {
      id: `route-${Date.now()}`,
      name,
      namespace: namespace || 'default',
      parentRefs: parentRefs || [],
      hostnames: hostnames || [],
      rules: rules || [],
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(route);
  } catch (error) {
    console.error('Error in POST /api/routes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Envoy Gateway deployment
app.post('/api/envoy-gateway/deploy', async (req, res) => {
  try {
    console.log('Deploying Envoy Gateway...');
    
    // Mock deployment process
    const deployment = {
      status: 'success',
      message: 'Envoy Gateway deployment initiated',
      deploymentId: `deploy-${Date.now()}`,
      components: [
        { name: 'envoy-gateway-controller', status: 'deployed' },
        { name: 'envoy-proxy', status: 'deployed' },
        { name: 'gateway-class', status: 'created' }
      ]
    };
    
    res.json(deployment);
  } catch (error) {
    console.error('Error in /api/envoy-gateway/deploy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Testing endpoint
app.post('/api/test-route', async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;
    
    // Mock route testing
    const result = {
      success: true,
      status: 200,
      responseTime: Math.floor(Math.random() * 500) + 50,
      headers: {
        'content-type': 'application/json',
        'x-gateway': 'envoy-gateway'
      },
      body: { message: 'Test successful', timestamp: new Date().toISOString() }
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error in /api/test-route:', error);
    res.status(500).json({ error: error.message });
  }
});

// Real-time status endpoint for polling
app.get('/api/realtime-status', (req, res) => {
  console.log('Real-time status requested');
  res.json({
    gateways: 1,
    routes: 1,
    status: 'running',
    timestamp: new Date().toISOString(),
    metrics: {
      requestCount: Math.floor(Math.random() * 100) + 1200,
      responseTime: Math.floor(Math.random() * 50) + 40,
      successRate: (99.5 + Math.random() * 0.4).toFixed(1),
      activeConnections: Math.floor(Math.random() * 20) + 80
    }
  });
});

// Catch-all route to serve frontend for any unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/index.html'));
});

// Start HTTP server
const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Envoy Gateway Backend running on port ${PORT}`);
  console.log(`Server listening on all interfaces (0.0.0.0:${PORT})`);
});

// Simple health endpoint for container health checks
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', port: PORT });
});

console.log('Envoy Gateway Backend started successfully');
console.log('Environment:', process.env.NODE_ENV || 'development');
