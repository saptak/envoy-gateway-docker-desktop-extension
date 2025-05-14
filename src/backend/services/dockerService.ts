import Docker from 'dockerode';
import { EventEmitter } from 'events';
import { LoggerService } from '../utils/logger';
import { DockerError } from '../../shared/types';

export interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  ports: Array<{
    privatePort: number;
    publicPort?: number;
    type: string;
  }>;
  labels: Record<string, string>;
  createdAt: Date;
}

export interface ContainerStats {
  cpu: {
    usage: number;
    percentage: number;
  };
  memory: {
    usage: number;
    limit: number;
    percentage: number;
  };
  network: {
    rx: number;
    tx: number;
  };
  timestamp: Date;
}

export class DockerService extends EventEmitter {
  private docker: Docker;
  private logger: LoggerService;
  private static instance: DockerService;

  private constructor() {
    super();
    this.logger = LoggerService.getInstance();
    
    // Initialize Docker connection
    this.docker = new Docker({
      socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
    });

    this.validateConnection();
  }

  public static getInstance(): DockerService {
    if (!DockerService.instance) {
      DockerService.instance = new DockerService();
    }
    return DockerService.instance;
  }

  private async validateConnection(): Promise<void> {
    try {
      await this.docker.ping();
      this.logger.info('✅ Docker connection established');
    } catch (error) {
      this.logger.error('❌ Failed to connect to Docker:', error);
      throw new DockerError('Failed to connect to Docker daemon');
    }
  }

  /**
   * Lists all containers with optional filtering
   */
  public async listContainers(all = false, filters?: Record<string, string[]>): Promise<ContainerInfo[]> {
    try {
      const options: any = { all };
      if (filters) {
        options.filters = JSON.stringify(filters);
      }

      const containers = await this.docker.listContainers(options);
      
      return containers.map(container => ({
        id: container.Id,
        name: container.Names[0]?.replace(/^\//, '') || 'unknown',
        image: container.Image,
        status: container.Status,
        state: container.State,
        ports: container.Ports.map(port => ({
          privatePort: port.PrivatePort,
          publicPort: port.PublicPort,
          type: port.Type,
        })),
        labels: container.Labels || {},
        createdAt: new Date(container.Created * 1000),
      }));
    } catch (error) {
      this.logger.error('Error listing containers:', error);
      throw new DockerError(`Failed to list containers: ${error.message}`);
    }
  }

  /**
   * Gets information about a specific container
   */
  public async getContainer(id: string): Promise<ContainerInfo | null> {
    try {
      const container = this.docker.getContainer(id);
      const data = await container.inspect();

      return {
        id: data.Id,
        name: data.Name.replace(/^\//, ''),
        image: data.Config.Image,
        status: data.State.Status,
        state: data.State.Status,
        ports: Object.entries(data.NetworkSettings.Ports || {}).map(([port, bindings]) => ({
          privatePort: parseInt(port.split('/')[0]),
          publicPort: bindings?.[0]?.HostPort ? parseInt(bindings[0].HostPort) : undefined,
          type: port.split('/')[1] || 'tcp',
        })),
        labels: data.Config.Labels || {},
        createdAt: new Date(data.Created),
      };
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      this.logger.error(`Error getting container ${id}:`, error);
      throw new DockerError(`Failed to get container: ${error.message}`);
    }
  }

  /**
   * Creates a new container with the specified configuration
   */
  public async createContainer(config: Docker.ContainerCreateOptions): Promise<string> {
    try {
      const container = await this.docker.createContainer(config);
      this.logger.info(`Container created: ${container.id}`);
      this.emit('containerCreated', container.id);
      return container.id;
    } catch (error) {
      this.logger.error('Error creating container:', error);
      throw new DockerError(`Failed to create container: ${error.message}`);
    }
  }

  /**
   * Starts a container
   */
  public async startContainer(id: string): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.start();
      this.logger.info(`Container started: ${id}`);
      this.emit('containerStarted', id);
    } catch (error) {
      this.logger.error(`Error starting container ${id}:`, error);
      throw new DockerError(`Failed to start container: ${error.message}`);
    }
  }

  /**
   * Stops a container
   */
  public async stopContainer(id: string, timeout = 10): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.stop({ t: timeout });
      this.logger.info(`Container stopped: ${id}`);
      this.emit('containerStopped', id);
    } catch (error) {
      this.logger.error(`Error stopping container ${id}:`, error);
      throw new DockerError(`Failed to stop container: ${error.message}`);
    }
  }

  /**
   * Removes a container
   */
  public async removeContainer(id: string, force = false): Promise<void> {
    try {
      const container = this.docker.getContainer(id);
      await container.remove({ force });
      this.logger.info(`Container removed: ${id}`);
      this.emit('containerRemoved', id);
    } catch (error) {
      this.logger.error(`Error removing container ${id}:`, error);
      throw new DockerError(`Failed to remove container: ${error.message}`);
    }
  }

  /**
   * Gets container logs
   */
  public async getContainerLogs(id: string, options: {
    stdout?: boolean;
    stderr?: boolean;
    tail?: number;
    since?: number;
    timestamps?: boolean;
  } = {}): Promise<string> {
    try {
      const container = this.docker.getContainer(id);
      const logs = await container.logs({
        stdout: options.stdout !== false,
        stderr: options.stderr !== false,
        tail: options.tail || 100,
        since: options.since,
        timestamps: options.timestamps || false,
      });

      return logs.toString();
    } catch (error) {
      this.logger.error(`Error getting logs for container ${id}:`, error);
      throw new DockerError(`Failed to get container logs: ${error.message}`);
    }
  }

  /**
   * Gets container statistics
   */
  public async getContainerStats(id: string): Promise<ContainerStats> {
    try {
      const container = this.docker.getContainer(id);
      const stats = await container.stats({ stream: false });

      // Calculate CPU percentage
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuPercentage = systemDelta > 0 ? (cpuDelta / systemDelta) * stats.cpu_stats.online_cpus * 100 : 0;

      // Calculate memory percentage
      const memoryUsage = stats.memory_stats.usage || 0;
      const memoryLimit = stats.memory_stats.limit || 0;
      const memoryPercentage = memoryLimit > 0 ? (memoryUsage / memoryLimit) * 100 : 0;

      // Calculate network I/O
      const networks = stats.networks || {};
      let networkRx = 0;
      let networkTx = 0;
      
      Object.values(networks).forEach((network: any) => {
        networkRx += network.rx_bytes || 0;
        networkTx += network.tx_bytes || 0;
      });

      return {
        cpu: {
          usage: cpuDelta,
          percentage: Math.round(cpuPercentage * 100) / 100,
        },
        memory: {
          usage: memoryUsage,
          limit: memoryLimit,
          percentage: Math.round(memoryPercentage * 100) / 100,
        },
        network: {
          rx: networkRx,
          tx: networkTx,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error getting stats for container ${id}:`, error);
      throw new DockerError(`Failed to get container stats: ${error.message}`);
    }
  }

  /**
   * Lists Docker images
   */
  public async listImages(): Promise<any[]> {
    try {
      return await this.docker.listImages({ all: false });
    } catch (error) {
      this.logger.error('Error listing images:', error);
      throw new DockerError(`Failed to list images: ${error.message}`);
    }
  }

  /**
   * Pulls a Docker image
   */
  public async pullImage(name: string, onProgress?: (progress: any) => void): Promise<void> {
    try {
      const stream = await this.docker.pull(name);
      
      return new Promise((resolve, reject) => {
        this.docker.modem.followProgress(
          stream,
          (err, res) => {
            if (err) {
              reject(new DockerError(`Failed to pull image: ${err.message}`));
            } else {
              this.logger.info(`Image pulled successfully: ${name}`);
              resolve();
            }
          },
          onProgress
        );
      });
    } catch (error) {
      this.logger.error(`Error pulling image ${name}:`, error);
      throw new DockerError(`Failed to pull image: ${error.message}`);
    }
  }

  /**
   * Creates a Docker network
   */
  public async createNetwork(name: string, options: any = {}): Promise<string> {
    try {
      const network = await this.docker.createNetwork({
        Name: name,
        Driver: 'bridge',
        ...options,
      });
      
      this.logger.info(`Network created: ${name}`);
      return network.id;
    } catch (error) {
      this.logger.error(`Error creating network ${name}:`, error);
      throw new DockerError(`Failed to create network: ${error.message}`);
    }
  }

  /**
   * Lists Docker networks
   */
  public async listNetworks(): Promise<any[]> {
    try {
      return await this.docker.listNetworks();
    } catch (error) {
      this.logger.error('Error listing networks:', error);
      throw new DockerError(`Failed to list networks: ${error.message}`);
    }
  }

  /**
   * Executes a command in a container
   */
  public async execInContainer(id: string, cmd: string[]): Promise<{ stdout: string; stderr: string }> {
    try {
      const container = this.docker.getContainer(id);
      const exec = await container.exec({
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
      });

      const stream = await exec.start({ Detach: false });
      
      return new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        stream.on('data', (chunk) => {
          const text = chunk.toString();
          if (chunk[0] === 1) {
            stdout += text.substring(8); // Remove Docker stream header
          } else if (chunk[0] === 2) {
            stderr += text.substring(8); // Remove Docker stream header
          }
        });

        stream.on('end', () => {
          resolve({ stdout, stderr });
        });

        stream.on('error', (error) => {
          reject(new DockerError(`Failed to execute command: ${error.message}`));
        });
      });
    } catch (error) {
      this.logger.error(`Error executing command in container ${id}:`, error);
      throw new DockerError(`Failed to execute command: ${error.message}`);
    }
  }

  /**
   * Monitors container events
   */
  public async monitorEvents(callback: (event: any) => void): Promise<void> {
    try {
      const stream = await this.docker.getEvents({
        filters: JSON.stringify({
          type: ['container'],
          event: ['start', 'stop', 'create', 'destroy', 'die'],
        }),
      });

      stream.on('data', (chunk) => {
        try {
          const event = JSON.parse(chunk.toString());
          callback(event);
        } catch (error) {
          this.logger.error('Error parsing Docker event:', error);
        }
      });

      stream.on('error', (error) => {
        this.logger.error('Docker events stream error:', error);
      });

      this.logger.info('Docker events monitoring started');
    } catch (error) {
      this.logger.error('Error starting Docker events monitoring:', error);
      throw new DockerError(`Failed to monitor events: ${error.message}`);
    }
  }

  /**
   * Health check for Docker service
   */
  public async healthCheck(): Promise<{ status: string; version?: string; details?: any }> {
    try {
      await this.docker.ping();
      const version = await this.docker.version();
      
      return {
        status: 'healthy',
        version: version.Version,
        details: {
          apiVersion: version.ApiVersion,
          gitCommit: version.GitCommit,
          goVersion: version.GoVersion,
          os: version.Os,
          arch: version.Arch,
        },
      };
    } catch (error) {
      this.logger.error('Docker health check failed:', error);
      return {
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  }
}

export default DockerService;
