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
export class ServiceError extends Error {
  readonly statusCode: number;
  readonly isOperational = true;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "ServiceError";
    this.statusCode = statusCode;
    Error.captureStackTrace?.(this, ServiceError);
  }
}

export const badRequest = (m: string) => new ServiceError(m, 400);
export const unauthorized = (m = "Not authenticated") => new ServiceError(m, 401);
export const paymentRequired = (m: string) => new ServiceError(m, 402);
export const forbidden = (m = "Not allowed") => new ServiceError(m, 403);
export const notFound = (m = "Not found") => new ServiceError(m, 404);
export const conflict = (m: string) => new ServiceError(m, 409);
export const gone = (m: string) => new ServiceError(m, 410);
export const unprocessable = (m: string) => new ServiceError(m, 422);
export const tooMany = (m = "Too many attempts") => new ServiceError(m, 429);
export const badGateway = (m: string) => new ServiceError(m, 502);
