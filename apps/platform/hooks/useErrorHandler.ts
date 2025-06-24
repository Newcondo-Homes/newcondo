"use client"
// apps/platform/hooks/useErrorHandler.ts
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@newcondo/auth/client'

interface ErrorState {
  message: string
  code?: string
  statusCode?: number
}

interface UseErrorHandlerReturn {
  error: ErrorState | null
  isError: boolean
  setError: (error: ErrorState | null) => void
  clearError: () => void
  handleError: (error: unknown) => void
  handleAuthError: (error: unknown) => void
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<ErrorState | null>(null)
  const router = useRouter()

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const handleError = useCallback((error: unknown) => {
    console.error('Error caught by handler:', error)

    if (error instanceof Error) {
      setError({
        message: error.message,
        code: (error as any).code,
        statusCode: (error as any).statusCode
      })
    } else if (typeof error === 'string') {
      setError({
        message: error
      })
    } else if (typeof error === 'object' && error !== null) {
      const errorObj = error as any
      setError({
        message: errorObj.message || 'An unexpected error occurred',
        code: errorObj.code,
        statusCode: errorObj.statusCode
      })
    } else {
      setError({
        message: 'An unexpected error occurred'
      })
    }
  }, [])

  const handleAuthError = useCallback(async (error: unknown) => {
    console.error('Auth error caught by handler:', error)

    const errorObj = error as any
    const statusCode = errorObj?.statusCode || errorObj?.status

    // Handle specific auth errors
    if (statusCode === 401 || statusCode === 403) {
      // Unauthorized or forbidden - sign out and redirect to login
      await signOut({ callbackUrl: '/login' })
      return
    }

    if (statusCode === 423) {
      // Account locked
      setError({
        message: 'Your account has been temporarily locked due to multiple failed login attempts. Please try again later or contact support.',
        code: 'ACCOUNT_LOCKED',
        statusCode: 423
      })
      return
    }

    if (statusCode === 429) {
      // Rate limited
      setError({
        message: 'Too many requests. Please wait a moment before trying again.',
        code: 'RATE_LIMITED',
        statusCode: 429
      })
      return
    }

    // Handle other auth errors
    handleError(error)
  }, [handleError])

  return {
    error,
    isError: error !== null,
    setError,
    clearError,
    handleError,
    handleAuthError
  }
}