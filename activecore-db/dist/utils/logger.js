"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDebug = exports.logInfo = exports.logWarn = exports.logError = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
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
const logger = winston_1.default.createLogger({
    levels: customLevels.levels,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), isDevelopment
        ? winston_1.default.format.colorize({ colors: customLevels.colors })
        : winston_1.default.format.uncolorize(), winston_1.default.format.printf((_a) => {
        var { level, message, timestamp, stack } = _a, meta = __rest(_a, ["level", "message", "timestamp", "stack"]);
        // Format metadata
        const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta) : '';
        const stackStr = stack ? `\n${stack}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr ? ` ${metaStr}` : ''}${stackStr}`;
    })),
    defaultMeta: { service: 'activecore-backend' },
    transports: [
        // Always log to console in development
        ...(isDevelopment
            ? [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize({ colors: customLevels.colors }), winston_1.default.format.printf(({ level, message, timestamp, stack }) => `[${timestamp}] ${level}: ${message}${stack ? '\n' + stack : ''}`)),
                }),
            ]
            : []),
        // Log errors to file in production
        ...(isProduction
            ? [
                new winston_1.default.transports.File({
                    filename: path_1.default.join('logs', 'error.log'),
                    level: 'error',
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                new winston_1.default.transports.File({
                    filename: path_1.default.join('logs', 'combined.log'),
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
            ]
            : [
                // Development: file logging
                new winston_1.default.transports.File({
                    filename: path_1.default.join('logs', 'debug.log'),
                    maxsize: 5242880, // 5MB
                    maxFiles: 3,
                }),
            ]),
    ],
});
// Create directory if it doesn't exist
const logsDir = path_1.default.join(process.cwd(), 'logs');
const fs = require('fs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}
exports.default = logger;
/**
 * Helper function to log errors with context
 * Usage: logError('Operation failed', error, { userId: 123 })
 */
const logError = (message, error, context) => {
    logger.error(message, Object.assign({ error: (error === null || error === void 0 ? void 0 : error.message) || String(error), stack: error === null || error === void 0 ? void 0 : error.stack }, context));
};
exports.logError = logError;
/**
 * Helper function to log warnings
 * Usage: logWarn('Unusual condition detected', { threshold: 5, actual: 10 })
 */
const logWarn = (message, context) => {
    logger.warn(message, context);
};
exports.logWarn = logWarn;
/**
 * Helper function to log info
 * Usage: logInfo('Payment received', { orderId: 'ORDER123' })
 */
const logInfo = (message, context) => {
    logger.info(message, context);
};
exports.logInfo = logInfo;
/**
 * Helper function to log debug info
 * Usage: logDebug('Processing user', { userId: 123, action: 'update' })
 */
const logDebug = (message, context) => {
    logger.debug(message, context);
};
exports.logDebug = logDebug;
