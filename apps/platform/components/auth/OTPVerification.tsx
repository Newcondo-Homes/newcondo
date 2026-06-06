// apps/platform/components/auth/OTPVerification.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@newcondo/ui'
import { Input } from '@newcondo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui'
import { Alert, AlertDescription } from '@newcondo/ui'
import { Loader2, Mail, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@newcondo/ui/lib/utils'

interface OTPVerificationProps {
  email: string
  type: 'EMAIL_VERIFICATION' | 'LOGIN' | 'PASSWORD_RESET'
  onSuccess?: () => void
  onBack?: () => void
}

export function OTPVerification({ email, type, onSuccess, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')

  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window !== 'undefined') {
      const storageKey = `otp_expiry_${email}_${type}`
      const storedTarget = localStorage.getItem(storageKey)

      if (storedTarget) {
        const remaining = Math.ceil((parseInt(storedTarget, 10) - Date.now()) / 1000)

        if (remaining > 0) {
          return remaining
        } else {
          // Clear out old, stale, negative historical keys right away!
          localStorage.removeItem(storageKey)
        }
      }
    }
    return 60 // Fresh registration defaults to a clean 60-second timer window!
  })

  const [canResend, setCanResend] = useState(timeLeft <= 0)

  const router = useRouter()
  const { verifyOTP, resendOTP } = useAuth()
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // 2. Persistent Countdown Effect
  useEffect(() => {
    // If there isn't a target time in localStorage yet (e.g., first mount), set one.
    const storageKey = `otp_expiry_${email}_${type}`
    if (!localStorage.getItem(storageKey) && timeLeft > 0) {
      const targetTime = Date.now() + timeLeft * 1000
      localStorage.setItem(storageKey, targetTime.toString())
    }

    if (timeLeft <= 0) {
      setCanResend(true)
      localStorage.removeItem(storageKey) // Clean up storage when done
      return
    }

    setCanResend(false)

    // Using precise interval sync based on system clock
    const timer = setInterval(() => {
      const storedTarget = localStorage.getItem(storageKey)
      if (storedTarget) {
        const remaining = Math.ceil((parseInt(storedTarget, 10) - Date.now()) / 1000)
        if (remaining <= 0) {
          setTimeLeft(0)
          setCanResend(true)
          localStorage.removeItem(storageKey)
          clearInterval(timer)
        } else {
          setTimeLeft(remaining)
        }
      } else {
        // Fallback if localStorage disappeared unexpectedly
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, email, type])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (newOtp.every(digit => digit !== '') && value) {
      handleVerifyOTP(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newOtp = [...otp]

    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)

    if (pastedData.length === 6) {
      handleVerifyOTP(pastedData)
    }
  }

  const handleVerifyOTP = async (otpCode: string) => {
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      const result = await verifyOTP({
        identifier: email,
        code: otpCode,
        type
      })

      if (result.success) {
        // Cleanup storage on successful verification
        localStorage.removeItem(`otp_expiry_${email}_${type}`)

        if (type === 'EMAIL_VERIFICATION') {
          router.push('/dashboard')
        } else if (type === 'PASSWORD_RESET') {
          router.push('/reset-password')
        }
        onSuccess?.()
      } else {
        setError(result.error || 'Invalid verification code')
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error(error)
      setError('Verification failed. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    if (!canResend) return

    setIsResending(true)
    setError('')

    try {
      const result = await resendOTP({
        identifier: email,
        type
      })

      if (result.success) {
        // 3. Establish a brand-new 60-second target timestamp in localStorage on resend
        const newTargetTime = Date.now() + 60 * 1000
        localStorage.setItem(`otp_expiry_${email}_${type}`, newTargetTime.toString())

        setTimeLeft(60)
        setCanResend(false)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setError(result.error || 'Failed to resend code')
      }
    } catch (error) {
      console.error(error)
      setError('Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'EMAIL_VERIFICATION': return 'Verify Your Email'
      case 'LOGIN': return 'Enter Verification Code'
      case 'PASSWORD_RESET': return 'Reset Your Password'
      default: return 'Verify Your Email'
    }
  }

  const getDescription = () => {
    switch (type) {
      case 'EMAIL_VERIFICATION': return 'We sent a 6-digit verification code to your email address.'
      case 'LOGIN': return 'Please enter the 6-digit code sent to your email.'
      case 'PASSWORD_RESET': return 'Enter the 6-digit code to reset your password.'
      default: return 'We sent a 6-digit verification code to your email address.'
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">{getTitle()}</CardTitle>
        <CardDescription className="text-center">
          {getDescription()}
          <br />
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={cn(
                  "w-12 h-12 text-center text-lg font-semibold",
                  digit && "border-primary"
                )}
                disabled={isVerifying}
              />
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {timeLeft > 0 ? (
              <p>Code expires in {formatTime(timeLeft)}</p>
            ) : (
              <p className="text-destructive">Code has expired</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => handleVerifyOTP(otp.join(''))}
            disabled={otp.some(digit => !digit) || isVerifying}
            className="w-full"
          >
            {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Code
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn&apos;t receive the code?
            </p>
            <Button
              variant="ghost"
              onClick={handleResendOTP}
              disabled={!canResend || isResending}
              className="text-primary hover:text-primary/80"
            >
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isResending && <RefreshCw className="mr-2 h-4 w-4" />}
              {canResend ? "Resend Code" : `Resend in ${formatTime(timeLeft)}`}
            </Button>
          </div>

          {onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full"
              disabled={isVerifying}
            >
              Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}