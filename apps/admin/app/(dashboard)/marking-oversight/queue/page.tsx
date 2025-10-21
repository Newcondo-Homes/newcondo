// apps/admin/src/app/(dashboard)/marking-oversight/queue/page.tsx

import { Suspense } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Queue stats component
async function QueueStats() {
  // TODO: Fetch from API
  const stats = {
    totalInQueue: 23,
    assigned: 12,
    awaitingAssignment: 11,
    averageWaitTime: '42 minutes',
    longestWait: '2 hours 15 minutes'
  };

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total in Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInQueue}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Assigned</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.assigned}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Awaiting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{stats.awaitingAssignment}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold">{stats.averageWaitTime}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Longest Wait</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-bold text-red-600">{stats.longestWait}</div>
        </CardContent>
      </Card>
    </div>
  );
}

// Queue item interface
interface QueueItem {
  id: string;
  jobId: string;
  propertyAddress: string;
  city: string;
  state: string;
  requestedBy: string;
  queuePosition: number;
  assignedAgent?: string;
  timeInQueue: string;
  timeSlotRemaining?: string;
  urgencyLevel: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS';
}

// Queue table component
async function QueueTable({ status }: { status: 'all' | 'assigned' | 'unassigned' }) {
  // TODO: Fetch from API
  const queueItems: QueueItem[] = [
    {
      id: '1',
      jobId: 'MJ-1240',
      propertyAddress: '123 Allen Avenue',
      city: 'Lagos',
      state: 'Lagos',
      requestedBy: 'Ade Johnson',
      queuePosition: 1,
      assignedAgent: 'John Doe',
      timeInQueue: '15 minutes',
      timeSlotRemaining: '2h 45m',
      urgencyLevel: 'HIGH',
      status: 'ASSIGNED'
    },
    {
      id: '2',
      jobId: 'MJ-1241',
      propertyAddress: '45 Admiralty Way',
      city: 'Lagos',
      state: 'Lagos',
      requestedBy: 'Ngozi Okafor',
      queuePosition: 2,
      timeInQueue: '32 minutes',
      urgencyLevel: 'NORMAL',
      status: 'QUEUED'
    },
    {
      id: '3',
      jobId: 'MJ-1242',
      propertyAddress: '78 Ozumba Mbadiwe',
      city: 'Lagos',
      state: 'Lagos',
      requestedBy: 'Chidi Eze',
      queuePosition: 3,
      assignedAgent: 'Jane Smith',
      timeInQueue: '1h 5m',
      timeSlotRemaining: '1h 55m',
      urgencyLevel: 'URGENT',
      status: 'IN_PROGRESS'
    }
  ];

  const filteredItems = queueItems.filter(item => {
    if (status === 'assigned') return item.assignedAgent;
    if (status === 'unassigned') return !item.assignedAgent;
    return true;
  });

  const getUrgencyBadge = (level: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", color: string }> = {
      LOW: { variant: 'secondary', color: 'text-gray-600' },
      NORMAL: { variant: 'outline', color: 'text-blue-600' },
      HIGH: { variant: 'default', color: 'text-orange-600' },
      URGENT: { variant: 'destructive', color: 'text-red-600' }
    };
    return variants[level] || variants.NORMAL;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", icon: typeof Clock }> = {
      QUEUED: { variant: 'secondary', icon: Clock },
      ASSIGNED: { variant: 'default', icon: User },
      IN_PROGRESS: { variant: 'outline', icon: RefreshCw }
    };
    return variants[status] || variants.QUEUED;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Position</TableHead>
            <TableHead>Job ID</TableHead>
            <TableHead>Property</TableHead>
            <TableHead>Requested By</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Assigned Agent</TableHead>
            <TableHead>Time in Queue</TableHead>
            <TableHead>Time Remaining</TableHead>
            <TableHead>Urgency</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">
                No jobs in queue
              </TableCell>
            </TableRow>
          ) : (
            filteredItems.map((item) => {
              const urgencyStyle = getUrgencyBadge(item.urgencyLevel);
              const statusStyle = getStatusBadge(item.status);
              const StatusIcon = statusStyle.icon;

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">#{item.queuePosition}</TableCell>
                  <TableCell>
                    <Button variant="link" className="p-0 h-auto font-medium">
                      {item.jobId}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="font-medium">{item.propertyAddress}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.city}, {item.state}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{item.requestedBy}</TableCell>
                  <TableCell>
                    <Badge variant={statusStyle.variant} className="flex items-center w-fit">
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.assignedAgent ? (
                      <span className="flex items-center">
                        <User className="mr-1 h-4 w-4 text-muted-foreground" />
                        {item.assignedAgent}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center">
                      <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                      {item.timeInQueue}
                    </span>
                  </TableCell>
                  <TableCell>
                    {item.timeSlotRemaining ? (
                      <span className={`flex items-center ${item.timeSlotRemaining.startsWith('1h') ? 'text-orange-600' : ''}`}>
                        <AlertCircle className="mr-1 h-4 w-4" />
                        {item.timeSlotRemaining}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={urgencyStyle.variant} className={urgencyStyle.color}>
                      {item.urgencyLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Main page component
export default function QueueMonitoringPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time view of marking job queue
          </p>
        </div>
        <Button>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Suspense fallback={<QueueStatsLoadingSkeleton />}>
        <QueueStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Queue Overview</CardTitle>
          <CardDescription>
            Monitor and manage property marking job assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Jobs</TabsTrigger>
              <TabsTrigger value="assigned">Assigned</TabsTrigger>
              <TabsTrigger value="unassigned">Awaiting Assignment</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Suspense fallback={<TableLoadingSkeleton />}>
                <QueueTable status="all" />
              </Suspense>
            </TabsContent>

            <TabsContent value="assigned" className="space-y-4">
              <Suspense fallback={<TableLoadingSkeleton />}>
                <QueueTable status="assigned" />
              </Suspense>
            </TabsContent>

            <TabsContent value="unassigned" className="space-y-4">
              <Suspense fallback={<TableLoadingSkeleton />}>
                <QueueTable status="unassigned" />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeletons
function QueueStatsLoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableLoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}