module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>', '<rootDir>/../../tests/unit', '<rootDir>/../../tests/integration'],
  testMatch: [
    '**/__tests__/**/*.test.(ts|js)',
    '**/?(*.)+(spec|test).(ts|js)',
  ],
  transform: {
    '^.+\\.(ts)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  collectCoverageFrom: [
    '**/*.{ts}',
    '!**/*.d.ts',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: '../../coverage/backend',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/../../tests/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/services/(.*)$': '<rootDir>/services/$1',
    '^@/controllers/(.*)$': '<rootDir>/controllers/$1',
    '^@/middleware/(.*)$': '<rootDir>/middleware/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/shared/(.*)$': '<rootDir>/../shared/$1',
  },
  testTimeout: 30000, // Increased timeout for long-running tests
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  moduleDirectories: ['node_modules', 'src'],
};
