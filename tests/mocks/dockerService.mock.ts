export class MockDockerService {
  private mockLogger: any;
  private mockWebSocketService: any;
  private mockContainers: any[];
  private mockImages: any[];
  private mockEvents: any[];

  constructor() {
    this.mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    
    this.mockWebSocketService = {
      broadcastDockerEvent: jest.fn(),
    };
    
    this.mockContainers = [];
    this.mockImages = [];
    this.mockEvents = [];
  }

  initialize() {
    return this;
  }

  shutdown() {
    return Promise.resolve();
  }

  async getContainers(all = false) {
    return this.mockContainers;
  }

  async getContainer(id: string) {
    const container = this.mockContainers.find(c => c.Id === id || c.Names.includes(`/${id}`));
    if (!container) {
      throw new Error(`Container ${id} not found`);
    }
    return container;
  }

  async startContainer(id: string) {
    const container = await this.getContainer(id);
    container.State = 'running';
    this.mockWebSocketService.broadcastDockerEvent('container.start', { id });
    return container;
  }

  async stopContainer(id: string) {
    const container = await this.getContainer(id);
    container.State = 'stopped';
    this.mockWebSocketService.broadcastDockerEvent('container.stop', { id });
    return container;
  }

  async getImages() {
    return this.mockImages;
  }

  async pullImage(name: string, tag = 'latest') {
    const image = {
      Id: `sha256:${Math.random().toString(36).substring(2, 15)}`,
      RepoTags: [`${name}:${tag}`],
      Created: new Date().getTime() / 1000,
      Size: 1000000,
    };
    this.mockImages.push(image);
    this.mockWebSocketService.broadcastDockerEvent('image.pull', { name, tag });
    return image;
  }

  // Mock helpers for testing
  getMockLogger() {
    return this.mockLogger;
  }

  getMockWebSocketService() {
    return this.mockWebSocketService;
  }

  setMockContainers(containers: any[]) {
    this.mockContainers = containers;
    return this;
  }

  setMockImages(images: any[]) {
    this.mockImages = images;
    return this;
  }

  setMockEvents(events: any[]) {
    this.mockEvents = events;
    return this;
  }
}
