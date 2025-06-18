import { Router } from 'express'
import { OTPController } from '../controllers/otpController'
import { validateRequest } from '../middleware/authValidation'
import { 
  sendOTPSchema, 
  verifyOTPSchema 
} from '../validations/otpValidation'

const router = Router()
const otpController = new OTPController()

// Send OTP
router.post('/send', 
  validateRequest(sendOTPSchema), 
  otpController.sendOTP.bind(otpController)
)

// Verify OTP
router.post('/verify', 
  validateRequest(verifyOTPSchema), 
  otpController.verifyOTP.bind(otpController)
)

// Resend OTP
router.post('/resend', 
  validateRequest(sendOTPSchema), 
  otpController.resendOTP.bind(otpController)
)

export { router as otpRoutes }