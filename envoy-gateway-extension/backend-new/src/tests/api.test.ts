import request from 'supertest';
import express from 'express';

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  const mockNamespaces = [
    { name: 'default', status: 'Active', createdAt: new Date('2023-01-01') },
    { name: 'envoy-gateway-system', status: 'Active', createdAt: new Date('2023-01-02') }
  ];
  
  const mockGateways = [
    { 
      name: 'api-gateway', 
      namespace: 'default', 
      status: 'Ready',
      gatewayClassName: 'envoy-gateway',
      listeners: [{ name: 'http', port: 80, protocol: 'HTTP' }],
      createdAt: new Date('2023-01-05')
    }
  ];
  
  // Namespaces endpoint
  app.get('/api/namespaces', (req, res) => {
    res.json({ namespaces: mockNamespaces });
  });
  
  // Gateways endpoint
  app.get('/api/gateways', (req, res) => {
    const namespace = req.query.namespace as string;
    let filteredGateways = mockGateways;
    
    if (namespace && namespace !== '' && namespace !== 'All Namespaces') {
      filteredGateways = mockGateways.filter(g => g.namespace === namespace);
    }
    
    res.json({
      gateways: filteredGateways,
      total: filteredGateways.length
    });
  });
  
  return app;
};

describe('API Endpoints', () => {
  const app = createTestApp();

  describe('GET /api/namespaces', () => {
    it('should return list of namespaces', async () => {
      const response = await request(app)
        .get('/api/namespaces')
        .expect(200);

      expect(response.body).toHaveProperty('namespaces');
      expect(Array.isArray(response.body.namespaces)).toBe(true);
      expect(response.body.namespaces).toHaveLength(2);
      expect(response.body.namespaces[0]).toHaveProperty('name', 'default');
      expect(response.body.namespaces[0]).toHaveProperty('status', 'Active');
    });
  });

  describe('GET /api/gateways', () => {
    it('should return all gateways when no namespace specified', async () => {
      const response = await request(app)
        .get('/api/gateways')
        .expect(200);

      expect(response.body).toHaveProperty('gateways');
      expect(response.body).toHaveProperty('total', 1);
      expect(Array.isArray(response.body.gateways)).toBe(true);
      expect(response.body.gateways[0]).toHaveProperty('name', 'api-gateway');
    });

    it('should filter gateways by namespace', async () => {
      const response = await request(app)
        .get('/api/gateways?namespace=default')
        .expect(200);

      expect(response.body).toHaveProperty('gateways');
      expect(response.body).toHaveProperty('total', 1);
      expect(response.body.gateways[0].namespace).toBe('default');
    });

    it('should return empty array for non-existent namespace', async () => {
      const response = await request(app)
        .get('/api/gateways?namespace=non-existent')
        .expect(200);

      expect(response.body).toHaveProperty('gateways');
      expect(response.body).toHaveProperty('total', 0);
      expect(response.body.gateways).toHaveLength(0);
    });
  });
});
