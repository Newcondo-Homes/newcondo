'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useMarkingJobs } from '@/hooks/useMarkingJobs';
import { toast } from '@/components/ui/toast';
import { MapPin, Clock, DollarSign, AlertCircle, Filter } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { formatCurrency, formatDate, formatTimeRemaining } from '@/lib/utils/format';

interface MarkingJob {
  id: string;
  propertyId: string;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  markingFee: number;
  status: string;
  timeSlotExpiry?: string;
  queuePosition?: number;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
    images: { url: string }[];
  };
  createdAt: string;
}

export default function AvailableMarkingJobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { availableJobs, isLoading, acceptJob, isAccepting } = useMarkingJobs();
  const [filteredJobs, setFilteredJobs] = useState<MarkingJob[]>([]);
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user is eligible for marking jobs
    if (user.role !== 'AGENT' && !user.isPremium) {
      toast({
        title: 'Access Denied',
        description: 'Only agents and premium users can access marking jobs.',
        variant: 'destructive'
      });
      router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (availableJobs) {
      let filtered = [...availableJobs];

      // Filter by urgency
      if (urgencyFilter !== 'ALL') {
        filtered = filtered.filter(job => job.urgencyLevel === urgencyFilter);
      }

      // Filter by location
      if (locationFilter !== 'ALL') {
        filtered = filtered.filter(job => job.property.state === locationFilter);
      }

      setFilteredJobs(filtered);
    }
  }, [availableJobs, urgencyFilter, locationFilter]);

  const handleAcceptJob = async (jobId: string) => {
    try {
      await acceptJob(jobId);
      toast({
        title: 'Job Accepted',
        description: 'You have been added to the queue. Complete the job within your time slot.',
        variant: 'success'
      });
      router.push(`/marking/my-jobs/${jobId}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept job',
        variant: 'destructive'
      });
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'URGENT': return 'destructive';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'default';
      case 'LOW': return 'secondary';
      default: return 'default';
    }
  };

  const getUniqueStates = () => {
    if (!availableJobs) return [];
    return Array.from(new Set(availableJobs.map(job => job.property.state)));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Available Marking Jobs</h1>
          <p className="text-muted-foreground mt-1">
            Accept jobs and earn {formatCurrency(5000)} per completed marking
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {filteredJobs.length} Jobs Available
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>
          
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Urgency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Urgency</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="NORMAL">Normal</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Locations</SelectItem>
              {getUniqueStates().map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(urgencyFilter !== 'ALL' || locationFilter !== 'ALL') && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setUrgencyFilter('ALL');
                setLocationFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Jobs Available</h3>
            <p className="text-muted-foreground text-center">
              There are currently no marking jobs matching your filters. Check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <img
                  src={job.property.images[0]?.url || '/images/placeholders/property.jpg'}
                  alt={job.property.title}
                  className="w-full h-full object-cover"
                />
                <Badge 
                  variant={getUrgencyColor(job.urgencyLevel)}
                  className="absolute top-2 right-2"
                >
                  {job.urgencyLevel}
                </Badge>
              </div>

              <CardHeader>
                <CardTitle className="line-clamp-1">{job.property.title}</CardTitle>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.property.city}, {job.property.state}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Marking Fee</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(job.markingFee * 0.25)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Contact Person</span>
                  <span className="text-sm font-medium">{job.contactPersonName}</span>
                </div>

                {job.preferredTime && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Preferred: {formatDate(job.preferredTime)}
                    </span>
                  </div>
                )}

                {job.queuePosition && job.queuePosition > 0 && (
                  <Badge variant="secondary" className="w-full justify-center">
                    {job.queuePosition} agents in queue
                  </Badge>
                )}
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleAcceptJob(job.id)}
                  disabled={isAccepting}
                >
                  {isAccepting ? 'Accepting...' : 'Accept Job'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}