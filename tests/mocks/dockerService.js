// Mock for DockerService
const EventEmitter = require('events');

class MockDockerService extends EventEmitter {
  static instance;

  constructor() {
    super();
    
    // Create mock methods
    this.listContainers = jest.fn().mockResolvedValue([]);
    this.getContainer = jest.fn().mockResolvedValue(null);
    this.createContainer = jest.fn().mockResolvedValue('container-id');
    this.startContainer = jest.fn().mockResolvedValue(undefined);
    this.stopContainer = jest.fn().mockResolvedValue(undefined);
    this.removeContainer = jest.fn().mockResolvedValue(undefined);
    this.getContainerLogs = jest.fn().mockResolvedValue('container logs');
    this.getContainerStats = jest.fn().mockResolvedValue({
      cpu: { usage: 0, percentage: 0 },
      memory: { usage: 0, limit: 0, percentage: 0 },
      network: { rx: 0, tx: 0 },
      timestamp: new Date(),
    });
    this.listImages = jest.fn().mockResolvedValue([]);
    this.pullImage = jest.fn().mockResolvedValue(undefined);
    this.createNetwork = jest.fn().mockResolvedValue('network-id');
    this.listNetworks = jest.fn().mockResolvedValue([]);
    this.execInContainer = jest.fn().mockResolvedValue({ stdout: '', stderr: '' });
    this.monitorEvents = jest.fn().mockResolvedValue(undefined);
    this.healthCheck = jest.fn().mockResolvedValue({ status: 'healthy', version: '20.10.0' });
  }

  static getInstance() {
    if (!MockDockerService.instance) {
      MockDockerService.instance = new MockDockerService();
    }
    return MockDockerService.instance;
  }
}

const DockerService = MockDockerService;

module.exports = {
  DockerService,
  default: DockerService,
};
