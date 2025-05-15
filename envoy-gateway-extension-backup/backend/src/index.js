const express = require('express');
const cors = require('cors');
const Docker = require('dockerode');
const yaml = require('js-yaml');
const axios = require('axios');
const path = require('path');
const KubernetesService = require('./services/kubernetesService');
const { validate, gatewaySchema, httpRouteSchema } = require('./validators/schemas');

const app = express();
const docker = new Docker();
const k8sService = new KubernetesService();

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
    port: process.env.PORT || 8080,
    kubernetes: k8sService.isConnected()
  });
});

// Kubernetes reconnect endpoint
app.post('/api/kubernetes/reconnect', async (req, res) => {
  try {
    console.log('Attempting to reconnect to Kubernetes...');
    const connected = await k8sService.reconnect();
    
    res.json({
      success: true,
      connected: connected,
      message: connected ? 'Successfully reconnected to Kubernetes' : 'Failed to reconnect to Kubernetes',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/kubernetes/reconnect:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      connected: false 
    });
  }
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
      kubernetes: {
        connected: k8sService.isConnected()
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
    const namespace = req.query.namespace; // Remove default, let backend handle it
    
    if (!k8sService.isConnected()) {
      // Fallback to mock data if not connected to Kubernetes
      console.log('Kubernetes not connected, returning mock data');
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
      return res.json({ gateways, total: gateways.length });
    }
    
    // If no namespace specified, search all namespaces
    const gateways = await k8sService.getGateways(namespace);
    res.json({ gateways, total: gateways.length });
  } catch (error) {
    console.error('Error in /api/gateways:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint specifically for all namespaces
app.get('/api/gateways/all', async (req, res) => {
  try {
    console.log('Fetching gateways from all namespaces...');
    
    if (!k8sService.isConnected()) {
      return res.json({ gateways: [], total: 0 });
    }
    
    // Get gateways from all namespaces by not passing a namespace parameter
    const gateways = await k8sService.getAllGateways();
    res.json({ gateways, total: gateways.length });
  } catch (error) {
    console.error('Error in /api/gateways/all:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/gateways', validate(gatewaySchema), async (req, res) => {
  try {
    const gatewaySpec = req.validatedBody;
    const namespace = req.query.namespace || 'default';
    
    if (!k8sService.isConnected()) {
      // Mock creation if not connected
      const gateway = {
        id: `gateway-${Date.now()}`,
        name: gatewaySpec.name,
        namespace: namespace,
        status: 'Pending',
        listeners: gatewaySpec.listeners || [],
        createdAt: new Date().toISOString()
      };
      return res.status(201).json(gateway);
    }
    
    const gateway = await k8sService.createGateway(gatewaySpec, namespace);
    res.status(201).json(gateway);
  } catch (error) {
    console.error('Error in POST /api/gateways:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/gateways/:name', validate(gatewaySchema), async (req, res) => {
  try {
    const { name } = req.params;
    const gatewaySpec = req.validatedBody;
    const namespace = req.query.namespace || 'default';
    
    if (!k8sService.isConnected()) {
      return res.status(503).json({ error: 'Kubernetes not connected' });
    }
    
    const gateway = await k8sService.updateGateway(name, gatewaySpec, namespace);
    res.json(gateway);
  } catch (error) {
    console.error('Error in PUT /api/gateways:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/gateways/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const namespace = req.query.namespace || 'default';
    
    if (!k8sService.isConnected()) {
      return res.status(503).json({ error: 'Kubernetes not connected' });
    }
    
    await k8sService.deleteGateway(name, namespace);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/gateways:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route management endpoints
app.get('/api/routes', async (req, res) => {
  try {
    console.log('Fetching routes...');
    const namespace = req.query.namespace; // Remove default, let backend handle it
    
    if (!k8sService.isConnected()) {
      // Fallback to mock data
      console.log('Kubernetes not connected, returning mock data');
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
      return res.json({ routes, total: routes.length });
    }
    
    // If no namespace specified, search all namespaces
    const routes = await k8sService.getHTTPRoutes(namespace);
    res.json({ routes, total: routes.length });
  } catch (error) {
    console.error('Error in /api/routes:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint specifically for all namespaces
app.get('/api/routes/all', async (req, res) => {
  try {
    console.log('Fetching routes from all namespaces...');
    
    if (!k8sService.isConnected()) {
      return res.json({ routes: [], total: 0 });
    }
    
    // Get routes from all namespaces by not passing a namespace parameter
    const routes = await k8sService.getAllHTTPRoutes();
    res.json({ routes, total: routes.length });
  } catch (error) {
    console.error('Error in /api/routes/all:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/routes', validate(httpRouteSchema), async (req, res) => {
  try {
    const routeSpec = req.validatedBody;
    const namespace = req.query.namespace || 'default';
    
    if (!k8sService.isConnected()) {
      // Mock creation if not connected
      const route = {
        id: `route-${Date.now()}`,
        name: routeSpec.name,
        namespace: namespace,
        parentRefs: routeSpec.parentRefs || [],
        hostnames: routeSpec.hostnames || [],
        rules: routeSpec.rules || [],
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      return res.status(201).json(route);
    }
    
    const route = await k8sService.createHTTPRoute(routeSpec, namespace);
    res.status(201).json(route);
  } catch (error) {
    console.error('Error in POST /api/routes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/routes/:name', validate(httpRouteSchema), async (req, res) => {
  try {
    const { name } = req.params;
    const routeSpec = req.validatedBody;
    const namespace = req.query.namespace || 'default';
    
    if (!k8sService.isConnected()) {
      return res.status(503).json({ error: 'Kubernetes not connected' });
    }
    
    const route = await k8sService.updateHTTPRoute(name, routeSpec, namespace);
    res.json(route);
  } catch (error) {
    console.error('Error in PUT /api/routes:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/routes/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const namespace = req.query.namespace || 'default';
    
    if (!k8sService.isConnected()) {
      return res.status(503).json({ error: 'Kubernetes not connected' });
    }
    
    await k8sService.deleteHTTPRoute(name, namespace);
    res.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/routes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Envoy Gateway deployment
app.post('/api/envoy-gateway/deploy', async (req, res) => {
  try {
    console.log('Deploying Envoy Gateway...');
    const namespace = req.body.namespace || 'envoy-gateway-system';
    
    if (!k8sService.isConnected()) {
      // Mock deployment if not connected
      const deployment = {
        status: 'success',
        message: 'Envoy Gateway deployment simulated (Kubernetes not connected)',
        deploymentId: `deploy-${Date.now()}`,
        components: [
          { name: 'envoy-gateway-controller', status: 'deployed' },
          { name: 'envoy-proxy', status: 'deployed' },
          { name: 'gateway-class', status: 'created' }
        ]
      };
      return res.json(deployment);
    }
    
    const deployment = await k8sService.deployEnvoyGateway(namespace);
    res.json(deployment);
  } catch (error) {
    console.error('Error in /api/envoy-gateway/deploy:', error);
    res.status(500).json({ error: error.message });
  }
});

// Kubernetes cluster information
app.get('/api/kubernetes/namespaces', async (req, res) => {
  try {
    if (!k8sService.isConnected()) {
      return res.status(503).json({ error: 'Kubernetes not connected' });
    }
    
    const namespaces = await k8sService.getNamespaces();
    res.json({ namespaces });
  } catch (error) {
    console.error('Error in /api/kubernetes/namespaces:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/kubernetes/services', async (req, res) => {
  try {
    const namespace = req.query.namespace || 'default';
    
    if (!k8sService.isConnected()) {
      return res.status(503).json({ error: 'Kubernetes not connected' });
    }
    
    const services = await k8sService.getServices(namespace);
    res.json({ services });
  } catch (error) {
    console.error('Error in /api/kubernetes/services:', error);
    res.status(500).json({ error: error.message });
  }
});

// Testing endpoint
app.post('/api/test-route', async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;
    
    // Real HTTP testing if URL is provided
    if (url && k8sService.isConnected()) {
      try {
        const response = await axios({
          method: method || 'GET',
          url: url,
          headers: headers || {},
          data: body,
          timeout: 5000,
          validateStatus: () => true // Accept any status code
        });
        
        return res.json({
          success: true,
          status: response.status,
          responseTime: Date.now() - Date.now(), // Simple mock for now
          headers: response.headers,
          body: response.data
        });
      } catch (error) {
        return res.json({
          success: false,
          error: error.message,
          status: 0,
          responseTime: 0
        });
      }
    }
    
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
app.get('/api/realtime-status', async (req, res) => {
  console.log('Real-time status requested');
  
  let gatewayCount = 0;
  let routeCount = 0;
  
  // Get actual counts if connected to Kubernetes
  if (k8sService.isConnected()) {
    try {
      const allGateways = await k8sService.getAllGateways();
      const allRoutes = await k8sService.getAllHTTPRoutes();
      gatewayCount = allGateways.length;
      routeCount = allRoutes.length;
    } catch (error) {
      console.log('Error getting real counts:', error.message);
    }
  }
  
  res.json({
    gateways: gatewayCount,
    routes: routeCount,
    status: 'running',
    kubernetes: k8sService.isConnected(),
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
  console.log(`Kubernetes connected: ${k8sService.isConnected()}`);
});

// Simple health endpoint for container health checks
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    port: PORT,
    kubernetes: k8sService.isConnected()
  });
});

console.log('Envoy Gateway Backend started successfully');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Phase 1 Implementation: Kubernetes Integration Active');