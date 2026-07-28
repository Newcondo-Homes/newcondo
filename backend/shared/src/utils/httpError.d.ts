export declare class ServiceError extends Error {
    readonly statusCode: number;
    readonly isOperational = true;
    constructor(message: string, statusCode?: number);
}
export declare const badRequest: (m: string) => ServiceError;
export declare const unauthorized: (m?: string) => ServiceError;
export declare const paymentRequired: (m: string) => ServiceError;
export declare const forbidden: (m?: string) => ServiceError;
export declare const notFound: (m?: string) => ServiceError;
export declare const conflict: (m: string) => ServiceError;
export declare const gone: (m: string) => ServiceError;
export declare const unprocessable: (m: string) => ServiceError;
export declare const tooMany: (m?: string) => ServiceError;
export declare const badGateway: (m: string) => ServiceError;
//# sourceMappingURL=httpError.d.ts.map