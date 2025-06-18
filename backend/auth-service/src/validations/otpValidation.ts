import { z } from 'zod'

export const sendOTPSchema = z.object({
  body: z.object({
    identifier: z.string().email('Invalid email format'),
    type: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']),
  })
})

export const verifyOTPSchema = z.object({
  body: z.object({
    identifier: z.string().email('Invalid email format'),
    code: z.string().length(6, 'OTP must be 6 digits'),
    type: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']),
  })
})