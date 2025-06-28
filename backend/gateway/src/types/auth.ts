// backend/gateway/src/types/auth.ts
export enum UserRole {
  USER = 'USER',
  AGENT = 'AGENT',
  PROPERTY_OWNER = 'PROPERTY_OWNER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest {
  user?: User;
}