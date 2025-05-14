const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Simple API endpoints for testing
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'envoy-gateway-extension',
    timestamp: new Date() 
  });
});

app.get('/api/gateways', (req, res) => {
  res.json({ 
    gateways: [], 
    message: 'Gateway API endpoint working',
    timestamp: new Date()
  });
});

app.post('/api/gateways', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Gateway creation endpoint working',
    data: req.body,
    timestamp: new Date()
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Envoy Gateway Extension API running on port ${port}`);
});
