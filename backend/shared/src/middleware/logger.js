"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = exports.logger = void 0;
/**
 * Simple request logging middleware.
 * Logs incoming request details to the console.
 */
const logger = (req, res, next) => {
    const start = process.hrtime(); // High-resolution time for precise timing
    res.on('finish', () => {
        const end = process.hrtime(start);
        const duration = (end[0] * 1000 + end[1] / 1000000).toFixed(2); // Convert to milliseconds
        console.info(`[REQUEST] ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    });
    next();
};
exports.logger = logger;
exports.requestLogger = null;
//# sourceMappingURL=logger.js.map