// backend/shared/src/utils/jwt.ts
import * as jwt from "jsonwebtoken";
import { StringValue } from "ms";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET! as StringValue, {
    expiresIn: (process.env.JWT_EXPIRES_IN as StringValue) || "15m",
    issuer: "newcondo-auth",
    audience: "newcondo-platform",
  });
};

export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET! as StringValue, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN as StringValue) || "7d",
    issuer: "newcondo-auth",
    audience: "newcondo-platform",
  });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!, {
    issuer: "newcondo-auth",
    audience: "newcondo-platform",
  }) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
    issuer: "newcondo-auth",
    audience: "newcondo-platform",
  }) as RefreshTokenPayload;
};

export const generateTokenPair = (user: {
  id: string;
  email: string;
  role: string;
  tokenVersion?: number;
}) => {
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    tokenVersion: user.tokenVersion || 0,
  });

  return { accessToken, refreshToken };
};
