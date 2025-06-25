// apps/platform/app/(auth)/auth/callback/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {  getSession } from '@newcondo/auth/client'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'
import { Alert, AlertDescription } from '@newcondo/ui'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    handleAuthCallback()
  })

  const handleAuthCallback = async () => {
    try {
      const error = searchParams.get('error')
      
      if (error) {
        setError(getErrorMessage(error))
        setStatus('error')
        return
      }

      // Wait for session to be established
      const session = await getSession()
      
      if (session?.user) {
        setStatus('success')
        
        // Redirect based on user role or return URL
        const returnUrl = searchParams.get('callbackUrl') || '/dashboard'
        
        setTimeout(() => {
          router.push(returnUrl)
        }, 2000)
      } else {
        throw new Error('Session not established')
      }
    } catch (err) {
      console.error('Auth callback error:', err)
      setError('Authentication failed. Please try again.')
      setStatus('error')
    }
  }

  const getErrorMessage = (error: string): string => {
    switch (error) {
      case 'OAuthSignin':
        return 'Error occurred during sign in process'
      case 'OAuthCallback':
        return 'Error occurred during callback'
      case 'OAuthCreateAccount':
        return 'Could not create account'
      case 'EmailCreateAccount':
        return 'Could not create account with email'
      case 'Callback':
        return 'Error in callback handler'
      case 'OAuthAccountNotLinked':
        return 'Account already exists with different provider'
      case 'EmailSignin':
        return 'Check your email for sign in link'
      case 'CredentialsSignin':
        return 'Invalid credentials provided'
      case 'SessionRequired':
        return 'Please sign in to access this page'
      default:
        return 'An unexpected error occurred'
    }
  }

  const handleRetry = () => {
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <LoadingSpinner size="lg" />
              <h2 className="mt-6 text-xl font-semibold text-gray-900">
                Processing authentication...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Please wait while we complete your sign in
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Authentication successful!
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Redirecting you to your dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Authentication failed
              </h2>
              <Alert className="mt-4">
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
              <button
                onClick={handleRetry}
                className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}