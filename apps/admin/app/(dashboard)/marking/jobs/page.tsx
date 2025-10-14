// apps/admin/src/app/(dashboard)/marking/jobs/page.tsx
import { Suspense } from 'react';
import { MarkingJobTable } from '@/components/marking/MarkingJobTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Filter, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SearchParams {
  status?: string;
  urgency?: string;
  search?: string;
  page?: string;
}

async function getMarkingJobs(params: SearchParams) {
  // TODO: Replace with actual API call
  return {
    jobs: [
      {
        id: 'job-1',
        propertyId: 'prop-1',
        propertyTitle: '3 Bedroom Flat, Lekki Phase 1',
        requestedBy: 'John Doe',
        requestedByPhone: '+234 801 234 5678',
        assignedAgent: 'Agent Smith',
        status: 'IN_PROGRESS',
        urgencyLevel: 'NORMAL',
        markingFee: 20000,
        paymentStatus: 'SUCCESS',
        contactPersonName: 'Jane Doe',
        contactPersonPhone: '+234 802 345 6789',
        assignedAt: new Date('2024-10-10'),
        timeSlotExpiry: new Date('2024-10-15'),
        queuePosition: null,
        createdAt: new Date('2024-10-10')
      }
    ],
    pagination: {
      total: 156,
      page: 1,
      pageSize: 20,
      totalPages: 8
    }
  };
}

async function MarkingJobsContent({ params }: { params: SearchParams }) {
  const data = await getMarkingJobs(params);

  return (
    <div className="space-y-4">
      <MarkingJobTable jobs={data.jobs} pagination={data.pagination} />
    </div>
  );
}

export default function MarkingJobsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marking Jobs</h2>
          <p className="text-muted-foreground">
            Manage all property marking requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find specific marking jobs by status, urgency, or search term
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by property, owner, or agent..."
                  className="pl-8"
                  defaultValue={searchParams.search}
                />
              </div>
            </div>
            <Select defaultValue={searchParams.status || 'all'}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="QUEUED">Queued</SelectItem>
                <SelectItem value="ASSIGNED">Assigned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={searchParams.urgency || 'all'}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgency</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={<div>Loading jobs...</div>}>
        <MarkingJobsContent params={searchParams} />
      </Suspense>
    </div>
  );
}