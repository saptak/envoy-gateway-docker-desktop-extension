// Mock API service
export const apiService = {
  getGateways: jest.fn(),
  createGateway: jest.fn(),
  deleteGateway: jest.fn(),
  getRoutes: jest.fn(),
  createRoute: jest.fn(),
  deleteRoute: jest.fn(),
  getMetrics: jest.fn(),
  getHealth: jest.fn(),
  getSystemStatus: jest.fn(),
  getContainers: jest.fn(),
  startContainer: jest.fn(),
  stopContainer: jest.fn(),
  getConfiguration: jest.fn(),
  updateConfiguration: jest.fn(),
};