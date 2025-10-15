// apps/admin/src/components/marking/AgentPerformanceTable.tsx

'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Star,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  Search,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface AgentPerformance {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalJobs: number;
  completedJobs: number;
  completionRate: number;
  avgCompletionTime: number; // in hours
  reliabilityScore: number;
  totalEarnings: number;
  successfulMarkings: number;
  failedMarkings: number;
  averageRating: number;
  onTimeCompletions: number;
  lateCompletions: number;
  cancelledJobs: number;
  serviceAreas: string[];
  isAvailableForMarking: boolean;
  lastJobDate: string;
  status: 'active' | 'inactive' | 'suspended';
  joinedDate: string;
}

interface AgentPerformanceTableProps {
  initialData?: AgentPerformance[];
}

export default function AgentPerformanceTable({
  initialData = [],
}: AgentPerformanceTableProps) {
  const [agents, setAgents] = useState<AgentPerformance[]>(initialData);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'completionRate' | 'earnings' | 'jobs' | 'rating'>('completionRate');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  const mockAgents: AgentPerformance[] = [
    {
      id: '1',
      name: 'Adebayo Johnson',
      email: 'adebayo@example.com',
      phone: '+234 801 234 5678',
      totalJobs: 45,
      completedJobs: 42,
      completionRate: 93.3,
      avgCompletionTime: 2.5,
      reliabilityScore: 4.7,
      totalEarnings: 210000,
      successfulMarkings: 42,
      failedMarkings: 3,
      averageRating: 4.7,
      onTimeCompletions: 38,
      lateCompletions: 4,
      cancelledJobs: 3,
      serviceAreas: ['Lagos', 'Ikeja', 'Lekki'],
      isAvailableForMarking: true,
      lastJobDate: '2025-10-14T10:30:00',
      status: 'active',
      joinedDate: '2024-06-15T00:00:00',
    },
    {
      id: '2',
      name: 'Chioma Okafor',
      email: 'chioma@example.com',
      phone: '+234 802 345 6789',
      totalJobs: 38,
      completedJobs: 35,
      completionRate: 92.1,
      avgCompletionTime: 2.8,
      reliabilityScore: 4.5,
      totalEarnings: 175000,
      successfulMarkings: 35,
      failedMarkings: 3,
      averageRating: 4.5,
      onTimeCompletions: 32,
      lateCompletions: 3,
      cancelledJobs: 3,
      serviceAreas: ['Abuja', 'Wuse', 'Gwarinpa'],
      isAvailableForMarking: true,
      lastJobDate: '2025-10-13T14:20:00',
      status: 'active',
      joinedDate: '2024-07-20T00:00:00',
    },
    {
      id: '3',
      name: 'Ibrahim Musa',
      email: 'ibrahim@example.com',
      phone: '+234 803 456 7890',
      totalJobs: 52,
      completedJobs: 48,
      completionRate: 92.3,
      avgCompletionTime: 2.3,
      reliabilityScore: 4.8,
      totalEarnings: 240000,
      successfulMarkings: 48,
      failedMarkings: 4,
      averageRating: 4.8,
      onTimeCompletions: 45,
      lateCompletions: 3,
      cancelledJobs: 4,
      serviceAreas: ['Port Harcourt', 'GRA'],
      isAvailableForMarking: false,
      lastJobDate: '2025-10-12T09:15:00',
      status: 'active',
      joinedDate: '2024-05-10T00:00:00',
    },
    {
      id: '4',
      name: 'Fatima Ahmed',
      email: 'fatima@example.com',
      phone: '+234 804 567 8901',
      totalJobs: 28,
      completedJobs: 22,
      completionRate: 78.6,
      avgCompletionTime: 3.5,
      reliabilityScore: 3.8,
      totalEarnings: 110000,
      successfulMarkings: 22,
      failedMarkings: 6,
      averageRating: 3.8,
      onTimeCompletions: 18,
      lateCompletions: 4,
      cancelledJobs: 6,
      serviceAreas: ['Kano', 'Nassarawa'],
      isAvailableForMarking: true,
      lastJobDate: '2025-10-10T16:45:00',
      status: 'inactive',
      joinedDate: '2024-08-05T00:00:00',
    },
    {
      id: '5',
      name: 'Oluwaseun Adeleke',
      email: 'seun@example.com',
      phone: '+234 805 678 9012',
      totalJobs: 15,
      completedJobs: 10,
      completionRate: 66.7,
      avgCompletionTime: 4.2,
      reliabilityScore: 3.2,
      totalEarnings: 50000,
      successfulMarkings: 10,
      failedMarkings: 5,
      averageRating: 3.2,
      onTimeCompletions: 7,
      lateCompletions: 3,
      cancelledJobs: 5,
      serviceAreas: ['Ibadan'],
      isAvailableForMarking: false,
      lastJobDate: '2025-09-28T11:30:00',
      status: 'suspended',
      joinedDate: '2024-09-01T00:00:00',
    },
  ];

  // Use mock data if no initial data
  const displayAgents = agents.length > 0 ? agents : mockAgents;

  // Filter and sort agents
  const filteredAgents = displayAgents
    .filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.phone.includes(searchQuery);
      const matchesStatus = filterStatus === 'all' || agent.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'completionRate':
          return b.completionRate - a.completionRate;
        case 'earnings':
          return b.totalEarnings - a.totalEarnings;
        case 'jobs':
          return b.totalJobs - a.totalJobs;
        case 'rating':
          return b.averageRating - a.averageRating;
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) {
      return (
        <Badge className="bg-green-500 gap-1">
          <TrendingUp className="h-3 w-3" />
          Excellent
        </Badge>
      );
    } else if (rate >= 75) {
      return (
        <Badge className="bg-blue-500 gap-1">
          <TrendingUp className="h-3 w-3" />
          Good
        </Badge>
      );
    } else if (rate >= 60) {
      return (
        <Badge className="bg-yellow-500 gap-1">
          <TrendingDown className="h-3 w-3" />
          Average
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <TrendingDown className="h-3 w-3" />
          Poor
        </Badge>
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSuspendAgent = async (agentId: string) => {
    // API call to suspend agent
    console.log('Suspending agent:', agentId);
  };

  const handleActivateAgent = async (agentId: string) => {
    // API call to activate agent
    console.log('Activating agent:', agentId);
  };

  const handleViewDetails = (agentId: string) => {
    // Navigate to agent details page
    console.log('Viewing agent details:', agentId);
  };

  // Calculate summary statistics
  const totalActiveAgents = filteredAgents.filter((a) => a.status === 'active').length;
  const avgCompletionRate =
    filteredAgents.reduce((sum, a) => sum + a.completionRate, 0) / filteredAgents.length || 0;
  const totalEarnings = filteredAgents.reduce((sum, a) => sum + a.totalEarnings, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveAgents}</div>
            <p className="text-xs text-muted-foreground">
              {filteredAgents.length} total agents
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
            <Award className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            <p className="text-xs text-muted-foreground">Paid to agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAgents[0]?.reliabilityScore.toFixed(1) || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {filteredAgents[0]?.name || 'No data'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completionRate">Completion Rate</SelectItem>
                <SelectItem value="earnings">Total Earnings</SelectItem>
                <SelectItem value="jobs">Total Jobs</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="mt-6 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Completion</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                  <TableHead className="text-right">Avg. Time</TableHead>
                  <TableHead className="text-right">Earnings</TableHead>
                  <TableHead className="text-right">Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No agents found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{agent.name}</span>
                          <span className="text-xs text-muted-foreground">{agent.email}</span>
                          <span className="text-xs text-muted-foreground">{agent.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(agent.status)}
                          {agent.isAvailableForMarking && (
                            <Badge variant="outline" className="text-xs">
                              Available
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{agent.completedJobs}/{agent.totalJobs}</span>
                          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {agent.onTimeCompletions}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-yellow-500" />
                              {agent.lateCompletions}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{agent.completionRate.toFixed(1)}%</span>
                          <span className="text-xs text-muted-foreground">
                            {agent.cancelledJobs} cancelled
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{agent.reliabilityScore.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{agent.avgCompletionTime.toFixed(1)}h</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{formatCurrency(agent.totalEarnings)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {getPerformanceBadge(agent.completionRate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(agent.id)}>
                              View Details
                            </DropdownMenuItem>
                            {agent.status === 'active' && (
                              <DropdownMenuItem onClick={() => handleSuspendAgent(agent.id)}>
                                Suspend Agent
                              </DropdownMenuItem>
                            )}
                            {agent.status === 'suspended' && (
                              <DropdownMenuItem onClick={() => handleActivateAgent(agent.id)}>
                                Activate Agent
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}