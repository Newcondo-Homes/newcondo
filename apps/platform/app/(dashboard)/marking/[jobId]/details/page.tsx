'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Navigation,
  Home,
  FileText,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';

interface MarkingJobDetails {
  id: string;
  propertyId: string;
  status: string;
  urgencyLevel: string;
  markingFee: number;
  paymentStatus: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions: string | null;
  preferredTime: string | null;
  queuePosition: number | null;
  timeSlotExpiry: string | null;
  maxCompletionTime: string;
  assignedAt: string | null;
  assignedAgentId: string | null;
  property: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
    gpsCoordinates: string | null;
    images: Array<{ url: string; isPrimary: boolean }>;
  };
  requestingUser: {
    name: string;
    phone: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<MarkingJobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/marking/jobs/${jobId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }

      const data = await response.json();
      setJob(data.job);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load job details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = () => {
    router.push(`/marking/${jobId}/accept`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      QUEUED: 'bg-blue-500',
      ASSIGNED: 'bg-yellow-500',
      IN_PROGRESS: 'bg-purple-500',
      COMPLETED: 'bg-green-500',
      CANCELLED: 'bg-red-500',
      EXPIRED: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      LOW: 'bg-green-100 text-green-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      HIGH: 'bg-orange-100 text-orange-800',
      URGENT: 'bg-red-100 text-red-800',
    };
    return colors[urgency] || 'bg-gray-100 text-gray-800';
  };

  const calculateTimeRemaining = (expiry: string | null) => {
    if (!expiry) return null;
    
    const now = new Date();
    const expiryDate = new Date(expiry);
    const diff = expiryDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m remaining`;
  };

  const openInMaps = () => {
    if (!job?.property.gpsCoordinates) {
      toast({
        title: 'Location unavailable',
        description: 'GPS coordinates not available for this property',
        variant: 'destructive',
      });
      return;
    }

    try {
      const coords = JSON.parse(job.property.gpsCoordinates);
      const url = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`;
      window.open(url, '_blank');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to open maps',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Job not found'}
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => router.back()} 
          variant="outline" 
          className="mt-4"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const isAssignedToCurrentUser = job.assignedAgentId === user?.id;
  const canAcceptJob = job.status === 'QUEUED' && !job.assignedAgentId;
  const timeRemaining = calculateTimeRemaining(job.timeSlotExpiry);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Details</h1>
          <p className="text-muted-foreground mt-1">
            Job ID: {job.id.slice(0, 8)}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge className={cn('px-3 py-1', getStatusColor(job.status))}>
            {job.status.replace('_', ' ')}
          </Badge>
          <Badge className={getUrgencyColor(job.urgencyLevel)}>
            {job.urgencyLevel} Priority
          </Badge>
        </div>
      </div>

      {/* Time Slot Alert */}
      {isAssignedToCurrentUser && job.timeSlotExpiry && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>Time Slot:</strong> {timeRemaining}
            {' - '}Complete the marking within your 3-hour window or the job will be reassigned.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Status Alert */}
      {job.paymentStatus !== 'SUCCESS' && (
        <Alert className="mb-6">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Payment Status: <strong>{job.paymentStatus}</strong>
            {job.paymentStatus === 'PENDING' && ' - Awaiting payment confirmation'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.property.images.length > 0 && (
                <div className="aspect-video relative rounded-lg overflow-hidden">
                  <img
                    src={job.property.images.find(img => img.isPrimary)?.url || job.property.images[0].url}
                    alt={job.property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h3 className="font-semibold text-lg">{job.property.title}</h3>
                <div className="flex items-start gap-2 mt-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{job.property.address}</p>
                    <p>{job.property.city}, {job.property.state}</p>
                  </div>
                </div>
              </div>

              {job.property.gpsCoordinates && (
                <Button 
                  onClick={openInMaps}
                  variant="outline"
                  className="w-full"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Open in Google Maps
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Contact Information
              </CardTitle>
              <CardDescription>
                Person to contact for property access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{job.contactPersonName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Phone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <a 
                    href={`tel:${job.contactPersonPhone}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {job.contactPersonPhone}
                  </a>
                </div>
              </div>

              {job.preferredTime && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Preferred Time</p>
                    <p className="font-medium">
                      {new Date(job.preferredTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Access Instructions */}
          {job.accessInstructions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Access Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{job.accessInstructions}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Marking Fee</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(Number(job.markingFee))}
                </span>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Earnings (25%)</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(Number(job.markingFee) * 0.25)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee</span>
                  <span className="font-medium">
                    {formatCurrency(Number(job.markingFee) * 0.75)}
                  </span>
                </div>
              </div>

              <Separator />

              {job.queuePosition && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Queue Position</span>
                  <Badge variant="outline">#{job.queuePosition}</Badge>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Posted</span>
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deadline</span>
                <span className="font-medium text-red-600">
                  {new Date(job.maxCompletionTime).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {canAcceptJob && (
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={handleAcceptJob}
                  className="w-full"
                  size="lg"
                  disabled={accepting}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {accepting ? 'Processing...' : 'Accept This Job'}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  You'll have 3 hours to complete after accepting
                </p>
              </CardContent>
            </Card>
          )}

          {isAssignedToCurrentUser && job.status === 'ASSIGNED' && (
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={() => router.push(`/marking/${jobId}/complete`)}
                  className="w-full"
                  size="lg"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Property Owner Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Property Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{job.requestingUser.name}</span>
                </div>
                {job.requestingUser.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={`tel:${job.requestingUser.phone}`}
                      className="text-primary hover:underline"
                    >
                      {job.requestingUser.phone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}