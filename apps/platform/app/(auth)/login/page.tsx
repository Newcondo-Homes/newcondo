// apps/platform/app/(auth)/login/page.tsx
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@newcondo/auth'
// import { getServerSession } from '@newcondo/auth'
// import { authOptions } from '@newcondo/auth'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Sign In | NewCondo',
  description: 'Sign in to your NewCondo account',
}

export default async function LoginPage() {
//   const session = await getServerSession(authOptions)
  const session = await auth();
  
  // Redirect if already authenticated
  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your NewCondo account
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}