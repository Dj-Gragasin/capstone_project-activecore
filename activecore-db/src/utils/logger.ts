import winston from 'winston';
import path from 'path';

// Define custom log levels
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    fatal: 'red',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'gray',
  },
};

// Determine environment
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Create logger instance
const logger = winston.createLogger({
  levels: customLevels.levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    isDevelopment
      ? winston.format.colorize({ colors: customLevels.colors })
      : winston.format.uncolorize(),
    winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
      // Format metadata
      const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
      const stackStr = stack ? `\n${stack}` : '';
      return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr ? ` ${metaStr}` : ''}${stackStr}`;
    })
  ),
  defaultMeta: { service: 'activecore-backend' },
  transports: [
    // Always log to console in development
    ...(isDevelopment
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize({ colors: customLevels.colors }),
              winston.format.printf(
                ({ level, message, timestamp, stack }) =>
                  `[${timestamp}] ${level}: ${message}${stack ? '\n' + stack : ''}`
              )
            ),
          }),
        ]
      : []),

    // Log errors to file in production
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: path.join('logs', 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join('logs', 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : [
          // Development: file logging
          new winston.transports.File({
            filename: path.join('logs', 'debug.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3,
          }),
        ]),
  ],
});

// Create directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;

/**
 * Helper function to log errors with context
 * Usage: logError('Operation failed', error, { userId: 123 })
 */
export const logError = (message: string, error: any, context?: Record<string, any>) => {
  logger.error(message, {
    error: error?.message || String(error),
    stack: error?.stack,
    ...context,
  });
};

/**
 * Helper function to log warnings
 * Usage: logWarn('Unusual condition detected', { threshold: 5, actual: 10 })
 */
export const logWarn = (message: string, context?: Record<string, any>) => {
  logger.warn(message, context);
};

/**
 * Helper function to log info
 * Usage: logInfo('Payment received', { orderId: 'ORDER123' })
 */
export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info(message, context);
};

/**
 * Helper function to log debug info
 * Usage: logDebug('Processing user', { userId: 123, action: 'update' })
 */
export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug(message, context);
};
