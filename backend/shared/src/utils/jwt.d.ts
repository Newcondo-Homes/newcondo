export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}
export interface RefreshTokenPayload {
    userId: string;
    tokenVersion: number;
}
export declare const generateAccessToken: (payload: TokenPayload) => string;
export declare const generateRefreshToken: (payload: RefreshTokenPayload) => string;
export declare const verifyAccessToken: (token: string) => TokenPayload;
export declare const verifyRefreshToken: (token: string) => RefreshTokenPayload;
export declare const generateTokenPair: (user: {
    id: string;
    email: string;
    role: string;
    tokenVersion?: number;
}) => {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=jwt.d.ts.map