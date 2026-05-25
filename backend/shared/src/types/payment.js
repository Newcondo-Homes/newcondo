"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlutterwaveError = void 0;
class FlutterwaveError extends Error {
    constructor(payload) {
        super(payload.message);
        this.name = 'FlutterwaveError';
        this.error = payload.error;
        this.code = payload.code;
        this.data = payload.data;
    }
}
exports.FlutterwaveError = FlutterwaveError;
//# sourceMappingURL=payment.js.map