import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.PORT = '0'; // Use random port for tests

// Mock Docker socket
process.env.DOCKER_SOCKET = '/var/run/docker.sock';

// Global test setup
beforeAll(() => {
  // Suppress console output during tests unless LOG_LEVEL=debug
  if (process.env.LOG_LEVEL !== 'debug') {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  }
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Increase timeout for integration tests
jest.setTimeout(30000);
