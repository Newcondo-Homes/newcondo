"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VirtualAccountServiceError = void 0;
class VirtualAccountServiceError extends Error {
    constructor(message, code, statusCode, details) {
        super(message);
        this.name = 'VirtualAccountServiceError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.VirtualAccountServiceError = VirtualAccountServiceError;
//# sourceMappingURL=virtualAccount.js.map