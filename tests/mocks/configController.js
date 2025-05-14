// Mock for configController
import express from 'express';

const router = express.Router();

// GET /api/config
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      features: {
        kubernetes: true,
        docker: true,
        envoyGateway: true,
      },
    },
    message: 'Configuration retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/config/namespaces
router.get('/namespaces', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      namespaces: ['default', 'kube-system', 'envoy-gateway-system'],
    },
    message: 'Namespaces retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/config/services
router.get('/services', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      services: [
        {
          name: 'kubernetes',
          namespace: 'default',
          clusterIP: '10.96.0.1',
          ports: [{ port: 443 }],
        },
      ],
    },
    message: 'Services retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/config/yaml
router.post('/yaml', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      results: [
        {
          kind: 'Gateway',
          name: 'test-gateway',
          namespace: 'default',
          operation: 'created',
        },
      ],
    },
    message: 'YAML configuration applied successfully',
    timestamp: new Date().toISOString(),
  });
});

export default router;
