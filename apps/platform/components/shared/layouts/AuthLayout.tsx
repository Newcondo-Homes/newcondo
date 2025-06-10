// apps/platform/app/(auth)/layout.tsx
import { ReactNode } from 'react'
import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: {
    template: '%s | NewCondo',
    default: 'Authentication | NewCondo',
  },
  description: 'Secure authentication for NewCondo platform',
}

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left side - Auth forms */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">NC</span>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              NewCondo
            </h2>
          </div>
          
          {children}
        </div>
      </div>

      {/* Right side - Hero image/content */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800">
          <div className="flex flex-col justify-center h-full px-12 text-white">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold mb-6">
                Find Your Perfect Home
              </h1>
              <p className="text-xl mb-8 text-blue-100">
                Discover amazing properties, connect with trusted agents, and make your next move with confidence.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Verified properties and agents</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-400 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>24/7 customer support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}