"use client";
// apps/platform/hooks/useAuth.ts
import { useState, useCallback } from 'react'
import { useSession, signIn, signOut } from '@newcondo/auth/client'
import { useRouter } from 'next/navigation'
//TODO: you may delete authStore
import { useAuthStore } from '@/store/authStore'
import { authApi } from '@/lib/api/auth'
import type { 
  RegisterData, 
  LoginData, 
  OTPVerificationData, 
  OTPResendData,
  AuthResponse,
  User
} from '@/types/api'

export function useAuth() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { setUser, clearUser, setLoading } = useAuthStore()
  
  const [isLoading, setIsLoading] = useState(false)

  // Register new user
  const register = useCallback(async (data: RegisterData): Promise<AuthResponse> => {
    setIsLoading(true)
    setLoading(true)
    
    try {
      const response = await authApi.register(data)
      
      if (response.success && response.user) {
        setUser(response.user)
        
        // If email verification is required, don't sign in yet
        if (response.requiresVerification) {
          return {
            success: true,
            message: 'Registration successful. Please verify your email.',
            requiresVerification: true,
            user: response.user
          }
        }
        
        // Auto sign in after successful registration
        const signInResult = await signIn('credentials', {
          email: data.email,
          password: data.password,
          redirect: false
        })
        
        if (signInResult?.ok) {
          router.push('/dashboard')
          return {
            success: true,
            message: 'Registration successful!',
            user: response.user
          }
        }
      }
      
      return response
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: 'Registration failed. Please try again.'
      }
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }, [setUser, setLoading, router])

  // Login user
  const login = useCallback(async (data: LoginData): Promise<AuthResponse> => {
    setIsLoading(true)
    setLoading(true)
    
    try {
      // First, validate credentials with our backend
      const response = await authApi.login(data)
      
      if (!response.success) {
        return response
      }
      
      // If OTP is required for login
      if (response.requiresOTP) {
        return {
          success: true,
          requiresOTP: true,
          message: 'Please check your email for the verification code.'
        }
      }
      
      // Use NextAuth for session management
      const signInResult = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false
      })
      
      if (signInResult?.ok) {
        // Update session to get latest user data
        await update()
        
        if (response.user) {
          setUser(response.user)
        }
        
        router.push('/dashboard')
        return {
          success: true,
          message: 'Login successful!',
          user: response.user
        }
      } else {
        return {
          success: false,
          error: signInResult?.error || 'Login failed'
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Login failed. Please try again.'
      }
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }, [setUser, setLoading, router, update])

  // Logout user
  const logout = useCallback(async () => {
    setIsLoading(true)
    setLoading(true)
    
    try {
      clearUser()
      await signOut({ redirect: false })
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }, [clearUser, setLoading, router])

  // Verify OTP
  const verifyOTP = useCallback(async (data: OTPVerificationData): Promise<AuthResponse> => {
    setIsLoading(true)
    
    try {
      const response = await authApi.verifyOTP(data)
      
      if (response.success) {
        // If this is email verification, update user status
        if (data.type === 'EMAIL_VERIFICATION' && response.user) {
          setUser(response.user)
          await update() // Update NextAuth session
        }
        
        // If this is login OTP, sign them in
        if (data.type === 'LOGIN') {
          const signInResult = await signIn('credentials', {
            email: data.identifier,
            otpCode: data.code,
            redirect: false
          })
          
          if (signInResult?.ok) {
            await update()
            if (response.user) {
              setUser(response.user)
            }
          }
        }
      }
      
      return response
    } catch (error) {
      console.error('OTP verification error:', error)
      return {
        success: false,
        error: 'Verification failed. Please try again.'
      }
    } finally {
      setIsLoading(false)
    }
  }, [setUser, update])

  // Resend OTP
  const resendOTP = useCallback(async (data: OTPResendData): Promise<AuthResponse> => {
    setIsLoading(true)
    
    try {
      const response = await authApi.resendOTP(data)
      return response
    } catch (error) {
      console.error('Resend OTP error:', error)
      return {
        success: false,
        error: 'Failed to resend code. Please try again.'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Request password reset
  const requestPasswordReset = useCallback(async (email: string): Promise<AuthResponse> => {
    setIsLoading(true)
    
    try {
      const response = await authApi.requestPasswordReset(email)
      return response
    } catch (error) {
      console.error('Password reset request error:', error)
      return {
        success: false,
        error: 'Failed to send password reset email. Please try again.'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Reset password with token
  const resetPassword = useCallback(async (token: string, newPassword: string, confirmPassword: string): Promise<AuthResponse> => {
    setIsLoading(true)
    
    try {
      const response = await authApi.resetPassword(token, newPassword, confirmPassword)
      return response
    } catch (error) {
      console.error('Password reset error:', error)
      return {
        success: false,
        error: 'Failed to reset password. Please try again.'
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update user profile
  const updateProfile = useCallback(async (data: Partial<User>): Promise<AuthResponse> => {
    setIsLoading(true)
    
    try {
      const response = await authApi.updateProfile(data)
      
      if (response.success && response.user) {
        setUser(response.user)
        await update() // Update NextAuth session
      }
      
      return response
    } catch (error) {
      console.error('Profile update error:', error)
      return {
        success: false,
        error: 'Failed to update profile. Please try again.'
      }
    } finally {
      setIsLoading(false)
    }
  }, [setUser, update])

  return {
    // State
    user: session?.user as User | null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading' || isLoading,
    session,
    
    // Methods
    register,
    login,
    logout,
    verifyOTP,
    resendOTP,
    requestPasswordReset,
    resetPassword,
    updateProfile
  }
}

// Individual hooks for mutation-like behavior
export function useRegister() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<{ message: string } | null>(null)
  const [data, setData] = useState<AuthResponse | null>(null)
  
  const { register: registerFn } = useAuth()
  
  const mutate = useCallback(async (registerData: RegisterData,
    options?: {
      onSuccess?: (data: AuthResponse) => void
      onError?: (error: { message: string }) => void
    }
  ) => {
    setIsPending(true)
    setError(null)
    setData(null)
    
    try {
      const response = await registerFn(registerData)
      setData(response)
      
      if (!response.success) {
        const errorObj = { message: response.error || 'Registration failed' }
        setError( errorObj)
        options?.onError?.(errorObj)
      } else {
        options?.onSuccess?.(response)
      }
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed'
      const errorObj = { message: errorMessage }
      setError( errorObj)
      options?.onError?.(errorObj)
      throw err
    } finally {
      setIsPending(false)
    }
  }, [registerFn])
  
  return {
    mutate,
    isPending,
    error,
    data,
    isError: !!error,
    isSuccess: !!data?.success
  }
}

export function useLogin() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<{ message: string } | null>(null)
  const [data, setData] = useState<AuthResponse | null>(null)
  
  const { login: loginFn } = useAuth()
  
  const mutate = useCallback(async (loginData: LoginData) => {
    setIsPending(true)
    setError(null)
    setData(null)
    
    try {
      const response = await loginFn(loginData)
      setData(response)
      
      if (!response.success) {
        setError({ message: response.error || 'Login failed' })
      }
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed'
      setError({ message: errorMessage })
      throw err
    } finally {
      setIsPending(false)
    }
  }, [loginFn])
  
  return {
    mutate,
    isPending,
    error,
    data,
    isError: !!error,
    isSuccess: !!data?.success
  }
}

export function useVerifyOTP() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<{ message: string } | null>(null)
  const [data, setData] = useState<AuthResponse | null>(null)
  
  const { verifyOTP: verifyOTPFn } = useAuth()
  
  const mutate = useCallback(async (otpData: OTPVerificationData) => {
    setIsPending(true)
    setError(null)
    setData(null)
    
    try {
      const response = await verifyOTPFn(otpData)
      setData(response)
      
      if (!response.success) {
        setError({ message: response.error || 'Verification failed' })
      }
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed'
      setError({ message: errorMessage })
      throw err
    } finally {
      setIsPending(false)
    }
  }, [verifyOTPFn])
  
  return {
    mutate,
    isPending,
    error,
    data,
    isError: !!error,
    isSuccess: !!data?.success
  }
}

export function useResendOTP() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<{ message: string } | null>(null)
  const [data, setData] = useState<AuthResponse | null>(null)
  
  const { resendOTP: resendOTPFn } = useAuth()
  
  const mutate = useCallback(async (resendData: OTPResendData) => {
    setIsPending(true)
    setError(null)
    setData(null)
    
    try {
      const response = await resendOTPFn(resendData)
      setData(response)
      
      if (!response.success) {
        setError({ message: response.error || 'Failed to resend code' })
      }
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code'
      setError({ message: errorMessage })
      throw err
    } finally {
      setIsPending(false)
    }
  }, [resendOTPFn])
  
  return {
    mutate,
    isPending,
    error,
    data,
    isError: !!error,
    isSuccess: !!data?.success
  }
}

export function usePasswordReset() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<{ message: string } | null>(null)
  const [data, setData] = useState<AuthResponse | null>(null)
  
  const { requestPasswordReset, resetPassword } = useAuth()
  
  const requestReset = useCallback(async (email: string) => {
    setIsPending(true)
    setError(null)
    setData(null)
    
    try {
      const response = await requestPasswordReset(email)
      setData(response)
      
      if (!response.success) {
        setError({ message: response.error || 'Failed to send reset email' })
      }
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email'
      setError({ message: errorMessage })
      throw err
    } finally {
      setIsPending(false)
    }
  }, [requestPasswordReset])
  
  const confirmReset = useCallback(async (token: string, newPassword: string, confirmPassword: string) => {
    setIsPending(true)
    setError(null)
    setData(null)
    
    try {
      const response = await resetPassword(token, newPassword, confirmPassword)
      setData(response)
      
      if (!response.success) {
        setError({ message: response.error || 'Failed to reset password' })
      }
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password'
      setError({ message: errorMessage })
      throw err
    } finally {
      setIsPending(false)
    }
  }, [resetPassword])
  
  return {
    requestReset,
    confirmReset,
    isPending,
    error,
    data,
    isError: !!error,
    isSuccess: !!data?.success
  }
}