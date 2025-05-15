const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(express.static('/app/ui'));

// Mock data for demo purposes
const mockNamespaces = [
  { name: 'default', status: 'Active', createdAt: new Date('2023-01-01') },
  { name: 'envoy-gateway-system', status: 'Active', createdAt: new Date('2023-01-02') },
  { name: 'kube-system', status: 'Active', createdAt: new Date('2023-01-03') },
  { name: 'kube-public', status: 'Active', createdAt: new Date('2023-01-04') }
];

const mockGateways = [
  { 
    name: 'api-gateway', 
    namespace: 'default', 
    status: 'Ready',
    gatewayClassName: 'envoy-gateway',
    listeners: [{ name: 'http', port: 80, protocol: 'HTTP' }],
    createdAt: new Date('2023-01-05')
  },
  {
    name: 'admin-gateway',
    namespace: 'envoy-gateway-system',
    status: 'Ready',
    gatewayClassName: 'envoy-gateway',
    listeners: [{ name: 'https', port: 443, protocol: 'HTTPS' }],
    createdAt: new Date('2023-01-06')
  }
];

const mockRoutes = [
  {
    name: 'api-route',
    namespace: 'default', 
    status: 'Accepted',
    hostnames: ['api.example.com'],
    rules: [{ path: '/api/*' }],
    createdAt: new Date('2023-01-07')
  },
  {
    name: 'admin-route',
    namespace: 'envoy-gateway-system',
    status: 'Accepted', 
    hostnames: ['admin.example.com'],
    rules: [{ path: '/admin/*' }],
    createdAt: new Date('2023-01-08')
  }
];

// Serve the main UI
app.get('/', (req, res) => {
  res.sendFile(path.join('/app/ui', 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: port.toString(),
    kubernetes: true
  });
});

// Namespaces API
app.get('/api/kubernetes/namespaces', (req, res) => {
  res.json({
    namespaces: mockNamespaces
  });
});

// Gateways API
app.get('/api/gateways', (req, res) => {
  const namespace = req.query.namespace;
  let filteredGateways = mockGateways;
  
  if (namespace && namespace !== '') {
    filteredGateways = mockGateways.filter(g => g.namespace === namespace);
  }
  
  res.json({
    gateways: filteredGateways,
    total: filteredGateways.length
  });
});

app.get('/api/gateways/all', (req, res) => {
  res.json({
    gateways: mockGateways,
    total: mockGateways.length
  });
});

// Routes API  
app.get('/api/routes', (req, res) => {
  const namespace = req.query.namespace;
  let filteredRoutes = mockRoutes;
  
  if (namespace && namespace !== '') {
    filteredRoutes = mockRoutes.filter(r => r.namespace === namespace);
  }
  
  res.json({
    routes: filteredRoutes,
    total: filteredRoutes.length
  });
});

app.get('/api/routes/all', (req, res) => {
  res.json({
    routes: mockRoutes,
    total: mockRoutes.length
  });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Envoy Gateway Extension running on port ${port}`);
  console.log(`UI available at http://localhost:${port}`);
  console.log(`Serving static files from /app/ui`);
});