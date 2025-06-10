'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from '@newcondo/auth/client'
import { Button } from '@newcondo/ui'
import { Input } from '@newcondo/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui'
import { Alert, AlertDescription } from '@newcondo/ui'
import { Mail } from 'lucide-react'

export default function OTPVerification() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return // Prevent multiple characters
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: otpCode,
          type: 'EMAIL_VERIFICATION'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed')
      }

      // Auto sign in after successful verification
      const signInResult = await signIn('credentials', {
        email,
        password: data.tempPassword, // Backend should return temp password or handle auto-login
        redirect: false
      })

      if (signInResult?.error) {
        // If auto-login fails, redirect to login page
        router.push('/login?message=verification-success')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          type: 'EMAIL_VERIFICATION'
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'Failed to resend code')
      }

      setCountdown(60)
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Check your email
          </CardTitle>
          <CardDescription>
            We sent a verification code to<br />
            <span className="font-medium text-foreground">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || otp.join('').length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto font-medium"
                onClick={handleResend}
                disabled={!canResend || isResending}
              >
                {isResending 
                  ? 'Sending...' 
                  : canResend 
                    ? 'Resend code' 
                    : `Resend in ${countdown}s`
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}