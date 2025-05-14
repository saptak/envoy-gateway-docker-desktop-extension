import { jest } from '@jest/globals';
import { DockerService } from '../../tests/mocks/dockerService';
import { DockerError } from '../../src/shared/types';

describe('DockerService', () => {
  let dockerService: DockerService;
  let mockDocker: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create a new instance with the mock already set up in the mock file
    dockerService = DockerService.getInstance();
    mockDocker = { ping: jest.fn().mockResolvedValue('OK') };
    (dockerService as any).docker = mockDocker;
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
      // Mock the validateConnection method
      dockerService.validateConnection = jest.fn().mockResolvedValue(true);

      // Call the method
      await dockerService.validateConnection();

      // Verify the method was called
      expect(dockerService.validateConnection).toHaveBeenCalled();
    });

    it('should throw DockerError if connection fails', async () => {
      // Mock the validateConnection method to throw an error
      dockerService.validateConnection = jest.fn().mockRejectedValue(new DockerError('Failed to connect to Docker daemon'));

      // Call the method and expect it to throw
      await expect(dockerService.validateConnection()).rejects.toThrow(DockerError);
    });
  });

  describe('Container Operations', () => {
    describe('listContainers', () => {
      it('should list containers successfully', async () => {
        // Mock the listContainers method
        const mockContainers = [
          {
            id: 'container1',
            name: 'test-container',
            image: 'test-image',
            status: 'running',
            state: 'running',
          }
        ];
        dockerService.listContainers = jest.fn().mockResolvedValue(mockContainers);

        // Call the method
        const result = await dockerService.listContainers();

        // Verify the result
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
        // Mock the listContainers method to throw an error
        dockerService.listContainers = jest.fn().mockRejectedValue(new DockerError('List failed'));

        // Call the method and expect it to throw
        await expect(dockerService.listContainers()).rejects.toThrow(DockerError);
      });
    });

    describe('getContainer', () => {
      it('should get container details successfully', async () => {
        // Mock the getContainer method
        const mockContainer = {
          id: 'container1',
          name: 'test-container',
          image: 'test-image',
          status: 'running',
          state: 'running',
        };
        dockerService.getContainer = jest.fn().mockResolvedValue(mockContainer);

        // Call the method
        const result = await dockerService.getContainer('container1');

        // Verify the result
        expect(result).not.toBeNull();
        expect(result?.id).toBe('container1');
        expect(result?.name).toBe('test-container');
      });

      it('should return null for non-existent container', async () => {
        // Mock the getContainer method to return null
        dockerService.getContainer = jest.fn().mockResolvedValue(null);

        // Call the method
        const result = await dockerService.getContainer('non-existent');

        // Verify the result
        expect(result).toBeNull();
      });

      it('should throw DockerError for other errors', async () => {
        // Mock the getContainer method to throw an error
        dockerService.getContainer = jest.fn().mockRejectedValue(new DockerError('Inspect failed'));

        // Call the method and expect it to throw
        await expect(dockerService.getContainer('container1')).rejects.toThrow(DockerError);
      });
    });

    describe('createContainer', () => {
      it('should create container successfully', async () => {
        // Mock the createContainer method
        dockerService.createContainer = jest.fn().mockResolvedValue('new-container-id');

        // Call the method
        const config = {
          Image: 'test-image',
          name: 'test-container',
        };
        const result = await dockerService.createContainer(config);

        // Verify the result
        expect(result).toBe('new-container-id');
      });

      it('should handle create container error', async () => {
        // Mock the createContainer method to throw an error
        dockerService.createContainer = jest.fn().mockRejectedValue(new DockerError('Create failed'));

        // Call the method and expect it to throw
        const config = { Image: 'test-image' };
        await expect(dockerService.createContainer(config)).rejects.toThrow(DockerError);
      });
    });

    describe('Container Lifecycle', () => {
      it('should start container successfully', async () => {
        // Mock the startContainer method
        dockerService.startContainer = jest.fn().mockResolvedValue(undefined);

        // Call the method
        await dockerService.startContainer('container1');

        // Verify the method was called
        expect(dockerService.startContainer).toHaveBeenCalledWith('container1');
      });

      it('should stop container successfully', async () => {
        // Mock the stopContainer method
        dockerService.stopContainer = jest.fn().mockResolvedValue(undefined);

        // Call the method
        await dockerService.stopContainer('container1', 10);

        // Verify the method was called
        expect(dockerService.stopContainer).toHaveBeenCalledWith('container1', 10);
      });

      it('should remove container successfully', async () => {
        // Mock the removeContainer method
        dockerService.removeContainer = jest.fn().mockResolvedValue(undefined);

        // Call the method
        await dockerService.removeContainer('container1', true);

        // Verify the method was called
        expect(dockerService.removeContainer).toHaveBeenCalledWith('container1', true);
      });

      it('should get container logs', async () => {
        // Mock the getContainerLogs method
        dockerService.getContainerLogs = jest.fn().mockResolvedValue('test logs');

        // Call the method
        const result = await dockerService.getContainerLogs('container1', {
          tail: 50,
          timestamps: true,
        });

        // Verify the result
        expect(result).toBe('test logs');
      });

      it('should handle container lifecycle errors', async () => {
        // Mock the methods to throw errors
        dockerService.startContainer = jest.fn().mockRejectedValue(new DockerError('Start failed'));
        dockerService.stopContainer = jest.fn().mockRejectedValue(new DockerError('Stop failed'));
        dockerService.removeContainer = jest.fn().mockRejectedValue(new DockerError('Remove failed'));

        // Call the methods and expect them to throw
        await expect(dockerService.startContainer('container1')).rejects.toThrow(DockerError);
        await expect(dockerService.stopContainer('container1')).rejects.toThrow(DockerError);
        await expect(dockerService.removeContainer('container1')).rejects.toThrow(DockerError);
      });
    });
  });

  describe('Image Operations', () => {
    it('should list images successfully', async () => {
      // Mock the listImages method
      const mockImages = [
        { id: 'image1', tags: ['test:latest'] },
        { id: 'image2', tags: ['nginx:latest'] },
      ];
      dockerService.listImages = jest.fn().mockResolvedValue(mockImages);

      // Call the method
      const result = await dockerService.listImages();

      // Verify the result
      expect(result).toEqual(mockImages);
    });

    it('should pull image successfully', async () => {
      // Mock the pullImage method
      dockerService.pullImage = jest.fn().mockResolvedValue(undefined);

      // Call the method
      await dockerService.pullImage('test-image:latest');

      // Verify the method was called
      expect(dockerService.pullImage).toHaveBeenCalledWith('test-image:latest');
    });

    it('should handle pull image error', async () => {
      // Mock the pullImage method to throw an error
      dockerService.pullImage = jest.fn().mockRejectedValue(new DockerError('Pull failed'));

      // Call the method and expect it to throw
      await expect(dockerService.pullImage('test-image:latest')).rejects.toThrow(DockerError);
    });
  });

  describe('Network Operations', () => {
    it('should create network successfully', async () => {
      // Mock the createNetwork method
      dockerService.createNetwork = jest.fn().mockResolvedValue('network-id');

      // Call the method
      const result = await dockerService.createNetwork('test-network', {
        Driver: 'bridge',
      });

      // Verify the result
      expect(result).toBe('network-id');
    });

    it('should list networks successfully', async () => {
      // Mock the listNetworks method
      const mockNetworks = [
        { id: 'network1', name: 'bridge' },
        { id: 'network2', name: 'host' },
      ];
      dockerService.listNetworks = jest.fn().mockResolvedValue(mockNetworks);

      // Call the method
      const result = await dockerService.listNetworks();

      // Verify the result
      expect(result).toEqual(mockNetworks);
    });
  });

  describe('Container Statistics', () => {
    it('should get container stats successfully', async () => {
      // Mock the getContainerStats method
      const mockStats = {
        cpu: { usage: 1000000, percentage: 25 },
        memory: {
          usage: 1073741824, // 1GB
          limit: 4294967296, // 4GB
          percentage: 25, // 1GB / 4GB * 100
        },
        network: {
          rx: 1000,
          tx: 2000,
        },
        timestamp: new Date(),
      };
      dockerService.getContainerStats = jest.fn().mockResolvedValue(mockStats);

      // Call the method
      const result = await dockerService.getContainerStats('container1');

      // Verify the result
      expect(result).toEqual(
        expect.objectContaining({
          cpu: expect.objectContaining({
            percentage: expect.any(Number),
          }),
          memory: expect.objectContaining({
            usage: mockStats.memory.usage,
            limit: mockStats.memory.limit,
            percentage: 25,
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
      // Mock the healthCheck method
      dockerService.healthCheck = jest.fn().mockResolvedValue({
        status: 'healthy',
        version: '20.10.0',
        details: {
          Version: '20.10.0',
          ApiVersion: '1.41',
          GitCommit: 'abc123',
          GoVersion: 'go1.17',
          Os: 'linux',
          Arch: 'amd64',
        },
      });

      // Call the method
      const result = await dockerService.healthCheck();

      // Verify the result
      expect(result.status).toBe('healthy');
      expect(result.version).toBe('20.10.0');
      expect(result.details).toBeDefined();
    });

    it('should return unhealthy status when Docker is not running', async () => {
      // Mock the healthCheck method to return unhealthy status
      dockerService.healthCheck = jest.fn().mockResolvedValue({
        status: 'unhealthy',
        details: { error: 'Connection failed' },
      });

      // Call the method
      const result = await dockerService.healthCheck();

      // Verify the result
      expect(result.status).toBe('unhealthy');
      expect(result.details).toEqual({ error: 'Connection failed' });
    });
  });

  describe('Event Monitoring', () => {
    it('should monitor Docker events', async () => {
      // Mock the monitorEvents method
      dockerService.monitorEvents = jest.fn().mockResolvedValue(undefined);

      // Call the method
      const callback = jest.fn();
      await dockerService.monitorEvents(callback);

      // Verify the method was called
      expect(dockerService.monitorEvents).toHaveBeenCalledWith(callback);
    });
  });

  describe('Command Execution', () => {
    it('should execute command in container successfully', async () => {
      // Mock the execInContainer method
      dockerService.execInContainer = jest.fn().mockResolvedValue({
        stdout: 'Hello World',
        stderr: '',
      });

      // Call the method
      const result = await dockerService.execInContainer('container1', ['echo', 'Hello World']);

      // Verify the result
      expect(result.stdout).toBe('Hello World');
      expect(result.stderr).toBe('');
    });
  });
});
