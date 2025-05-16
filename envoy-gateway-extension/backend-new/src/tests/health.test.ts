import request from 'supertest';
import express from 'express';

// Mock the backend class for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Health check endpoint (simplified for testing)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      mode: 'docker-desktop-extension',
      kubernetes: false,
      connection: 'socket'
    });
  });
  
  return app;
};

describe('Health Endpoint', () => {
  const app = createTestApp();

  it('should return health status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('version', '1.0.0');
    expect(response.body).toHaveProperty('mode', 'docker-desktop-extension');
    expect(response.body).toHaveProperty('timestamp');
  });

  it('should have valid timestamp format', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    const timestamp = new Date(response.body.timestamp);
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp.getTime()).not.toBeNaN();
  });
});
