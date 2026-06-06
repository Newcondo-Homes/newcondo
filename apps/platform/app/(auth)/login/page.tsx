// apps/platform/app/(auth)/login/page.tsx
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@newcondo/auth'
import Link from "next/link"
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
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
        <p className="text-gray-600">Sign in to your account to continue</p>
      </div>

      <LoginForm />


      <div className="text-center">
        <Link 
          href="/reset-password" 
          className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
        >
          Forgot your password?
        </Link>
      </div>
    </div>
  )
}