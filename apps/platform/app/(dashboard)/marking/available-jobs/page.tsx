'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Skeleton } from '@newcondo/ui/components/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useMarkingJobs } from '@/hooks/useMarkingJobs';
import { toast } from '@newcondo/ui/';
import { MapPin, Clock, DollarSign, AlertCircle, Filter } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@newcondo/ui/components/select';
import { formatCurrency, formatDate, formatTimeRemaining } from '@/lib/utils/format';
import type { MarkingJob} from "@/types/markingJob"


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
      toast.error('Access Denied',{
        description: 'Only agents and premium users can access marking jobs.',
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
      toast.success('Job Accepted',{
        description: 'You have been added to the queue. Complete the job within your time slot.',
      });
      router.push(`/marking/my-jobs/${jobId}`);
    } catch (error) {
      toast.error('Error',{
        description: error instanceof Error ? error.message : 'Failed to accept job',
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








// // apps/platform/app/(dashboard)/marking/available-jobs/page.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/ui/card';
// import { Button } from '@newcondo/ui/components/ui/button';
// import { Badge } from '@newcondo/ui/components/ui/badge';
// import { Input } from '@newcondo/ui/components/ui/input';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@newcondo/ui/components/ui/select';
// import { Alert, AlertDescription } from '@newcondo/ui/components/ui/alert';
// import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
// import { useAuth } from '@/hooks/useAuth';
// import { useMarkingJobs } from '@/hooks/useMarkingJobs';
// import { 
//   MapPin, 
//   Calendar, 
//   DollarSign, 
//   Clock,
//   AlertCircle,
//   Search,
//   Filter,
//   TrendingUp,
//   Users
// } from 'lucide-react';
// import { formatCurrency } from '@/lib/utils/format';
// import { formatDistanceToNow, format } from 'date-fns';

// export default function AvailableJobsPage() {
//   const router = useRouter();
//   const { user, isLoading: authLoading } = useAuth();
//   const { 
//     availableJobs, 
//     isLoading,
//     error,
//     fetchAvailableJobs,
//     filters,
//     setFilters 
//   } = useMarkingJobs();

//   const [searchTerm, setSearchTerm] = useState('');
//   const [sortBy, setSortBy] = useState<'date' | 'fee' | 'distance'>('date');
//   const [filterUrgency, setFilterUrgency] = useState<string>('all');

//   useEffect(() => {
//     if (!authLoading && user) {
//       if (user.role !== 'AGENT' && !user.isPremium) {
//         router.push('/dashboard');
//         return;
//       }
//       fetchAvailableJobs({ sortBy, urgency: filterUrgency });
//     }
//   }, [user, authLoading, router, sortBy, filterUrgency, fetchAvailableJobs]);

//   const handleAcceptJob = (jobId: string) => {
//     router.push(`/marking/${jobId}/accept`);
//   };

//   const filteredJobs = availableJobs?.filter((job: any) => {
//     const searchLower = searchTerm.toLowerCase();
//     return (
//       job.property.title.toLowerCase().includes(searchLower) ||
//       job.property.address.toLowerCase().includes(searchLower) ||
//       job.property.city.toLowerCase().includes(searchLower) ||
//       job.property.state.toLowerCase().includes(searchLower)
//     );
//   });

//   if (authLoading || isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <LoadingSpinner size="lg" />
//       </div>
//     );
//   }

//   if (!user || (user.role !== 'AGENT' && !user.isPremium)) {
//     return (
//       <Alert variant="destructive">
//         <AlertCircle className="h-4 w-4" />
//         <AlertDescription>
//           You don't have access to marking jobs. Only agents and premium users can access this feature.
//         </AlertDescription>
//       </Alert>
//     );
//   }

//   if (error) {
//     return (
//       <Alert variant="destructive">
//         <AlertCircle className="h-4 w-4" />
//         <AlertDescription>{error}</AlertDescription>
//       </Alert>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       {/* Header */}
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold mb-2">Available Marking Jobs</h1>
//         <p className="text-muted-foreground">
//           Browse and accept property marking jobs in your service areas
//         </p>
//       </div>

//       {/* Filters */}
//       <Card className="mb-6">
//         <CardContent className="pt-6">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             {/* Search */}
//             <div className="md:col-span-2">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
//                 <Input
//                   placeholder="Search by location, address..."
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                   className="pl-10"
//                 />
//               </div>
//             </div>

//             {/* Sort By */}
//             <div>
//               <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="Sort by" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="date">Most Recent</SelectItem>
//                   <SelectItem value="fee">Highest Fee</SelectItem>
//                   <SelectItem value="distance">Nearest</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Filter by Urgency */}
//             <div>
//               <Select value={filterUrgency} onValueChange={setFilterUrgency}>
//                 <SelectTrigger>
//                   <SelectValue placeholder="All Urgencies" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Urgencies</SelectItem>
//                   <SelectItem value="LOW">Low</SelectItem>
//                   <SelectItem value="NORMAL">Normal</SelectItem>
//                   <SelectItem value="HIGH">High</SelectItem>
//                   <SelectItem value="URGENT">Urgent</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Results Count */}
//       {filteredJobs && (
//         <div className="mb-4 flex items-center justify-between">
//           <p className="text-sm text-muted-foreground">
//             {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} available
//           </p>
//           {!user.isAvailableForMarking && (
//             <Alert className="border-yellow-500 w-auto inline-flex items-center gap-2 py-2 px-4">
//               <AlertCircle className="h-4 w-4 text-yellow-600" />
//               <AlertDescription className="text-sm m-0">
//                 Set yourself as available to accept jobs
//               </AlertDescription>
//             </Alert>
//           )}
//         </div>
//       )}

//       {/* Jobs Grid */}
//       {filteredJobs && filteredJobs.length > 0 ? (
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//           {filteredJobs.map((job: any) => (
//             <Card key={job.id} className="hover:shadow-lg transition-shadow">
//               <CardHeader>
//                 <div className="flex items-start justify-between">
//                   <div className="flex-1">
//                     <CardTitle className="mb-2">{job.property.title}</CardTitle>
//                     <CardDescription className="flex items-start gap-2">
//                       <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
//                       <span>
//                         {job.property.address}, {job.property.city}, {job.property.state}
//                       </span>
//                     </CardDescription>
//                   </div>
//                   <Badge variant={
//                     job.urgencyLevel === 'URGENT' ? 'destructive' :
//                     job.urgencyLevel === 'HIGH' ? 'default' :
//                     'secondary'
//                   }>
//                     {job.urgencyLevel}
//                   </Badge>
//                 </div>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 {/* Job Details */}
//                 <div className="grid grid-cols-2 gap-4 text-sm">
//                   <div className="flex items-center gap-2">
//                     <DollarSign className="h-4 w-4 text-muted-foreground" />
//                     <div>
//                       <p className="text-muted-foreground text-xs">Your Earnings</p>
//                       <p className="font-semibold">{formatCurrency(job.markingFee * 0.25)}</p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Users className="h-4 w-4 text-muted-foreground" />
//                     <div>
//                       <p className="text-muted-foreground text-xs">Queue Position</p>
//                       <p className="font-semibold">
//                         {job.queuePosition ? `#${job.queuePosition}` : 'Available'}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Calendar className="h-4 w-4 text-muted-foreground" />
//                     <div>
//                       <p className="text-muted-foreground text-xs">Posted</p>
//                       <p className="font-medium">
//                         {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Clock className="h-4 w-4 text-muted-foreground" />
//                     <div>
//                       <p className="text-muted-foreground text-xs">Complete By</p>
//                       <p className="font-medium">
//                         {format(new Date(job.maxCompletionTime), 'MMM dd, HH:mm')}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Preferred Time */}
//                 {job.preferredTime && (
//                   <div className="p-3 bg-accent rounded-lg">
//                     <p className="text-xs text-muted-foreground mb-1">Preferred Visit Time</p>
//                     <p className="text-sm font-medium">
//                       {format(new Date(job.preferredTime), 'PPP p')}
//                     </p>
//                   </div>
//                 )}

//                 {/* Access Instructions Preview */}
//                 {job.accessInstructions && (
//                   <div className="p-3 bg-accent rounded-lg">
//                     <p className="text-xs text-muted-foreground mb-1">Access Instructions</p>
//                     <p className="text-sm line-clamp-2">{job.accessInstructions}</p>
//                   </div>
//                 )}

//                 {/* Actions */}
//                 <div className="flex gap-3 pt-2">
//                   <Button
//                     variant="outline"
//                     className="flex-1"
//                     onClick={() => router.push(`/marking/${job.id}/details`)}
//                   >
//                     View Details
//                   </Button>
//                   <Button
//                     className="flex-1"
//                     onClick={() => handleAcceptJob(job.id)}
//                     disabled={!user.isAvailableForMarking}
//                   >
//                     Accept Job
//                   </Button>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       ) : (
//         <Card>
//           <CardContent className="py-16 text-center">
//             <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
//             <h3 className="text-lg font-semibold mb-2">No Available Jobs</h3>
//             <p className="text-muted-foreground mb-4">
//               {searchTerm 
//                 ? "No jobs match your search criteria. Try adjusting your filters."
//                 : "There are currently no marking jobs available in your service areas."}
//             </p>
//             {searchTerm && (
//               <Button variant="outline" onClick={() => setSearchTerm('')}>
//                 Clear Search
//               </Button>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       {/* Service Areas Info */}
//       {user.agentServiceAreas && user.agentServiceAreas.length > 0 && (
//         <Card className="mt-6">
//           <CardHeader>
//             <CardTitle className="text-sm">Your Service Areas</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="flex flex-wrap gap-2">
//               {user.agentServiceAreas.map((area: string, index: number) => (
//                 <Badge key={index} variant="secondary">
//                   {area}
//                 </Badge>
//               ))}
//             </div>
//             <Button variant="link" asChild className="mt-2 px-0">
//               <Link href="/profile/settings">
//                 Update service areas
//               </Link>
//             </Button>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }