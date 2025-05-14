module.exports = {
  preset: 'ts-jest',
  // Default test environment
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)',
  ],

  // Configure different test environments for frontend and backend
  projects: [
    {
      displayName: 'frontend',
      testMatch: ['<rootDir>/src/frontend/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx',
          },
        }],
      },
    },
    {
      displayName: 'backend',
      testMatch: ['<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}'],
      testEnvironment: 'node',
      preset: 'ts-jest',
    },
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/frontend/components/$1',
    '^@/pages/(.*)$': '<rootDir>/src/frontend/pages/$1',
    '^@/services/(.*)$': '<rootDir>/src/frontend/services/$1',
    '^@/utils/(.*)$': '<rootDir>/src/shared/utils/$1',
    '^@/types/(.*)$': '<rootDir>/src/shared/types/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/frontend/hooks/$1',
    '^@/constants/(.*)$': '<rootDir>/src/shared/constants/$1',
    '^@/store/(.*)$': '<rootDir>/src/frontend/store/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
    // Handle CSS and static assets
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/mocks/fileMock.js',
    // Mock modules
    '^socket.io$': '<rootDir>/tests/mocks/socket.io.js',
    '^dockerode$': '<rootDir>/tests/mocks/dockerode.js',
    '^../../src/backend/utils/logger$': '<rootDir>/tests/mocks/loggerService.js',
    '^../utils/logger$': '<rootDir>/tests/mocks/loggerService.js',
    '^../../src/backend/services/dockerService$': '<rootDir>/tests/mocks/dockerService.js',
    '^../../src/backend/services/websocketService$': '<rootDir>/tests/mocks/websocketService.js',
    '^../../src/backend/services/kubernetesService$': '<rootDir>/tests/mocks/kubernetesService.js',
    '^../../src/backend/middleware/errorHandler$': '<rootDir>/tests/mocks/errorHandler.js',
    '^../../src/backend/index$': '<rootDir>/tests/mocks/application.js',
    '^../../src/backend/controllers/gatewayController$': '<rootDir>/tests/mocks/gatewayController.js',
    '^../../src/backend/controllers/routeController$': '<rootDir>/tests/mocks/routeController.js',
    '^../../src/backend/controllers/healthController$': '<rootDir>/tests/mocks/healthController.js',
    '^../../src/backend/controllers/configController$': '<rootDir>/tests/mocks/configController.js',
  },
  testTimeout: 30000, // Increased timeout for long-running tests
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  moduleDirectories: ['node_modules', 'src'],
};
