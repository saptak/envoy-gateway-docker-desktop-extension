const express = require('express');
const path = require('path');
const http = require('http');
const app = express();

// Configure for Docker Desktop extension mode
const isExtensionMode = !!process.env.DOCKER_DESKTOP_EXTENSION;
const port = process.env.PORT || 8080;

console.log('Starting Envoy Gateway Extension backend...');
console.log('Extension mode:', isExtensionMode);

// Middleware
app.use(express.json());

// In extension mode, serve static files for frontend requests
if (isExtensionMode) {
  app.use(express.static('/ui'));
}

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    mode: isExtensionMode ? 'docker-desktop-extension' : 'standalone',
    kubernetes: true,
    connection: 'healthy'
  });
});

// Backend status endpoint for UI
app.get('/api/backend/status', (req, res) => {
  res.json({
    status: 'connected',
    mode: isExtensionMode ? 'extension' : 'standalone',
    timestamp: new Date().toISOString()
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
  
  if (namespace && namespace !== '' && namespace !== 'All Namespaces') {
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
  
  if (namespace && namespace !== '' && namespace !== 'All Namespaces') {
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

// Create server
const server = http.createServer(app);

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Envoy Gateway Extension backend running on port ${port}`);
  console.log('Backend is healthy and ready to serve requests');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});