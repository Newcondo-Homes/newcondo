'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Building,
  Calendar
} from 'lucide-react'

interface MetricData {
  current: number
  previous: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

interface ComplianceMetricsData {
  totalDocuments: MetricData
  complianceRate: MetricData
  pendingReview: MetricData
  expiringSoon: MetricData
  criticalIssues: MetricData
  averageReviewTime: MetricData
  documentTypes: {
    [key: string]: {
      total: number
      approved: number
      pending: number
      rejected: number
      rate: number
    }
  }
  userCompliance: {
    owners: number
    agents: number
    renters: number
  }
  regionCompliance: {
    [region: string]: number
  }
}

interface ComplianceMetricsProps {
  period?: '7d' | '30d' | '90d' | '1y'
  userType?: 'ALL' | 'OWNER' | 'AGENT' | 'RENTER'
  onPeriodChange?: (period: string) => void
  onUserTypeChange?: (userType: string) => void
}

const ComplianceMetrics: React.FC<ComplianceMetricsProps> = ({
  period = '30d',
  userType = 'ALL',
  onPeriodChange,
  onUserTypeChange
}) => {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<ComplianceMetricsData | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<string>('overview')

  useEffect(() => {
    fetchMetrics()
  }, [period, userType])

  const fetchMetrics = async () => {
    setLoading(true)
    try {
      // Mock data - replace with actual API call
      const mockMetrics: ComplianceMetricsData = {
        totalDocuments: {
          current: 1250,
          previous: 1180,
          change: 5.9,
          trend: 'up'
        },
        complianceRate: {
          current: 85.2,
          previous: 82.1,
          change: 3.8,
          trend: 'up'
        },
        pendingReview: {
          current: 89,
          previous: 95,
          change: -6.3,
          trend: 'down'
        },
        expiringSoon: {
          current: 23,
          previous: 18,
          change: 27.8,
          trend: 'up'
        },
        criticalIssues: {
          current: 12,
          previous: 15,
          change: -20.0,
          trend: 'down'
        },
        averageReviewTime: {
          current: 2.5,
          previous: 3.2,
          change: -21.9,
          trend: 'down'
        },
        documentTypes: {
          'OWNERSHIP_DOCUMENT': {
            total: 456,
            approved: 398,
            pending: 42,
            rejected: 16,
            rate: 87.3
          },
          'CONSENT_DOCUMENT': {
            total: 234,
            approved: 198,
            pending: 28,
            rejected: 8,
            rate: 84.6
          },
          'UNDERTAKING_DOCUMENT': {
            total: 189,
            approved: 165,
            pending: 19,
            rejected: 5,
            rate: 87.3
          },
          'NIN': {
            total: 371,
            approved: 325,
            pending: 35,
            rejected: 11,
            rate: 87.6
          }
        },
        userCompliance: {
          owners: 88.5,
          agents: 82.1,
          renters: 79.8
        },
        regionCompliance: {
          'Lagos': 87.2,
          'Abuja': 85.1,
          'Port Harcourt': 83.5,
          'Kano': 81.2,
          'Ibadan': 80.8
        }
      }

      setMetrics(mockMetrics)
    } catch (error) {
      console.error('Failed to fetch compliance metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <div className="h-4 w-4" />
    }
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable', isPositive: boolean = true) => {
    if (trend === 'stable') return 'text-gray-600'
    
    const isGood = isPositive ? trend === 'up' : trend === 'down'
    return isGood ? 'text-green-600' : 'text-red-600'
  }

  const MetricCard: React.FC<{
    title: string
    icon: React.ReactNode
    metric: MetricData
    suffix?: string
    isPositiveTrend?: boolean
  }> = ({ title, icon, metric, suffix = '', isPositiveTrend = true }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {metric.current.toLocaleString()}{suffix}
        </div>
        <div className="flex items-center mt-1">
          {getTrendIcon(metric.trend)}
          <span className={`text-xs ml-1 ${getTrendColor(metric.trend, isPositiveTrend)}`}>
            {formatChange(metric.change)} from last period
          </span>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Compliance Metrics</h3>
          <p className="text-sm text-muted-foreground">
            Real-time compliance tracking and analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={userType} onValueChange={onUserTypeChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Users</SelectItem>
              <SelectItem value="OWNER">Owners</SelectItem>
              <SelectItem value="AGENT">Agents</SelectItem>
              <SelectItem value="RENTER">Renters</SelectItem>
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Documents"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          metric={metrics.totalDocuments}
        />
        <MetricCard
          title="Compliance Rate"
          icon={<Shield className="h-4 w-4 text-green-600" />}
          metric={metrics.complianceRate}
          suffix="%"
        />
        <MetricCard
          title="Pending Review"
          icon={<Clock className="h-4 w-4 text-yellow-600" />}
          metric={metrics.pendingReview}
          isPositiveTrend={false}
        />
        <MetricCard
          title="Expiring Soon"
          icon={<Calendar className="h-4 w-4 text-orange-600" />}
          metric={metrics.expiringSoon}
          isPositiveTrend={false}
        />
        <MetricCard
          title="Critical Issues"
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          metric={metrics.criticalIssues}
          isPositiveTrend={false}
        />
        <MetricCard
          title="Avg Review Time"
          icon={<Clock className="h-4 w-4 text-blue-600" />}
          metric={metrics.averageReviewTime}
          suffix=" days"
          isPositiveTrend={false}
        />
      </div>

      {/* Document Types Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Document Types Compliance</CardTitle>
          <CardDescription>
            Compliance rates by document type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics.documentTypes).map(([type, data]) => (
              <div key={type} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {type.replace('_', ' ')}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {data.total} documents
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{data.rate}%</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <Progress value={data.rate} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Approved: {data.approved}</span>
                  <span>Pending: {data.pending}</span>
                  <span>Rejected: {data.rejected}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Type Compliance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>User Type Compliance</CardTitle>
            <CardDescription>
              Compliance rates by user category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Property Owners</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={metrics.userCompliance.owners} className="w-20" />
                  <span className="text-sm font-medium">
                    {metrics.userCompliance.owners}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Agents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={metrics.userCompliance.agents} className="w-20" />
                  <span className="text-sm font-medium">
                    {metrics.userCompliance.agents}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Renters</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={metrics.userCompliance.renters} className="w-20" />
                  <span className="text-sm font-medium">
                    {metrics.userCompliance.renters}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Regional Compliance</CardTitle>
            <CardDescription>
              Compliance rates by region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.regionCompliance).map(([region, rate]) => (
                <div key={region} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{region}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={rate} className="w-20" />
                    <span className="text-sm font-medium">{rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ComplianceMetrics
