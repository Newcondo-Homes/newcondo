'use client';

import { cn } from '@newcondo/ui/lib/utils';

interface PropertyCardSkeletonProps {
  className?: string;
}

export default function PropertyCardSkeleton({ className }: PropertyCardSkeletonProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200 overflow-hidden",
      className
    )}>
      {/* Image Skeleton */}
      <div className="relative aspect-[4/3] bg-gray-200 animate-pulse" />

      {/* Content Skeleton */}
      <div className="p-3 space-y-3">
        {/* Price Skeleton */}
        <div className="h-6 bg-gray-200 rounded animate-pulse w-2/3" />

        {/* Title Skeleton */}
        <div className="h-5 bg-gray-200 rounded animate-pulse w-full" />

        {/* Location Skeleton */}
        <div className="flex items-center space-x-1">
          <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5" />
        </div>

        {/* Property Details Skeleton */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4" />
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4" />
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-8" />
          </div>
        </div>

        {/* Features Skeleton */}
        <div className="flex flex-wrap gap-1">
          <div className="h-5 bg-gray-200 rounded animate-pulse w-12" />
          <div className="h-5 bg-gray-200 rounded animate-pulse w-16" />
        </div>
      </div>
    </div>
  );
}