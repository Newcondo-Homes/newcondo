'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui/components/tabs';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import { Progress } from '@newcondo/ui/components/progress';
import { useAuth } from '@/hooks/useAuth';
import { useMarkingJobs } from '@/hooks/useMarkingJobs';
import { 
  MapPin, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Timer,
  Phone,
  Info
} from 'lucide-react';
import { formatCurrency, formatDate, formatTimeRemaining } from '@/lib/utils/format';
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui/components/alert';

interface MyMarkingJob {
  id: string;
  propertyId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: string;
  markingFee: number;
  paymentStatus: string;
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
  assignedAt?: string;
  completedAt?: string;
  timeSlotExpiry?: string;
  queuePosition?: number;
  completionNotes?: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
    images: { url: string }[];
  };
  createdAt: string;
}

export default function MyMarkingJobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { markingJobs: myJobs, isLoading } = useMarkingJobs();
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'AGENT' && !user.isPremium) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'IN_PROGRESS': return 'default';
      case 'ASSIGNED': return 'secondary';
      case 'QUEUED': return 'outline';
      case 'CANCELLED': return 'destructive';
      case 'EXPIRED': return 'destructive';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-4 w-4" />;
      case 'CANCELLED':
      case 'EXPIRED': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const calculateTimeProgress = (assignedAt?: string, timeSlotExpiry?: string) => {
    if (!assignedAt || !timeSlotExpiry) return 0;
    
    const start = new Date(assignedAt).getTime();
    const end = new Date(timeSlotExpiry).getTime();
    const now = Date.now();
    
    const total = end - start;
    const elapsed = now - start;
    
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const getTimeRemainingColor = (timeSlotExpiry?: string) => {
    if (!timeSlotExpiry) return 'default';
    
    const remaining = new Date(timeSlotExpiry).getTime() - Date.now();
    const hours = remaining / (1000 * 60 * 60);
    
    if (hours < 1) return 'destructive';
    if (hours < 2) return 'warning';
    return 'default';
  };

  const filterJobs = (status: string) => {
    if (!myJobs) return [];
    
    switch (status) {
      case 'active':
        return myJobs.filter(job => 
          ['QUEUED', 'ASSIGNED', 'IN_PROGRESS'].includes(job.status)
        );
      case 'completed':
        return myJobs.filter(job => job.status === 'COMPLETED');
      case 'cancelled':
        return myJobs.filter(job => 
          ['CANCELLED', 'EXPIRED'].includes(job.status)
        );
      default:
        return myJobs;
    }
  };

  const renderJobCard = (job: MyMarkingJob) => (
    <Card key={job.id} className="overflow-hidden">
      <div className="relative h-48">
        <img
          src={job.property.images[0]?.url || '/images/placeholders/property.jpg'}
          alt={job.property.title}
          className="w-full h-full object-cover"
        />
        <Badge 
          variant={getStatusColor(job.status)}
          className="absolute top-2 right-2 flex items-center gap-1"
        >
          {getStatusIcon(job.status)}
          {job.status}
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-1">{job.property.title}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <MapPin className="h-4 w-4" />
          {job.property.address}, {job.property.city}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time Slot Progress for Active Jobs */}
        {job.status === 'ASSIGNED' && job.timeSlotExpiry && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Timer className="h-4 w-4" />
                Time Remaining
              </span>
              <Badge variant={getTimeRemainingColor(job.timeSlotExpiry)}>
                {formatTimeRemaining(new Date(job.timeSlotExpiry))}
              </Badge>
            </div>
            <Progress 
              value={calculateTimeProgress(job.assignedAt, job.timeSlotExpiry)} 
              className="h-2"
            />
          </div>
        )}

        {/* Queue Position */}
        {job.status === 'QUEUED' && job.queuePosition && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Queue Position</AlertTitle>
            <AlertDescription>
              You are #{job.queuePosition} in the queue. You'll be notified when it's your turn.
            </AlertDescription>
          </Alert>
        )}

        {/* Job Details */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your Earning</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(job.markingFee * 0.25)}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Contact Person</span>
            <span className="font-medium">{job.contactPersonName}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`tel:${job.contactPersonPhone}`}
              className="text-primary hover:underline"
            >
              {job.contactPersonPhone}
            </a>
          </div>
        </div>

        {/* Completion Info */}
        {job.status === 'COMPLETED' && job.completedAt && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Completed on {formatDate(job.completedAt)}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          asChild
        >
          <Link href={`/marking/my-jobs/${job.id}`}>
            View Details
          </Link>
        </Button>
        
        {job.status === 'ASSIGNED' && (
          <Button
            className="flex-1"
            asChild
          >
            <Link href={`/marking/my-jobs/${job.id}/complete`}>
              Complete Job
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  const activeJobs = filterJobs('active');
  const completedJobs = filterJobs('completed');
  const cancelledJobs = filterJobs('cancelled');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Marking Jobs</h1>
        <p className="text-muted-foreground mt-1">
          Manage and track your property marking assignments
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                completedJobs.reduce((sum, job) => sum + (job.markingFee * 0.25), 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedJobs.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({cancelledJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Jobs</h3>
                <p className="text-muted-foreground text-center mb-4">
                  You don't have any active marking jobs at the moment.
                </p>
                <Button asChild>
                  <Link href="/marking/available-jobs">
                    Browse Available Jobs
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeJobs.map(renderJobCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Jobs</h3>
                <p className="text-muted-foreground text-center">
                  Your completed marking jobs will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedJobs.map(renderJobCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="mt-6">
          {cancelledJobs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Cancelled Jobs</h3>
                <p className="text-muted-foreground text-center">
                  Your cancelled or expired jobs will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cancelledJobs.map(renderJobCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}