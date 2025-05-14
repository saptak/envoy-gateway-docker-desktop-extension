import { LoggerService } from '../../src/backend/utils/logger';

describe('LoggerService', () => {
  let logger: LoggerService;

  beforeEach(() => {
    // Reset singleton instance for each test
    (LoggerService as any).instance = undefined;
    logger = LoggerService.getInstance();
  });

  afterEach(() => {
    // Clean up
    (LoggerService as any).instance = undefined;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const logger1 = LoggerService.getInstance();
      const logger2 = LoggerService.getInstance();
      
      expect(logger1).toBe(logger2);
      expect(logger1).toBeInstanceOf(LoggerService);
    });
  });

  describe('Logging Methods', () => {
    it('should have all required logging methods', () => {
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.fatal).toBeDefined();
      expect(logger.log).toBeDefined();
    });

    it('should log messages without throwing errors', () => {
      expect(() => {
        logger.debug('Debug message');
        logger.info('Info message');
        logger.warn('Warning message');
        logger.error('Error message');
        logger.fatal('Fatal message');
      }).not.toThrow();
    });

    it('should handle error objects in error method', () => {
      const error = new Error('Test error');
      
      expect(() => {
        logger.error('Error with object', error);
      }).not.toThrow();
    });

    it('should handle metadata in logging methods', () => {
      expect(() => {
        logger.info('Message with metadata', { userId: 123, action: 'test' });
        logger.error('Error with metadata', new Error('Test'), { context: 'test' });
      }).not.toThrow();
    });
  });

  describe('Log Level Management', () => {
    it('should allow setting and getting log level', () => {
      logger.setLevel('debug');
      expect(logger.getLevel()).toBe('debug');
      
      logger.setLevel('error');
      expect(logger.getLevel()).toBe('error');
    });
  });

  describe('Child Logger', () => {
    it('should create child logger with default metadata', () => {
      const childLogger = logger.createChild({ service: 'test-service' });
      
      expect(childLogger).toBeDefined();
      expect(childLogger).not.toBe(logger.getLogger());
    });
  });

  describe('Winston Logger Access', () => {
    it('should provide access to underlying winston logger', () => {
      const winstonLogger = logger.getLogger();
      
      expect(winstonLogger).toBeDefined();
      expect(winstonLogger.info).toBeDefined();
    });
  });
});
