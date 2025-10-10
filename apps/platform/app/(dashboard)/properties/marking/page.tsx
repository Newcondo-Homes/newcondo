'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui'
import { Button } from '@newcondo/ui'
import { Badge } from '@newcondo/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui'
import { Calendar, Clock, MapPin, User, DollarSign, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

interface MarkingJob {
  id: string
  propertyId: string
  propertyTitle: string
  propertyAddress: string
  contactPersonName: string
  contactPersonPhone: string
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  markingFee: number
  paymentStatus: 'PENDING' | 'SUCCESS' | 'FAILED'
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
  assignedAgentId?: string
  assignedAgentName?: string
  requestedBy: string
  requesterName: string
  preferredTime?: string
  accessInstructions?: string
  queuePosition?: number
  maxCompletionTime?: string
  completedAt?: string
  createdAt: string
}

export default function PropertyMarkingDashboard() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<MarkingJob[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('my-requests')

  useEffect(() => {
    fetchMarkingJobs()
  }, [activeTab])

  const fetchMarkingJobs = async () => {
    try {
      setLoading(true)
      const endpoint = activeTab === 'my-requests' 
        ? '/api/marking/my-requests'
        : '/api/marking/available-jobs'
      
      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        setJobs(data)
      }
    } catch (error) {
      console.error('Error fetching marking jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUEUED': return 'bg-yellow-100 text-yellow-800'
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'URGENT': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'NORMAL': return 'bg-blue-100 text-blue-800'
      case 'LOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const acceptJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/marking/jobs/${jobId}/accept`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchMarkingJobs()
      }
    } catch (error) {
      console.error('Error accepting job:', error)
    }
  }

  const JobCard = ({ job }: { job: MarkingJob }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{job.propertyTitle}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4" />
              {job.propertyAddress}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={getStatusColor(job.status)}>
              {job.status.replace('_', ' ')}
            </Badge>
            <Badge className={getUrgencyColor(job.urgencyLevel)}>
              {job.urgencyLevel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm">
              Contact: {job.contactPersonName} ({job.contactPersonPhone})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">
              Fee: ₦{job.markingFee.toLocaleString()}
            </span>
          </div>

          {job.preferredTime && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                Preferred: {format(new Date(job.preferredTime), 'MMM dd, yyyy HH:mm')}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm">
              Requested: {format(new Date(job.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        {job.accessInstructions && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-blue-800 mb-1">Access Instructions:</h4>
            <p className="text-sm text-blue-700">{job.accessInstructions}</p>
          </div>
        )}

        {job.queuePosition && (
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-orange-700">
              Queue Position: #{job.queuePosition}
            </span>
          </div>
        )}

        {job.assignedAgentName && (
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700">
              Assigned to: {job.assignedAgentName}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Link href={`/dashboard/properties/marking/${job.id}`}>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </Link>
          
          {activeTab === 'available-jobs' && job.status === 'QUEUED' && (
            <Button 
              size="sm" 
              onClick={() => acceptJob(job.id)}
              className="bg-green-600 hover:bg-green-700"
            >
              Accept Job
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Marking Jobs</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Marking Dashboard</h1>
        <p className="text-gray-600">
          Manage property marking requests and available marking jobs
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
          <TabsTrigger value="available-jobs">
            Available Jobs {user?.isAvailableForMarking ? '' : '(Agent Only)'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-requests" className="mt-6">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState message="You haven't requested any property marking services yet." />
          ) : (
            <div>
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available-jobs" className="mt-6">
          {!user?.isAvailableForMarking ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Agent Access Required
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You need to be registered as an available marking agent to view and accept jobs.
                  </p>
                  <Link href="/dashboard/profile/agent-settings">
                    <Button>Enable Agent Services</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState message="No marking jobs available in your area at the moment." />
          ) : (
            <div>
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}




