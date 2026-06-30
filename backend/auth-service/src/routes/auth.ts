import { Router } from 'express'
import type { Router as ExpressRouter } from 'express'
import { authController } from '../controllers/authController'
import { validateRequest } from '../middleware/authValidation'
import { rateLimiter } from "../middleware/rateLimiter"
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validations/authValidation'

const router: ExpressRouter = Router()

// Register
router.post('/register',
  validateRequest(registerSchema),
  authController.register.bind(authController)
)

// Login
router.post('/login',
  validateRequest(loginSchema),
  authController.login.bind(authController)
)

// Forgot password
router.post('/forgot-password',
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword.bind(authController)
)

// Reset password
router.post('/reset-password',
  validateRequest(resetPasswordSchema),
  authController.resetPassword.bind(authController)
)

// Refresh token
router.post('/refresh-token',
  authController.refreshToken.bind(authController)
)

// Does the email exist
router.get(
  '/email-exists',
  rateLimiter(20, 15),
  authController.checkEmailExists.bind(authController)
);

export { router as authRoutes }
