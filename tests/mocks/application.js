// Mock for Application class
import express from 'express';
import { mockKubernetesService } from './kubernetesService';
import { mockDockerService } from './dockerService';
import { mockWebSocketService } from './websocketService';
import gatewayRoutes from './gatewayController';
import routeRoutes from './routeController';
import healthRoutes from './healthController';
import configRoutes from './configController';

class MockApplication {
  constructor() {
    this.app = express();
    this.port = 8080;
    this.server = {
      listen: jest.fn(),
      close: jest.fn((callback) => callback()),
    };
    this.io = {
      on: jest.fn(),
      emit: jest.fn(),
    };
    this.websocketService = mockWebSocketService;

    // Initialize routes
    this.app.use('/api/health', healthRoutes);
    this.app.use('/api/gateways', gatewayRoutes);
    this.app.use('/api/routes', routeRoutes);
    this.app.use('/api/config', configRoutes);
  }

  getApp() {
    return this.app;
  }

  getServer() {
    return this.server;
  }

  listen() {
    this.server.listen(this.port);
  }

  close() {
    return new Promise((resolve) => {
      this.server.close(() => resolve());
    });
  }

  getKubernetesService() {
    return mockKubernetesService;
  }

  getDockerService() {
    return mockDockerService;
  }

  getWebSocketService() {
    return mockWebSocketService;
  }
}

export const Application = MockApplication;
export default MockApplication;
