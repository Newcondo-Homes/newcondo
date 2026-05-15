// apps/platform/app/(auth)/register/page.tsx
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@newcondo/auth'
import RegisterForm from '@/components/auth/RegisterForm'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Create Account | NewCondo',
  description: 'Create your NewCondo account to get started',
}

export default async function RegisterPage() {
  
  const session = await auth();

  // Redirect if already authenticated
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Join NewCondo and start your property journey
          </p>
        </div>
        
        <RegisterForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}