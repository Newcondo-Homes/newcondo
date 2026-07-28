"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.badGateway = exports.tooMany = exports.unprocessable = exports.gone = exports.conflict = exports.notFound = exports.forbidden = exports.paymentRequired = exports.unauthorized = exports.badRequest = exports.ServiceError = void 0;
// backend/shared/src/utils/httpError.ts
// ============================================================
// Throwable HTTP errors. shared/src/types already exports an *interface*
// named `AppError`, which is why `throw new AppError(...)` failed with
// "TS2693: 'AppError' only refers to a type, but is being used as a value".
// These are real classes with distinct names, so there's no clash.
//
// Export from shared/src/utils/index.ts:  export * from "./httpError";
// Your express error handler can read `err.statusCode` (defaults to 500).
// ============================================================
class ServiceError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.isOperational = true;
        this.name = "ServiceError";
        this.statusCode = statusCode;
        Error.captureStackTrace?.(this, ServiceError);
    }
}
exports.ServiceError = ServiceError;
const badRequest = (m) => new ServiceError(m, 400);
exports.badRequest = badRequest;
const unauthorized = (m = "Not authenticated") => new ServiceError(m, 401);
exports.unauthorized = unauthorized;
const paymentRequired = (m) => new ServiceError(m, 402);
exports.paymentRequired = paymentRequired;
const forbidden = (m = "Not allowed") => new ServiceError(m, 403);
exports.forbidden = forbidden;
const notFound = (m = "Not found") => new ServiceError(m, 404);
exports.notFound = notFound;
const conflict = (m) => new ServiceError(m, 409);
exports.conflict = conflict;
const gone = (m) => new ServiceError(m, 410);
exports.gone = gone;
const unprocessable = (m) => new ServiceError(m, 422);
exports.unprocessable = unprocessable;
const tooMany = (m = "Too many attempts") => new ServiceError(m, 429);
exports.tooMany = tooMany;
const badGateway = (m) => new ServiceError(m, 502);
exports.badGateway = badGateway;
//# sourceMappingURL=httpError.js.map