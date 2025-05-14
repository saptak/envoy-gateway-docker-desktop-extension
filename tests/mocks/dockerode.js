// Mock for dockerode
const mockContainer = {
  inspect: jest.fn().mockResolvedValue({}),
  start: jest.fn().mockResolvedValue({}),
  stop: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({}),
  logs: jest.fn().mockResolvedValue(Buffer.from('test logs')),
  stats: jest.fn().mockResolvedValue({
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
  }),
  exec: jest.fn().mockResolvedValue({
    start: jest.fn().mockResolvedValue({
      on: jest.fn(),
    }),
  }),
};

const mockImage = {
  inspect: jest.fn().mockResolvedValue({}),
};

const mockNetwork = {
  inspect: jest.fn().mockResolvedValue({}),
  connect: jest.fn().mockResolvedValue({}),
  disconnect: jest.fn().mockResolvedValue({}),
  remove: jest.fn().mockResolvedValue({}),
};

const mockStream = {
  on: jest.fn(),
};

// Create a mock Docker instance
const mockDockerInstance = {
  ping: jest.fn().mockResolvedValue('OK'),
  listContainers: jest.fn().mockResolvedValue([]),
  getContainer: jest.fn().mockReturnValue(mockContainer),
  createContainer: jest.fn().mockResolvedValue({ id: 'new-container-id' }),
  getImage: jest.fn().mockReturnValue(mockImage),
  listImages: jest.fn().mockResolvedValue([]),
  pull: jest.fn().mockResolvedValue(mockStream),
  createNetwork: jest.fn().mockResolvedValue({ id: 'network-id' }),
  getNetwork: jest.fn().mockReturnValue(mockNetwork),
  listNetworks: jest.fn().mockResolvedValue([]),
  getEvents: jest.fn().mockResolvedValue(mockStream),
  version: jest.fn().mockResolvedValue({
    Version: '20.10.0',
    ApiVersion: '1.41',
    GitCommit: 'abc123',
    GoVersion: 'go1.17',
    Os: 'linux',
    Arch: 'amd64',
  }),
  modem: {
    followProgress: jest.fn().mockImplementation((stream, callback) => {
      callback(null, []);
    }),
  },
};

// Export the mock constructor
module.exports = jest.fn().mockImplementation(() => mockDockerInstance);
