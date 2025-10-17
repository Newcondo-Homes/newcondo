// apps/platform/components/marking/ReliabilityScoreBadge.tsx
'use client'

import React from 'react'
import { Star, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ReliabilityScoreBadgeProps {
  score: number // 0 to 5
  totalJobs: number
  completedJobs: number
  cancelledJobs?: number
  acceptanceRate?: number // percentage
  onTimeRate?: number // percentage
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  className?: string
}

export default function ReliabilityScoreBadge({
  score,
  totalJobs,
  completedJobs,
  cancelledJobs = 0,
  acceptanceRate = 100,
  onTimeRate = 100,
  size = 'md',
  showDetails = true,
  className = '',
}: ReliabilityScoreBadgeProps) {
  const getScoreColor = (s: number): string => {
    if (s >= 4.5) return '#10b981' // Excellent - green
    if (s >= 4.0) return '#3b82f6' // Very Good - blue
    if (s >= 3.5) return '#f59e0b' // Good - amber
    if (s >= 3.0) return '#f97316' // Fair - orange
    return '#ef4444' // Poor - red
  }

  const getScoreLabel = (s: number): string => {
    if (s >= 4.5) return 'Excellent'
    if (s >= 4.0) return 'Very Good'
    if (s >= 3.5) return 'Good'
    if (s >= 3.0) return 'Fair'
    return 'Needs Improvement'
  }

  const getScoreBgClass = (s: number): string => {
    if (s >= 4.5) return 'bg-emerald-50 border-emerald-200'
    if (s >= 4.0) return 'bg-blue-50 border-blue-200'
    if (s >= 3.5) return 'bg-amber-50 border-amber-200'
    if (s >= 3.0) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }

  const getScoreTextClass = (s: number): string => {
    if (s >= 4.5) return 'text-emerald-700'
    if (s >= 4.0) return 'text-blue-700'
    if (s >= 3.5) return 'text-amber-700'
    if (s >= 3.0) return 'text-orange-700'
    return 'text-red-700'
  }

  const completionRate = totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0
  const cancellationRate = totalJobs > 0 ? Math.round((cancelledJobs / totalJobs) * 100) : 0

  const sizeClasses = {
    sm: 'h-6 text-xs',
    md: 'h-8 text-sm',
    lg: 'h-10 text-base',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const mainContent = (
    <div
      className={`${sizeClasses[size]} ${getScoreBgClass(score)} border rounded-full px-3 flex items-center gap-2 inline-flex ${className}`}
    >
      <Star
        className={`${iconSizes[size]} fill-current`}
        style={{ color: getScoreColor(score) }}
      />
      <span className={`font-semibold ${getScoreTextClass(score)}`}>{score.toFixed(1)}</span>
      <span className={`hidden sm:inline ${getScoreTextClass(score)}`}>{getScoreLabel(score)}</span>
    </div>
  )

  if (!showDetails) {
    return mainContent
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{mainContent}</TooltipTrigger>
        <TooltipContent className="w-64 p-4" side="right">
          <div className="space-y-3">
            <div className="border-b pb-2">
              <p className="font-semibold text-sm text-slate-900">Performance Metrics</p>
              <p className={`text-xs ${getScoreTextClass(score)} font-medium`}>
                {getScoreLabel(score)} Performance
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-100 rounded p-2">
                <p className="text-slate-600 font-medium">Total Jobs</p>
                <p className="text-lg font-bold text-slate-900">{totalJobs}</p>
              </div>
              <div className="bg-green-100 rounded p-2">
                <p className="text-green-700 font-medium">Completed</p>
                <p className="text-lg font-bold text-green-900">{completedJobs}</p>
              </div>
              <div className="bg-blue-100 rounded p-2">
                <p className="text-blue-700 font-medium">Completion Rate</p>
                <p className="text-lg font-bold text-blue-900">{completionRate}%</p>
              </div>
              {cancelledJobs > 0 && (
                <div className="bg-red-100 rounded p-2">
                  <p className="text-red-700 font-medium">Cancelled</p>
                  <p className="text-lg font-bold text-red-900">{cancellationRate}%</p>
                </div>
              )}
            </div>

            <div className="border-t pt-2 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Acceptance Rate
                </span>
                <span className="font-semibold text-slate-900">{acceptanceRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> On-time Rate
                </span>
                <span className="font-semibold text-slate-900">{onTimeRate}%</span>
              </div>
            </div>

            {score < 3.5 && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2 flex gap-2">
                <AlertCircle className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Improve your completion rate to boost your score
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}