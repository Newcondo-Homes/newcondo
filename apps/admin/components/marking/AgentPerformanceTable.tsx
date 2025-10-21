'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreVertical,
  TrendingUp,
  TrendingDown,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  Eye,
  Ban,
  Award,
} from 'lucide-react';

interface AgentPerformance {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  reliabilityScore: number;
  totalJobsAssigned: number;
  completedJobs: number;
  cancelledJobs: number;
  expiredJobs: number;
  avgCompletionTime: number; // in hours
  successRate: number;
  currentQueuePosition?: number;
  isAvailableForMarking: boolean;
  serviceAreas: string[];
  lastActive: string;
  totalEarnings: number;
  pendingEarnings: number;
  performanceTrend: 'up' | 'down' | 'stable';
  warnings: number;
  suspensions: number;
  createdAt: string;
}

interface AgentPerformanceTableProps {
  agents: AgentPerformance[];
  isLoading?: boolean;
  onViewDetails: (agentId: string) => void;
  onSuspendAgent: (agentId: string) => void;
  onActivateAgent: (agentId: string) => void;
  onRewardAgent: (agentId: string) => void;
}

type SortField = 'name' | 'reliabilityScore' | 'completedJobs' | 'successRate' | 'earnings';
type SortDirection = 'asc' | 'desc';

export default function AgentPerformanceTable({
  agents,
  isLoading = false,
  onViewDetails,
  onSuspendAgent,
  onActivateAgent,
  onRewardAgent,
}: AgentPerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortField, setSortField] = useState<SortField>('reliabilityScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter and sort agents
  const filteredAndSortedAgents = useMemo(() => {
    let filtered = agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.phone.includes(searchTerm);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && agent.isAvailableForMarking) ||
        (statusFilter === 'inactive' && !agent.isAvailableForMarking);

      const matchesPerformance =
        performanceFilter === 'all' ||
        (performanceFilter === 'high' && agent.reliabilityScore >= 4.0) ||
        (performanceFilter === 'medium' && agent.reliabilityScore >= 3.0 && agent.reliabilityScore < 4.0) ||
        (performanceFilter === 'low' && agent.reliabilityScore < 3.0);

      return matchesSearch && matchesStatus && matchesPerformance;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'reliabilityScore':
          aValue = a.reliabilityScore;
          bValue = b.reliabilityScore;
          break;
        case 'completedJobs':
          aValue = a.completedJobs;
          bValue = b.completedJobs;
          break;
        case 'successRate':
          aValue = a.successRate;
          bValue = b.successRate;
          break;
        case 'earnings':
          aValue = a.totalEarnings;
          bValue = b.totalEarnings;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (typeof aValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue);
      }

      return sortDirection === 'asc' ? aValue - (bValue as number) : (bValue as number) - aValue;
    });

    return filtered;
  }, [agents, searchTerm, statusFilter, performanceFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getReliabilityBadge = (score: number) => {
    if (score >= 4.5) return <Badge className="bg-green-500">Excellent</Badge>;
    if (score >= 4.0) return <Badge className="bg-blue-500">Very Good</Badge>;
    if (score >= 3.5) return <Badge className="bg-yellow-500">Good</Badge>;
    if (score >= 3.0) return <Badge className="bg-orange-500">Fair</Badge>;
    return <Badge className="bg-red-500">Poor</Badge>;
  };

  const getPerformanceTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const activeAgents = agents.filter((a) => a.isAvailableForMarking).length;
    const avgReliability =
      agents.reduce((sum, a) => sum + a.reliabilityScore, 0) / agents.length || 0;
    const totalJobs = agents.reduce((sum, a) => sum + a.completedJobs, 0);
    const avgSuccessRate =
      agents.reduce((sum, a) => sum + a.successRate, 0) / agents.length || 0;

    return {
      activeAgents,
      avgReliability: avgReliability.toFixed(2),
      totalJobs,
      avgSuccessRate: avgSuccessRate.toFixed(1),
    };
  }, [agents]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Metrics</CardTitle>
          <CardDescription>Loading agent data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Agent Performance Metrics</CardTitle>
            <CardDescription>
              Monitor and manage agent performance across all marking jobs
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm">
              <Star className="mr-1 h-3 w-3" />
              Avg Score: {summaryStats.avgReliability}
            </Badge>
            <Badge variant="outline" className="text-sm">
              <CheckCircle className="mr-1 h-3 w-3" />
              {summaryStats.totalJobs} Total Jobs
            </Badge>
            <Badge variant="outline" className="text-sm">
              <TrendingUp className="mr-1 h-3 w-3" />
              {summaryStats.avgSuccessRate}% Success Rate
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={performanceFilter} onValueChange={(v: any) => setPerformanceFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Performance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Performance</SelectItem>
              <SelectItem value="high">High (4.0+)</SelectItem>
              <SelectItem value="medium">Medium (3.0-4.0)</SelectItem>
              <SelectItem value="low">Low (&lt;3.0)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('reliabilityScore')}
                    className="flex items-center gap-1 -ml-3"
                  >
                    Reliability
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('completedJobs')}
                    className="flex items-center gap-1 -ml-3"
                  >
                    Jobs
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('successRate')}
                    className="flex items-center gap-1 -ml-3"
                  >
                    Success Rate
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Avg Time</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('earnings')}
                    className="flex items-center gap-1 -ml-3"
                  >
                    Earnings
                    <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No agents found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedAgents.map((agent) => (
                  <TableRow key={agent.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold">
                          {agent.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-sm text-muted-foreground">{agent.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold">{agent.reliabilityScore.toFixed(2)}</span>
                        </div>
                        {getReliabilityBadge(agent.reliabilityScore)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{agent.completedJobs} completed</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <XCircle className="h-3 w-3 text-red-500" />
                          <span>{agent.cancelledJobs} cancelled</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold">{agent.successRate.toFixed(1)}%</div>
                        {getPerformanceTrendIcon(agent.performanceTrend)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{formatTime(agent.avgCompletionTime)}</div>
                        {agent.warnings > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            {agent.warnings} warnings
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{formatTime(agent.avgCompletionTime)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold">{formatCurrency(agent.totalEarnings)}</div>
                        {agent.pendingEarnings > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {formatCurrency(agent.pendingEarnings)} pending
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {agent.isAvailableForMarking ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Ban className="mr-1 h-3 w-3" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onViewDetails(agent.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRewardAgent(agent.id)}>
                            <Award className="mr-2 h-4 w-4" />
                            Send Reward
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {agent.isAvailableForMarking ? (
                            <DropdownMenuItem
                              onClick={() => onSuspendAgent(agent.id)}
                              className="text-red-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend Agent
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => onActivateAgent(agent.id)}>
                              <CheckCircle className="mr-2 h-4 w-4" />
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

        {/* Pagination info */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {filteredAndSortedAgents.length} of {agents.length} agents
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>{summaryStats.activeAgents} Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-400" />
              <span>{agents.length - summaryStats.activeAgents} Inactive</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}