// Mock for LoggerService
const mockWinstonLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
  log: jest.fn(),
  child: jest.fn().mockReturnThis(),
  level: 'info',
};

class MockLoggerService {
  static instance;

  constructor() {
    this.logger = mockWinstonLogger;
  }

  static getInstance() {
    if (!MockLoggerService.instance) {
      MockLoggerService.instance = new MockLoggerService();
    }
    return MockLoggerService.instance;
  }

  debug(message, ...meta) {
    this.logger.debug(message, ...meta);
  }

  info(message, ...meta) {
    this.logger.info(message, ...meta);
  }

  warn(message, ...meta) {
    this.logger.warn(message, ...meta);
  }

  error(message, error, ...meta) {
    if (error instanceof Error) {
      this.logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else if (error) {
      this.logger.error(message, { error, ...meta });
    } else {
      this.logger.error(message, ...meta);
    }
  }

  fatal(message, error, ...meta) {
    this.error(message, error, ...meta);
  }

  log(level, message, ...meta) {
    this.logger.log(level, message, ...meta);
  }

  setLevel(level) {
    this.logger.level = level;
  }

  getLevel() {
    return this.logger.level;
  }

  createChild(defaultMeta) {
    // Create a new mock logger with the same methods
    const childLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      log: jest.fn(),
      child: jest.fn().mockReturnThis(),
      level: this.logger.level,
    };

    // Call the original child method
    this.logger.child(defaultMeta);

    return childLogger;
  }

  getLogger() {
    return this.logger;
  }

  child(defaultMeta) {
    return this;
  }
}

// Create a singleton instance
const loggerInstance = MockLoggerService.getInstance();

// Export the class and instance
const LoggerService = MockLoggerService;
const createLogger = jest.fn().mockReturnValue(mockWinstonLogger);

module.exports = {
  LoggerService,
  createLogger,
  mockWinstonLogger,
  default: LoggerService,
  getInstance: LoggerService.getInstance,
  logger: loggerInstance,
};
