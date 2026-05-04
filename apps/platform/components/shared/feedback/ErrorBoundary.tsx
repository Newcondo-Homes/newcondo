// apps/platform/components/shared/feedback/ErrorBoundary.tsx
'use client'

import React from 'react'
import { Button } from "@newcondo/ui/components/button"
import { Card, CardContent } from "@newcondo/ui/components/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { useRouter } from 'next/navigation'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  retry: () => void
  goHome: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error 
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    
    // Log error to monitoring service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // In production, you might want to log to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent
          error={this.state.error!}
          resetError={this.resetError}
          retry={this.resetError}
          goHome={() => window.location.href = '/'}
        />
      )
    }

    return this.props.children
  }
}

// Default error fallback component
function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  const router = useRouter()

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Something went wrong</h3>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. This has been reported to our team.
              </p>
            </div>

            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="w-full text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Error details (development only)
                </summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                  {error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-2 w-full">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={retry}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => router.push('/')}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific error boundary for property components
export function PropertyErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={PropertyErrorFallback}>
      {children}
    </ErrorBoundary>
  )
}

function PropertyErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <div>
          <h3 className="font-semibold">Failed to load property</h3>
          <p className="text-sm text-muted-foreground mt-1">
            There was an error loading this property. Please try again.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={resetError}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </Card>
  )
}

// Search error boundary
export function SearchErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallback={SearchErrorFallback}>
      {children}
    </ErrorBoundary>
  )
}

function SearchErrorFallback({ resetError }: ErrorFallbackProps) {
  return (
    <div className="text-center py-8">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">Search failed</h3>
      <p className="text-muted-foreground mb-4">
        We encountered an error while searching for properties.
      </p>
      <Button onClick={resetError} variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try searching again
      </Button>
    </div>
  )
}

// Hook for handling async errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    console.error('Async error caught:', error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
}