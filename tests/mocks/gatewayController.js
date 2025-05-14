// Mock for gatewayController
import express from 'express';

const router = express.Router();

// GET /api/gateways
router.get('/', (req, res) => {
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

// GET /api/gateways/:namespace/:name
router.get('/:namespace/:name', (req, res) => {
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

// POST /api/gateways
router.post('/', (req, res) => {
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

// PUT /api/gateways/:namespace/:name
router.put('/:namespace/:name', (req, res) => {
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

// DELETE /api/gateways/:namespace/:name
router.delete('/:namespace/:name', (req, res) => {
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

export default router;
