// ============================================================================
// 📝 STRUCTURED LOGGER FOR CLOUDWATCH
// ============================================================================
// This logger provides structured logging with CloudWatch integration.
//
// Features:
// - JSON-formatted logs for easy parsing in CloudWatch
// - Log levels: DEBUG, INFO, WARN, ERROR
// - Contextual metadata (requestId, userId, etc.)
// - Automatic CloudWatch integration (console.log captured by Lambda)
// - Development-friendly formatting with colors
//
// Usage:
//   import { logger } from './utils/logger';
//   logger.info('User logged in', { userId: '123', email: 'user@example.com' });
//   logger.error('Database error', { error: err.message, userId: '123' });
// ============================================================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export interface LogContext {
  userId?: string;
  email?: string;
  requestId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: string;
  stack?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  environment: string;
  service: string;
}

class Logger {
  private serviceName: string;
  private environment: string;
  private minLevel: LogLevel;

  constructor() {
    this.serviceName = 'ecokart-backend';
    this.environment = process.env.NODE_ENV || 'development';
    this.minLevel = this.getMinLogLevel();
  }

  private getMinLogLevel(): LogLevel {
    const configLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevel;
    if (configLevel && Object.values(LogLevel).includes(configLevel)) {
      return configLevel;
    }
    // Default: DEBUG in development, INFO in production
    return this.environment === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.minLevel);
    return currentLevelIndex >= minLevelIndex;
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      environment: this.environment,
      service: this.serviceName,
    };
  }

  private output(logEntry: LogEntry): void {
    if (this.environment === 'development') {
      // Development: Human-readable format with colors
      this.outputDevelopment(logEntry);
    } else {
      // Production: JSON format for CloudWatch parsing
      this.outputProduction(logEntry);
    }
  }

  private outputDevelopment(logEntry: LogEntry): void {
    const { timestamp, level, message, context } = logEntry;
    const time = new Date(timestamp).toLocaleTimeString('de-DE');

    // Color codes for terminal
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      RESET: '\x1b[0m',
    };

    const color = colors[level];
    const prefix = `${colors.RESET}[${time}] ${color}${level}${colors.RESET}`;

    if (context && Object.keys(context).length > 0) {
      // eslint-disable-next-line no-console
      console.log(`${prefix} ${message}`, context);
    } else {
      // eslint-disable-next-line no-console
      console.log(`${prefix} ${message}`);
    }
  }

  private outputProduction(logEntry: LogEntry): void {
    // JSON output for CloudWatch Logs Insights
    const jsonLog = JSON.stringify(logEntry);

    // Use appropriate console method based on level
    switch (logEntry.level) {
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(jsonLog);
        break;
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(jsonLog);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(jsonLog);
    }
  }

  /**
   * Log debug message (development only by default)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const logEntry = this.formatLogEntry(LogLevel.DEBUG, message, context);
    this.output(logEntry);
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const logEntry = this.formatLogEntry(LogLevel.INFO, message, context);
    this.output(logEntry);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const logEntry = this.formatLogEntry(LogLevel.WARN, message, context);
    this.output(logEntry);
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorContext: LogContext = { ...context };

    if (error) {
      errorContext.error = error.message;
      errorContext.stack = error.stack;

      // Include additional error properties
      if (error instanceof Error) {
        Object.keys(error).forEach((key) => {
          if (key !== 'message' && key !== 'stack') {
            errorContext[key] = (error as any)[key];
          }
        });
      }
    }

    const logEntry = this.formatLogEntry(LogLevel.ERROR, message, errorContext);
    this.output(logEntry);
  }

  /**
   * Create a child logger with additional context
   * Useful for request-scoped logging
   */
  child(baseContext: LogContext): ChildLogger {
    return new ChildLogger(this, baseContext);
  }
}

/**
 * Child logger with persistent context
 */
class ChildLogger {
  constructor(
    private parent: Logger,
    private baseContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.baseContext, ...context };
  }

  debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.parent.error(message, this.mergeContext(context), error);
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const logger = new Logger();

// ============================================================================
// CLOUDWATCH LOGS INSIGHTS QUERIES
// ============================================================================
// Use these queries in CloudWatch Logs Insights to analyze logs:
//
// 1. Find all ERROR logs:
//    fields @timestamp, message, context.error, context.userId
//    | filter level = "ERROR"
//    | sort @timestamp desc
//
// 2. Find slow requests (>1000ms):
//    fields @timestamp, message, context.path, context.duration
//    | filter context.duration > 1000
//    | sort context.duration desc
//
// 3. Track user activity:
//    fields @timestamp, message, context.userId, context.path
//    | filter context.userId = "specific-user-id"
//    | sort @timestamp asc
//
// 4. API endpoint performance:
//    stats avg(context.duration), max(context.duration), count(*) by context.path
//    | sort avg(context.duration) desc
// ============================================================================
