import { Router } from 'express'
import type { Router as ExpressRouter } from 'express'
import { authController } from '../controllers/authController'
import { validateRequest } from '../middleware/authValidation'
import { 
  registerSchema, 
  loginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} from '../validations/authValidation'

const router: ExpressRouter = Router()
// const authController = new AuthController()

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

export { router as authRoutes }
