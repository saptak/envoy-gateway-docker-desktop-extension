import { jest } from '@jest/globals';
import { DockerService } from '../../src/backend/services/dockerService';
import { DockerError } from '../../src/shared/types';

// Mock dockerode
jest.mock('dockerode', () => {
  return jest.fn().mockImplementation(() => ({
    ping: jest.fn(),
    listContainers: jest.fn(),
    createContainer: jest.fn(),
    getContainer: jest.fn(),
    listImages: jest.fn(),
    pull: jest.fn(),
    createNetwork: jest.fn(),
    listNetworks: jest.fn(),
    getEvents: jest.fn(),
    version: jest.fn(),
    modem: {
      followProgress: jest.fn(),
    },
  }));
});

describe('DockerService', () => {
  let dockerService: DockerService;
  let mockDocker: any;

  beforeEach(() => {
    // Reset singleton
    (DockerService as any).instance = undefined;
    dockerService = DockerService.getInstance();
    mockDocker = (dockerService as any).docker;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const service1 = DockerService.getInstance();
      const service2 = DockerService.getInstance();
      
      expect(service1).toBe(service2);
      expect(service1).toBeInstanceOf(DockerService);
    });
  });

  describe('Connection Validation', () => {
    it('should validate connection on initialization', async () => {
      mockDocker.ping.mockResolvedValue(true);
      
      // Create new instance to trigger validation
      (DockerService as any).instance = undefined;
      dockerService = DockerService.getInstance();
      
      // Wait for validation to complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(mockDocker.ping).toHaveBeenCalled();
    });

    it('should throw DockerError if connection fails', async () => {
      mockDocker.ping.mockRejectedValue(new Error('Connection failed'));
      
      expect(() => {
        (DockerService as any).instance = undefined;
        DockerService.getInstance();
      }).toThrow(DockerError);
    });
  });

  describe('Container Operations', () => {
    describe('listContainers', () => {
      it('should list containers successfully', async () => {
        const mockContainers = [
          {
            Id: 'container1',
            Names: ['/test-container'],
            Image: 'test-image',
            Status: 'running',
            State: 'running',
            Ports: [{ PrivatePort: 8080, PublicPort: 8080, Type: 'tcp' }],
            Labels: { 'test': 'label' },
            Created: 1234567890,
          },
        ];
        
        mockDocker.listContainers.mockResolvedValue(mockContainers);
        
        const result = await dockerService.listContainers();
        
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual(
          expect.objectContaining({
            id: 'container1',
            name: 'test-container',
            image: 'test-image',
            status: 'running',
            state: 'running',
          })
        );
      });

      it('should handle list containers error', async () => {
        mockDocker.listContainers.mockRejectedValue(new Error('List failed'));
        
        await expect(dockerService.listContainers()).rejects.toThrow(DockerError);
      });
    });

    describe('getContainer', () => {
      it('should get container details successfully', async () => {
        const mockContainer = {
          inspect: jest.fn().mockResolvedValue({
            Id: 'container1',
            Name: '/test-container',
            Config: {
              Image: 'test-image',
              Labels: { 'test': 'label' },
            },
            State: {
              Status: 'running',
            },
            NetworkSettings: {
              Ports: {
                '8080/tcp': [{ HostPort: '8080' }],
              },
            },
            Created: '2023-01-01T00:00:00.000Z',
          }),
        };
        
        mockDocker.getContainer.mockReturnValue(mockContainer);
        
        const result = await dockerService.getContainer('container1');
        
        expect(result).not.toBeNull();
        expect(result?.id).toBe('container1');
        expect(result?.name).toBe('test-container');
      });

      it('should return null for non-existent container', async () => {
        const mockContainer = {
          inspect: jest.fn().mockRejectedValue({ statusCode: 404 }),
        };
        
        mockDocker.getContainer.mockReturnValue(mockContainer);
        
        const result = await dockerService.getContainer('non-existent');
        
        expect(result).toBeNull();
      });

      it('should throw DockerError for other errors', async () => {
        const mockContainer = {
          inspect: jest.fn().mockRejectedValue(new Error('Inspect failed')),
        };
        
        mockDocker.getContainer.mockReturnValue(mockContainer);
        
        await expect(dockerService.getContainer('container1')).rejects.toThrow(DockerError);
      });
    });

    describe('createContainer', () => {
      it('should create container successfully', async () => {
        const mockContainer = { id: 'new-container-id' };
        mockDocker.createContainer.mockResolvedValue(mockContainer);
        
        const config = {
          Image: 'test-image',
          name: 'test-container',
        };
        
        const result = await dockerService.createContainer(config);
        
        expect(result).toBe('new-container-id');
        expect(mockDocker.createContainer).toHaveBeenCalledWith(config);
      });

      it('should handle create container error', async () => {
        mockDocker.createContainer.mockRejectedValue(new Error('Create failed'));
        
        const config = { Image: 'test-image' };
        
        await expect(dockerService.createContainer(config)).rejects.toThrow(DockerError);
      });
    });

    describe('Container Lifecycle', () => {
      let mockContainer: any;

      beforeEach(() => {
        mockContainer = {
          start: jest.fn(),
          stop: jest.fn(),
          remove: jest.fn(),
          logs: jest.fn(),
          stats: jest.fn(),
          exec: jest.fn(),
        };
        mockDocker.getContainer.mockReturnValue(mockContainer);
      });

      it('should start container successfully', async () => {
        mockContainer.start.mockResolvedValue(true);
        
        await dockerService.startContainer('container1');
        
        expect(mockContainer.start).toHaveBeenCalled();
      });

      it('should stop container successfully', async () => {
        mockContainer.stop.mockResolvedValue(true);
        
        await dockerService.stopContainer('container1', 10);
        
        expect(mockContainer.stop).toHaveBeenCalledWith({ t: 10 });
      });

      it('should remove container successfully', async () => {
        mockContainer.remove.mockResolvedValue(true);
        
        await dockerService.removeContainer('container1', true);
        
        expect(mockContainer.remove).toHaveBeenCalledWith({ force: true });
      });

      it('should get container logs', async () => {
        const mockLogs = Buffer.from('test logs');
        mockContainer.logs.mockResolvedValue(mockLogs);
        
        const result = await dockerService.getContainerLogs('container1', {
          tail: 50,
          timestamps: true,
        });
        
        expect(result).toBe('test logs');
        expect(mockContainer.logs).toHaveBeenCalledWith({
          stdout: true,
          stderr: true,
          tail: 50,
          timestamps: true,
        });
      });

      it('should handle container lifecycle errors', async () => {
        mockContainer.start.mockRejectedValue(new Error('Start failed'));
        mockContainer.stop.mockRejectedValue(new Error('Stop failed'));
        mockContainer.remove.mockRejectedValue(new Error('Remove failed'));
        
        await expect(dockerService.startContainer('container1')).rejects.toThrow(DockerError);
        await expect(dockerService.stopContainer('container1')).rejects.toThrow(DockerError);
        await expect(dockerService.removeContainer('container1')).rejects.toThrow(DockerError);
      });
    });
  });

  describe('Image Operations', () => {
    it('should list images successfully', async () => {
      const mockImages = [
        { Id: 'image1', RepoTags: ['test:latest'] },
        { Id: 'image2', RepoTags: ['nginx:latest'] },
      ];
      
      mockDocker.listImages.mockResolvedValue(mockImages);
      
      const result = await dockerService.listImages();
      
      expect(result).toEqual(mockImages);
      expect(mockDocker.listImages).toHaveBeenCalledWith({ all: false });
    });

    it('should pull image successfully', async () => {
      const mockStream = {
        on: jest.fn(),
      };
      
      mockDocker.pull.mockResolvedValue(mockStream);
      mockDocker.modem.followProgress.mockImplementation((stream, callback) => {
        callback(null, []);
      });
      
      await dockerService.pullImage('test-image:latest');
      
      expect(mockDocker.pull).toHaveBeenCalledWith('test-image:latest');
    });

    it('should handle pull image error', async () => {
      mockDocker.pull.mockRejectedValue(new Error('Pull failed'));
      
      await expect(dockerService.pullImage('test-image:latest')).rejects.toThrow(DockerError);
    });
  });

  describe('Network Operations', () => {
    it('should create network successfully', async () => {
      const mockNetwork = { id: 'network-id' };
      mockDocker.createNetwork.mockResolvedValue(mockNetwork);
      
      const result = await dockerService.createNetwork('test-network', {
        Driver: 'bridge',
      });
      
      expect(result).toBe('network-id');
      expect(mockDocker.createNetwork).toHaveBeenCalledWith({
        Name: 'test-network',
        Driver: 'bridge',
      });
    });

    it('should list networks successfully', async () => {
      const mockNetworks = [
        { Id: 'network1', Name: 'bridge' },
        { Id: 'network2', Name: 'host' },
      ];
      
      mockDocker.listNetworks.mockResolvedValue(mockNetworks);
      
      const result = await dockerService.listNetworks();
      
      expect(result).toEqual(mockNetworks);
    });
  });

  describe('Container Statistics', () => {
    it('should get container stats successfully', async () => {
      const mockStats = {
        cpu_stats: {
          cpu_usage: { total_usage: 1000000 },
          system_cpu_usage: 10000000,
          online_cpus: 4,
        },
        precpu_stats: {
          cpu_usage: { total_usage: 500000 },
          system_cpu_usage: 5000000,
        },
        memory_stats: {
          usage: 1073741824, // 1GB
          limit: 4294967296, // 4GB
        },
        networks: {
          eth0: {
            rx_bytes: 1000,
            tx_bytes: 2000,
          },
        },
      };
      
      const mockContainer = {
        stats: jest.fn().mockResolvedValue(mockStats),
      };
      
      mockDocker.getContainer.mockReturnValue(mockContainer);
      
      const result = await dockerService.getContainerStats('container1');
      
      expect(result).toEqual(
        expect.objectContaining({
          cpu: expect.objectContaining({
            percentage: expect.any(Number),
          }),
          memory: expect.objectContaining({
            usage: mockStats.memory_stats.usage,
            limit: mockStats.memory_stats.limit,
            percentage: 25, // 1GB / 4GB * 100
          }),
          network: expect.objectContaining({
            rx: 1000,
            tx: 2000,
          }),
          timestamp: expect.any(Date),
        })
      );
    });
  });

  describe('Health Check', () => {
    it('should return healthy status when Docker is running', async () => {
      mockDocker.ping.mockResolvedValue(true);
      mockDocker.version.mockResolvedValue({
        Version: '20.10.0',
        ApiVersion: '1.41',
        GitCommit: 'abc123',
        GoVersion: 'go1.17',
        Os: 'linux',
        Arch: 'amd64',
      });
      
      const result = await dockerService.healthCheck();
      
      expect(result.status).toBe('healthy');
      expect(result.version).toBe('20.10.0');
      expect(result.details).toBeDefined();
    });

    it('should return unhealthy status when Docker is not running', async () => {
      mockDocker.ping.mockRejectedValue(new Error('Connection failed'));
      
      const result = await dockerService.healthCheck();
      
      expect(result.status).toBe('unhealthy');
      expect(result.details).toEqual({ error: 'Connection failed' });
    });
  });

  describe('Event Monitoring', () => {
    it('should monitor Docker events', async () => {
      const mockStream = {
        on: jest.fn(),
      };
      
      mockDocker.getEvents.mockResolvedValue(mockStream);
      
      const callback = jest.fn();
      await dockerService.monitorEvents(callback);
      
      expect(mockDocker.getEvents).toHaveBeenCalledWith({
        filters: JSON.stringify({
          type: ['container'],
          event: ['start', 'stop', 'create', 'destroy', 'die'],
        }),
      });
    });
  });

  describe('Command Execution', () => {
    it('should execute command in container successfully', async () => {
      const mockExec = {
        start: jest.fn().mockResolvedValue({
          on: jest.fn().mockImplementation((event, callback) => {
            if (event === 'data') {
              // Simulate stdout data
              callback(Buffer.from('\x01\x00\x00\x00\x00\x00\x00\x0bHello World'));
            } else if (event === 'end') {
              callback();
            }
          }),
        }),
      };
      
      const mockContainer = {
        exec: jest.fn().mockResolvedValue(mockExec),
      };
      
      mockDocker.getContainer.mockReturnValue(mockContainer);
      
      const result = await dockerService.execInContainer('container1', ['echo', 'Hello World']);
      
      expect(result.stdout).toBe('Hello World');
      expect(result.stderr).toBe('');
    });
  });
});
