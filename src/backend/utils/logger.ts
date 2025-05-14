import winston from 'winston';
import path from 'path';

export class LoggerService {
  private static instance: LoggerService;
  private logger: winston.Logger;

  private constructor() {
    this.logger = this.createLogger();
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private createLogger(): winston.Logger {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logDir = process.env.LOG_DIR || './logs';

    // Custom format for console output
    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        
        // Add stack trace for errors
        if (stack) {
          log += `\n${stack}`;
        }
        
        // Add metadata if present
        if (Object.keys(meta).length > 0) {
          log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
      })
    );

    // Custom format for file output
    const fileFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const transports: winston.transport[] = [];

    // Console transport
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_CONSOLE_LOGS === 'true') {
      transports.push(
        new winston.transports.Console({
          level: logLevel,
          format: consoleFormat,
          handleExceptions: true,
          handleRejections: true,
        })
      );
    }

    // File transport for errors
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'error.log'),
          level: 'error',
          format: fileFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
          handleExceptions: true,
          handleRejections: true,
        })
      );

      // File transport for all logs
      transports.push(
        new winston.transports.File({
          filename: path.join(logDir, 'combined.log'),
          level: logLevel,
          format: fileFormat,
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        })
      );
    }

    return winston.createLogger({
      level: logLevel,
      format: fileFormat,
      transports,
      exitOnError: false,
    });
  }

  public debug(message: string, ...meta: any[]): void {
    this.logger.debug(message, ...meta);
  }

  public info(message: string, ...meta: any[]): void {
    this.logger.info(message, ...meta);
  }

  public warn(message: string, ...meta: any[]): void {
    this.logger.warn(message, ...meta);
  }

  public error(message: string, error?: Error | any, ...meta: any[]): void {
    if (error instanceof Error) {
      this.logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else if (error) {
      this.logger.error(message, { error, ...meta });
    } else {
      this.logger.error(message, ...meta);
    }
  }

  public fatal(message: string, error?: Error | any, ...meta: any[]): void {
    this.error(message, error, ...meta);
    
    // In fatal errors, we might want to exit the process
    if (process.env.EXIT_ON_FATAL === 'true') {
      process.exit(1);
    }
  }

  public log(level: string, message: string, ...meta: any[]): void {
    this.logger.log(level, message, ...meta);
  }

  public setLevel(level: string): void {
    this.logger.level = level;
    this.info(`Log level changed to: ${level}`);
  }

  public getLevel(): string {
    return this.logger.level;
  }

  public createChild(defaultMeta: any): winston.Logger {
    return this.logger.child(defaultMeta);
  }

  public getLogger(): winston.Logger {
    return this.logger;
  }
}

export default LoggerService;
