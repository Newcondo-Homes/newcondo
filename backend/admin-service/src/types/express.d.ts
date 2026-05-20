import { Role } from '@newcondo/db'

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: Role
        name?: string | null
        emailVerified?: boolean
        phoneVerified?: boolean
        verificationStatus?: string
        iat?: number
        exp?: number
      }
    }
  }
}

// Export empty object to make this a module
export {}