// apps/platform/components/marking/AgentPerformanceCard.tsx
'use client';

import { Award, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface AgentPerformanceCardProps {
  agentName: string;
  reliabilityScore: number; // 0-5
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  averageCompletionTime?: string; // e.g., "45 mins"
  responseTime?: string; // e.g., "5 mins avg"
  cancellationRate?: number; // 0-100 percentage
  showTrend?: boolean;
  compact?: boolean;
}

export function AgentPerformanceCard({
  agentName,
  reliabilityScore,
  totalMarkingJobs,
  completedMarkingJobs,
  averageCompletionTime = '--',
  responseTime = '--',
  cancellationRate = 0,
  showTrend = false,
  compact = false,
}: AgentPerformanceCardProps) {
  const completionRate = totalMarkingJobs > 0 
    ? Math.round((completedMarkingJobs / totalMarkingJobs) * 100)
    : 0;

  const scoreColor = 
    reliabilityScore >= 4.5 ? 'text-green-600' :
    reliabilityScore >= 3.5 ? 'text-blue-600' :
    reliabilityScore >= 2.5 ? 'text-yellow-600' :
    'text-red-600';

  const scoreBgColor = 
    reliabilityScore >= 4.5 ? 'bg-green-50' :
    reliabilityScore >= 3.5 ? 'bg-blue-50' :
    reliabilityScore >= 2.5 ? 'bg-yellow-50' :
    'bg-red-50';

  if (compact) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-sm text-gray-900">{agentName}</h4>
          <div className="flex items-center gap-1">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className={`text-sm font-bold ${scoreColor}`}>
              {reliabilityScore.toFixed(1)}
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          {completedMarkingJobs}/{totalMarkingJobs} jobs • {completionRate}% completion
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${scoreBgColor} border-gray-200 overflow-hidden`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{agentName}</h3>
            <p className="text-sm text-gray-600">Professional Property Marker</p>
          </div>
          <div className={`flex flex-col items-end gap-1`}>
            <div className="flex items-center gap-1">
              <Award className={`w-5 h-5 ${scoreColor}`} />
              <span className={`text-2xl font-bold ${scoreColor}`}>
                {reliabilityScore.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-gray-600">Reliability Score</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Completion Rate */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Completion Rate</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{completionRate}%</p>
            <p className="text-xs text-gray-500">
              {completedMarkingJobs} of {totalMarkingJobs} jobs
            </p>
          </div>

          {/* Average Time */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Avg Completion</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{averageCompletionTime}</p>
            <p className="text-xs text-gray-500">per marking</p>
          </div>

          {/* Response Time */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-gray-600">Response Time</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{responseTime}</p>
            <p className="text-xs text-gray-500">average</p>
          </div>

          {/* Cancellation Rate */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-600">Cancellation Rate</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{cancellationRate}%</p>
            <p className="text-xs text-gray-500">rare cancellations</p>
          </div>
        </div>

        {/* Score Details */}
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Performance Trend</span>
            {showTrend && (
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold">+0.3 this month</span>
              </div>
            )}
          </div>
          
          {/* Score Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Score breakdown</span>
              <span className={`font-semibold ${scoreColor}`}>
                {reliabilityScore.toFixed(1)}/5.0
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  reliabilityScore >= 4.5 ? 'bg-green-600' :
                  reliabilityScore >= 3.5 ? 'bg-blue-600' :
                  reliabilityScore >= 2.5 ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}
                style={{ width: `${(reliabilityScore / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Recommendation Badge */}
        {reliabilityScore >= 4.5 && (
          <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded text-center">
            <p className="text-xs font-semibold text-green-700">
              ✓ Highly Recommended Agent
            </p>
          </div>
        )}
      </div>
    </div>
  );
}