"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    serviceName;
    environment;
    minLevel;
    constructor() {
        this.serviceName = 'ecokart-backend';
        this.environment = process.env.NODE_ENV || 'development';
        this.minLevel = this.getMinLogLevel();
    }
    getMinLogLevel() {
        const configLevel = process.env.LOG_LEVEL?.toUpperCase();
        if (configLevel && Object.values(LogLevel).includes(configLevel)) {
            return configLevel;
        }
        // Default: DEBUG in development, INFO in production
        return this.environment === 'development' ? LogLevel.DEBUG : LogLevel.INFO;
    }
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        const currentLevelIndex = levels.indexOf(level);
        const minLevelIndex = levels.indexOf(this.minLevel);
        return currentLevelIndex >= minLevelIndex;
    }
    formatLogEntry(level, message, context) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            context,
            environment: this.environment,
            service: this.serviceName,
        };
    }
    output(logEntry) {
        if (this.environment === 'development') {
            // Development: Human-readable format with colors
            this.outputDevelopment(logEntry);
        }
        else {
            // Production: JSON format for CloudWatch parsing
            this.outputProduction(logEntry);
        }
    }
    outputDevelopment(logEntry) {
        const { timestamp, level, message, context } = logEntry;
        const time = new Date(timestamp).toLocaleTimeString('de-DE');
        // Color codes for terminal
        const colors = {
            DEBUG: '\x1b[36m', // Cyan
            INFO: '\x1b[32m', // Green
            WARN: '\x1b[33m', // Yellow
            ERROR: '\x1b[31m', // Red
            RESET: '\x1b[0m',
        };
        const color = colors[level];
        const prefix = `${colors.RESET}[${time}] ${color}${level}${colors.RESET}`;
        if (context && Object.keys(context).length > 0) {
            // eslint-disable-next-line no-console
            console.log(`${prefix} ${message}`, context);
        }
        else {
            // eslint-disable-next-line no-console
            console.log(`${prefix} ${message}`);
        }
    }
    outputProduction(logEntry) {
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
    debug(message, context) {
        if (!this.shouldLog(LogLevel.DEBUG))
            return;
        const logEntry = this.formatLogEntry(LogLevel.DEBUG, message, context);
        this.output(logEntry);
    }
    /**
     * Log informational message
     */
    info(message, context) {
        if (!this.shouldLog(LogLevel.INFO))
            return;
        const logEntry = this.formatLogEntry(LogLevel.INFO, message, context);
        this.output(logEntry);
    }
    /**
     * Log warning message
     */
    warn(message, context) {
        if (!this.shouldLog(LogLevel.WARN))
            return;
        const logEntry = this.formatLogEntry(LogLevel.WARN, message, context);
        this.output(logEntry);
    }
    /**
     * Log error message
     */
    error(message, context, error) {
        if (!this.shouldLog(LogLevel.ERROR))
            return;
        const errorContext = { ...context };
        if (error) {
            errorContext.error = error.message;
            errorContext.stack = error.stack;
            // Include additional error properties
            if (error instanceof Error) {
                Object.keys(error).forEach((key) => {
                    if (key !== 'message' && key !== 'stack') {
                        errorContext[key] = error[key];
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
    child(baseContext) {
        return new ChildLogger(this, baseContext);
    }
}
/**
 * Child logger with persistent context
 */
class ChildLogger {
    parent;
    baseContext;
    constructor(parent, baseContext) {
        this.parent = parent;
        this.baseContext = baseContext;
    }
    mergeContext(context) {
        return { ...this.baseContext, ...context };
    }
    debug(message, context) {
        this.parent.debug(message, this.mergeContext(context));
    }
    info(message, context) {
        this.parent.info(message, this.mergeContext(context));
    }
    warn(message, context) {
        this.parent.warn(message, this.mergeContext(context));
    }
    error(message, context, error) {
        this.parent.error(message, this.mergeContext(context), error);
    }
}
// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================
exports.logger = new Logger();
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
