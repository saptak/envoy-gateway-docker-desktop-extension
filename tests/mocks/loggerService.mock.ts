// Mock for LoggerService
export class LoggerService {
  private static instance: LoggerService;
  
  private logger: any;
  
  private constructor() {
    this.logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
  }
  
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }
  
  public debug(message: string, ...args: any[]): void {
    this.logger.debug(message, ...args);
  }
  
  public info(message: string, ...args: any[]): void {
    this.logger.info(message, ...args);
  }
  
  public warn(message: string, ...args: any[]): void {
    this.logger.warn(message, ...args);
  }
  
  public error(message: string, ...args: any[]): void {
    this.logger.error(message, ...args);
  }
  
  // For testing
  public getMockLogger() {
    return this.logger;
  }
  
  // For testing - reset the singleton
  public static resetInstance(): void {
    LoggerService.instance = undefined;
  }
}
