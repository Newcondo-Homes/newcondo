'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  MapPin, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Phone,
  Mail,
  Shield,
  Ban,
  AlertTriangle
} from 'lucide-react';

interface AgentDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  isAvailableForMarking: boolean;
  agentServiceAreas: string[];
  agentReliabilityScore: number;
  totalMarkingJobs: number;
  completedMarkingJobs: number;
  createdAt: string;
  verificationStatus: string;
}

interface MarkingJob {
  id: string;
  propertyId: string;
  propertyAddress: string;
  status: string;
  completedAt?: string;
  markingFee: number;
  rating?: number;
}

interface PerformanceMetrics {
  successRate: number;
  averageCompletionTime: number;
  totalEarnings: number;
  activeJobs: number;
  cancelledJobs: number;
  disputedJobs: number;
  averageRating: number;
}

export default function AgentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const agentId = params.agentId as string;

  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [jobs, setJobs] = useState<MarkingJob[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchAgentDetails();
    fetchAgentJobs();
    fetchPerformanceMetrics();
  }, [agentId]);

  const fetchAgentDetails = async () => {
    try {
      const response = await fetch(`/api/admin/marking/agents/${agentId}`);
      const data = await response.json();
      setAgent(data.agent);
    } catch (error) {
      console.error('Failed to fetch agent details:', error);
    }
  };

  const fetchAgentJobs = async () => {
    try {
      const response = await fetch(`/api/admin/marking/agents/${agentId}/jobs`);
      const data = await response.json();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Failed to fetch agent jobs:', error);
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch(`/api/admin/marking/agents/${agentId}/metrics`);
      const data = await response.json();
      setMetrics(data.metrics);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      setLoading(false);
    }
  };

  const handleToggleAvailability = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/marking/agents/${agentId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !agent?.isAvailableForMarking })
      });

      if (response.ok) {
        fetchAgentDetails();
      }
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendAgent = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/marking/agents/${agentId}/suspend`, {
        method: 'POST'
      });

      if (response.ok) {
        router.push('/marking/agents');
      }
    } catch (error) {
      console.error('Failed to suspend agent:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !agent || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const completionRate = agent.totalMarkingJobs > 0 
    ? (agent.completedMarkingJobs / agent.totalMarkingJobs * 100).toFixed(1)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Details</h1>
          <p className="text-muted-foreground">View and manage agent performance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Back
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={actionLoading}>
                <Ban className="w-4 h-4 mr-2" />
                Suspend Agent
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Suspend Agent</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to suspend this agent? They will no longer be able to accept marking jobs.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSuspendAgent}>
                  Suspend
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Agent Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={agent.image} />
              <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">{agent.name}</h2>
                  <Badge variant={agent.isAvailableForMarking ? "success" : "secondary"}>
                    {agent.isAvailableForMarking ? "Available" : "Unavailable"}
                  </Badge>
                  <Badge variant={agent.verificationStatus === 'VERIFIED' ? "success" : "warning"}>
                    {agent.verificationStatus}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{agent.agentReliabilityScore.toFixed(2)}</span>
                  <span className="text-muted-foreground">/ 5.00</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Jobs</p>
                  <p className="text-2xl font-bold">{agent.totalMarkingJobs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{agent.completedMarkingJobs}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold">{completionRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold">₦{metrics.totalEarnings.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{agent.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{agent.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{agent.agentServiceAreas.join(', ')}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant={agent.isAvailableForMarking ? "outline" : "default"}
                  onClick={handleToggleAvailability}
                  disabled={actionLoading}
                >
                  {agent.isAvailableForMarking ? "Mark as Unavailable" : "Mark as Available"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Completion Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{metrics.averageCompletionTime.toFixed(1)}h</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <span className="text-2xl font-bold">{metrics.activeJobs}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Disputed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-2xl font-bold">{metrics.disputedJobs}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Job History */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({jobs.filter(j => j.status === 'COMPLETED').length})
          </TabsTrigger>
          <TabsTrigger value="active">
            Active ({jobs.filter(j => ['ASSIGNED', 'IN_PROGRESS'].includes(j.status)).length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({jobs.filter(j => j.status === 'CANCELLED').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {jobs.map(job => (
            <Card key={job.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{job.propertyAddress}</p>
                    <p className="text-sm text-muted-foreground">Job ID: {job.id}</p>
                    {job.completedAt && (
                      <p className="text-sm text-muted-foreground">
                        Completed: {new Date(job.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">₦{job.markingFee.toLocaleString()}</p>
                      {job.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{job.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant={
                      job.status === 'COMPLETED' ? 'success' :
                      job.status === 'CANCELLED' ? 'destructive' :
                      'default'
                    }>
                      {job.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed">
          {jobs.filter(j => j.status === 'COMPLETED').map(job => (
            <Card key={job.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{job.propertyAddress}</p>
                    <p className="text-sm text-muted-foreground">
                      Completed: {job.completedAt && new Date(job.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold">₦{job.markingFee.toLocaleString()}</p>
                      {job.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{job.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="active">
          {jobs.filter(j => ['ASSIGNED', 'IN_PROGRESS'].includes(j.status)).map(job => (
            <Card key={job.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{job.propertyAddress}</p>
                    <p className="text-sm text-muted-foreground">Job ID: {job.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">₦{job.markingFee.toLocaleString()}</p>
                    <Badge>{job.status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="cancelled">
          {jobs.filter(j => j.status === 'CANCELLED').map(job => (
            <Card key={job.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{job.propertyAddress}</p>
                    <p className="text-sm text-muted-foreground">Job ID: {job.id}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">₦{job.markingFee.toLocaleString()}</p>
                    <Badge variant="destructive">CANCELLED</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}