// apps/platform/app/(auth)/verify-otp/page.tsx
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { OTPVerification } from '@/components/auth/OTPVerification'
import {LoadingSpinner} from '@/components/shared/feedback/LoadingSpinner'
import type { OTPType } from '@/types/api'

export const metadata: Metadata = {
  title: 'Verify Email | NewCondo',
  description: 'Verify your email address to complete registration',
}

interface VerifyOTPPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function VerifyOTPPage({ searchParams }: VerifyOTPPageProps) {
  const params = await searchParams
  const email = params.email as string
  const type = params.type as OTPType
  
  // Redirect if required params are missing
  if (!email || !type) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Verify your email
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We&apos;ve sent a verification code to{' '}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>
        
        <Suspense fallback={<LoadingSpinner />}>
          <OTPVerification email={email} type={type} />
        </Suspense>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Didn&apos;t receive the code?{' '}
          </p>
        </div>
      </div>
    </div>
  )
}