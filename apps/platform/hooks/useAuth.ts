// apps/platform/hooks/useAuth.ts
import { useState, useCallback } from 'react'
import { useSession, signIn, signOut } from '@newcondo/auth/client'
import { useRouter } from 'next/navigation'
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
  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<AuthResponse> => {
    setIsLoading(true)
    
    try {
      const response = await authApi.resetPassword(token, newPassword)
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