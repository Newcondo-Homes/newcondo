// apps/platform/components/shared/feedback/LoadingSpinner.tsx
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
  variant?: 'primary' | 'secondary' | 'muted'
}

const sizeVariants = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
}

const colorVariants = {
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  muted: 'text-muted-foreground'
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text,
  variant = 'primary'
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 
        className={cn(
          "animate-spin",
          sizeVariants[size],
          colorVariants[variant]
        )} 
      />
      {text && (
        <p className={cn(
          "text-sm font-medium",
          colorVariants[variant]
        )}>
          {text}
        </p>
      )}
    </div>
  )
}

// Skeleton components for property cards and other UI elements
export function PropertyCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-[4/3] bg-muted rounded-md" />
      
      {/* Content skeleton */}
      <div className="space-y-2">
        {/* Title */}
        <div className="h-4 bg-muted rounded w-3/4" />
        {/* Location */}
        <div className="h-3 bg-muted rounded w-1/2" />
        {/* Price */}
        <div className="h-4 bg-muted rounded w-1/3" />
        {/* Features */}
        <div className="flex gap-2">
          <div className="h-3 bg-muted rounded w-12" />
          <div className="h-3 bg-muted rounded w-12" />
          <div className="h-3 bg-muted rounded w-12" />
        </div>
      </div>
    </div>
  )
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <PropertyCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function SearchBoxSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="h-12 bg-muted rounded-md" />
        <div className="h-12 bg-muted rounded-md" />
        <div className="h-12 bg-muted rounded-md" />
        <div className="h-12 bg-muted rounded-md" />
      </div>
    </div>
  )
}

// Page level skeleton loaders
export function LandingPageSkeleton() {
  return (
    <div className="min-h-screen">
      {/* Hero section skeleton */}
      <div className="bg-muted h-96 mb-8 animate-pulse" />
      
      {/* Search box skeleton */}
      <div className="container mx-auto px-4 mb-8">
        <SearchBoxSkeleton />
      </div>

      {/* Properties grid skeleton */}
      <div className="container mx-auto px-4">
        <div className="space-y-8">
          {/* 8 rows for desktop */}
          {Array.from({ length: 8 }).map((_, i) => (
            <PropertyGridSkeleton key={i} count={6} />
          ))}
        </div>
      </div>
    </div>
  )
}