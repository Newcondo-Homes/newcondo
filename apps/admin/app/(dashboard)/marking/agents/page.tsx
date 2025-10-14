// apps/admin/src/app/(dashboard)/marking/agents/page.tsx
import { Suspense } from 'react';
import { AgentPerformanceTable } from '@/components/marking/AgentPerformanceTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Filter, Search, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SearchParams {
  availability?: string;
  rating?: string;
  search?: string;
  page?: string;
}

async function getAgents(params: SearchParams) {
  // TODO: Replace with actual API call
  return {
    agents: [
      {
        id: 'agent-1',
        name: 'Agent Smith',
        email: 'agent@example.com',
        phone: '+234 802 345 6789',
        isAvailableForMarking: true,
        agentServiceAreas: ['Lekki', 'Victoria Island', 'Ikoyi'],
        agentReliabilityScore: 4.8,
        totalMarkingJobs: 50,
        completedMarkingJobs: 45,
        activeJobs: 2,
        avgCompletionTime: '2.1 hours',
        successRate: 90,
        totalEarnings: 450000,
        joinedAt: new Date('2024-01-15'),
        lastActive: new Date('2024-10-14')
      }
    ],
    pagination: {
      total: 45,
      page: 1,
      pageSize: 20,
      totalPages: 3
    },
    stats: {
      totalAgents: 45,
      activeAgents: 32,
      avgRating: 4.6,
      totalJobsCompleted: 1234
    }
  };
}

async function AgentsContent({ params }: { params: SearchParams }) {
  const data = await getAgents(params);

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.activeAgents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.avgRating}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Jobs Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalJobsCompleted}</div>
          </CardContent>
        </Card>
      </div>

      <AgentPerformanceTable agents={data.agents} pagination={data.pagination} />
    </div>
  );
}

export default function AgentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Marking Agents</h2>
          <p className="text-muted-foreground">
            Manage agents available for property marking
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
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Agent
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Find agents by name, availability, or rating
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-8"
                  defaultValue={searchParams.search}
                />
              </div>
            </div>
            <Select defaultValue={searchParams.availability || 'all'}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue={searchParams.rating || 'all'}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4+ Stars</SelectItem>
                <SelectItem value="3">3+ Stars</SelectItem>
                <SelectItem value="below3">Below 3 Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={<div>Loading agents...</div>}>
        <AgentsContent params={searchParams} />
      </Suspense>
    </div>
  );
}