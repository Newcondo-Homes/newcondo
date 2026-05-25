"use strict";
// backend/shared/src/index.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILD_TIME = exports.SHARED_VERSION = exports.flutterwaveConfig = exports.redis = exports.auth = exports.authenticateToken = exports.validateRequest = exports.logger = exports.ForbiddenError = exports.NotFoundError = exports.BadRequestError = exports.corsMiddleware = exports.requestLogger = exports.authMiddleware = exports.errorHandler = void 0;
// Middleware exports
//TODO: see what you need from middleware that can be shared all accross and import from here
var index_1 = require("./middleware/index");
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return index_1.errorHandler; } });
Object.defineProperty(exports, "authMiddleware", { enumerable: true, get: function () { return index_1.authMiddleware; } });
Object.defineProperty(exports, "requestLogger", { enumerable: true, get: function () { return index_1.requestLogger; } });
Object.defineProperty(exports, "corsMiddleware", { enumerable: true, get: function () { return index_1.corsMiddleware; } });
Object.defineProperty(exports, "BadRequestError", { enumerable: true, get: function () { return index_1.BadRequestError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return index_1.NotFoundError; } });
Object.defineProperty(exports, "ForbiddenError", { enumerable: true, get: function () { return index_1.ForbiddenError; } });
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return index_1.logger; } });
Object.defineProperty(exports, "validateRequest", { enumerable: true, get: function () { return index_1.validateRequest; } });
Object.defineProperty(exports, "authenticateToken", { enumerable: true, get: function () { return index_1.authenticateToken; } });
Object.defineProperty(exports, "auth", { enumerable: true, get: function () { return index_1.auth; } });
// Config exports
var index_2 = require("./config/index");
//   connectRedis, 
//   disconnectRedis, 
//   getRedisClient,
//   initializeMapsAPI,
//   geocodeAddress,
//   reverseGeocode,
Object.defineProperty(exports, "redis", { enumerable: true, get: function () { return index_2.redis; } });
Object.defineProperty(exports, "flutterwaveConfig", { enumerable: true, get: function () { return index_2.flutterwaveConfig; } });
// Constants exports
__exportStar(require("./constants/index"), exports);
// Utils exports
__exportStar(require("./utils/index"), exports);
// i18n exports
__exportStar(require("./i18n/index"), exports);
// Version info
exports.SHARED_VERSION = '1.0.0';
exports.BUILD_TIME = new Date().toISOString();
//# sourceMappingURL=index.js.map