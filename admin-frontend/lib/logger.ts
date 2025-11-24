// ============================================================================
// 📝 STRUCTURED LOGGER FOR ADMIN FRONTEND
// ============================================================================
// This logger provides structured logging for the admin dashboard.
//
// Features:
// - Structured log format for better debugging
// - Log levels: DEBUG, INFO, WARN, ERROR
// - Development-friendly console output
// - Production-ready (prepared for error tracking integration like Sentry)
// - Contextual metadata support
//
// Usage:
//   import { logger } from '@/lib/logger';
//   logger.info('Admin logged in', { email: 'admin@example.com' });
//   logger.error('Failed to update product', { productId: '123', error: err.message });
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
  path?: string;
  component?: string;
  action?: string;
  productId?: string;
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
}

class Logger {
  private environment: string;
  private minLevel: LogLevel;

  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.minLevel = this.getMinLogLevel();
  }

  private getMinLogLevel(): LogLevel {
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
    };
  }

  private output(logEntry: LogEntry): void {
    const { timestamp, level, message, context } = logEntry;
    const time = new Date(timestamp).toLocaleTimeString('de-DE');

    // Color styles for browser console
    const styles = {
      DEBUG: 'color: #00bcd4; font-weight: bold',
      INFO: 'color: #4caf50; font-weight: bold',
      WARN: 'color: #ff9800; font-weight: bold',
      ERROR: 'color: #f44336; font-weight: bold',
    };

    const prefix = `[${time}] %c${level}`;
    const style = styles[level];

    if (context && Object.keys(context).length > 0) {
      /* eslint-disable no-console */
      switch (level) {
        case LogLevel.ERROR:
          console.error(prefix, style, message, context);
          break;
        case LogLevel.WARN:
          console.warn(prefix, style, message, context);
          break;
        case LogLevel.DEBUG:
          console.debug(prefix, style, message, context);
          break;
        default:
          console.log(prefix, style, message, context);
      }
      /* eslint-enable no-console */
    } else {
      /* eslint-disable no-console */
      switch (level) {
        case LogLevel.ERROR:
          console.error(prefix, style, message);
          break;
        case LogLevel.WARN:
          console.warn(prefix, style, message);
          break;
        case LogLevel.DEBUG:
          console.debug(prefix, style, message);
          break;
        default:
          console.log(prefix, style, message);
      }
      /* eslint-enable no-console */
    }

    // In production, send ERROR and WARN logs to error tracking service
    if (this.environment === 'production' && (level === LogLevel.ERROR || level === LogLevel.WARN)) {
      this.sendToErrorTracking(logEntry);
    }
  }

  private sendToErrorTracking(logEntry: LogEntry): void {
    // TODO: Integrate with error tracking service (e.g., Sentry)
    // Example:
    // if (typeof Sentry !== 'undefined') {
    //   Sentry.captureMessage(logEntry.message, {
    //     level: logEntry.level.toLowerCase(),
    //     extra: logEntry.context,
    //   });
    // }
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
   * Useful for component-scoped logging
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
