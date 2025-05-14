// Mock for routeController
import express from 'express';

const router = express.Router();

// GET /api/routes
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      routes: [],
      total: 0,
      page: 1,
      pageSize: 10,
      hasNext: false,
    },
    message: 'Routes retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/routes/:namespace/:name
router.get('/:namespace/:name', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: 'route-id',
      name: req.params.name,
      namespace: req.params.namespace,
      status: 'Accepted',
      parentRefs: [
        {
          name: 'test-gateway',
          namespace: 'default',
        },
      ],
      rules: [
        {
          backendRefs: [
            {
              name: 'test-service',
              port: 8080,
            },
          ],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    message: 'Route retrieved successfully',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/routes
router.post('/', (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      id: 'route-id',
      name: req.body.name,
      namespace: req.body.namespace,
      status: 'Pending',
      parentRefs: req.body.parentRefs,
      rules: req.body.rules,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    message: 'Route created successfully',
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/routes/:namespace/:name
router.put('/:namespace/:name', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: 'route-id',
      name: req.params.name,
      namespace: req.params.namespace,
      status: 'Accepted',
      parentRefs: req.body.parentRefs,
      rules: req.body.rules,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    message: 'Route updated successfully',
    timestamp: new Date().toISOString(),
  });
});

// DELETE /api/routes/:namespace/:name
router.delete('/:namespace/:name', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: req.params.name,
      namespace: req.params.namespace,
    },
    message: 'Route deleted successfully',
    timestamp: new Date().toISOString(),
  });
});

export default router;
