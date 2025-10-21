"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  Search,
  Filter,
  Award,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface AgentPerformance {
  id: string;
  name: string;
  email: string;
  phone: string;
  image?: string;
  reliabilityScore: number;
  totalJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  averageCompletionTime: number; // in hours
  onTimeCompletionRate: number; // percentage
  isAvailable: boolean;
  serviceAreas: string[];
  joinedDate: string;
  lastActiveDate: string;
  totalEarnings: number;
  pendingEarnings: number;
  performance: {
    thisMonth: number;
    lastMonth: number;
    trend: "up" | "down" | "stable";
  };
}

interface PerformanceStats {
  totalAgents: number;
  activeAgents: number;
  topPerformers: number;
  lowPerformers: number;
  averageReliability: number;
  averageCompletionRate: number;
}

export default function AgentPerformancePage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentPerformance[]>([]);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("reliabilityScore");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPerformance, setFilterPerformance] = useState<string>("all");

  useEffect(() => {
    fetchAgentPerformance();
  }, [sortBy, filterStatus, filterPerformance]);

  const fetchAgentPerformance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sortBy,
        status: filterStatus,
        performance: filterPerformance,
      });

      const response = await fetch(
        `/api/admin/marking-oversight/agents?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch agent performance");

      const data = await response.json();
      setAgents(data.agents);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching agent performance:", error);
      toast.error("Failed to load agent performance data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (agentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(
        `/api/admin/marking-oversight/agents/${agentId}/availability`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
          body: JSON.stringify({ isAvailable: !currentStatus }),
        }
      );

      if (!response.ok) throw new Error("Failed to update availability");

      toast.success("Agent availability updated");
      fetchAgentPerformance();
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Failed to update agent availability");
    }
  };

  const handleSuspendAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to suspend this agent?")) return;

    try {
      const response = await fetch(
        `/api/admin/marking-oversight/agents/${agentId}/suspend`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to suspend agent");

      toast.success("Agent suspended successfully");
      fetchAgentPerformance();
    } catch (error) {
      console.error("Error suspending agent:", error);
      toast.error("Failed to suspend agent");
    }
  };

  const getReliabilityBadge = (score: number) => {
    if (score >= 4.5) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 4.0) return <Badge className="bg-blue-600">Good</Badge>;
    if (score >= 3.5) return <Badge className="bg-yellow-600">Average</Badge>;
    return <Badge className="bg-red-600">Poor</Badge>;
  };

  const getPerformanceTrend = (trend: "up" | "down" | "stable") => {
    if (trend === "up")
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === "down")
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4 border-t-2 border-gray-400" />;
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading agent performance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Agent Performance</h1>
          <p className="text-muted-foreground">
            Monitor and manage marking agent performance metrics
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAgents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeAgents} currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.topPerformers}</div>
              <p className="text-xs text-muted-foreground">
                Reliability score ≥ 4.5
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Reliability
              </CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageReliability.toFixed(2)}
              </div>
              <Progress value={stats.averageReliability * 20} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageCompletionRate.toFixed(1)}%
              </div>
              <Progress value={stats.averageCompletionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Agent List</CardTitle>
          <CardDescription>
            View and manage all marking agents and their performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPerformance} onValueChange={setFilterPerformance}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="excellent">Excellent (≥4.5)</SelectItem>
                <SelectItem value="good">Good (4.0-4.5)</SelectItem>
                <SelectItem value="average">Average (3.5-4.0)</SelectItem>
                <SelectItem value="poor">Poor (&lt;3.5)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reliabilityScore">Reliability Score</SelectItem>
                <SelectItem value="totalJobs">Total Jobs</SelectItem>
                <SelectItem value="completedJobs">Completed Jobs</SelectItem>
                <SelectItem value="earnings">Total Earnings</SelectItem>
                <SelectItem value="joinedDate">Joined Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Reliability</TableHead>
                  <TableHead>Jobs</TableHead>
                  <TableHead>Completion Rate</TableHead>
                  <TableHead>Avg Time</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No agents found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={agent.image} />
                            <AvatarFallback>
                              {agent.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {agent.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">
                            {agent.reliabilityScore.toFixed(2)}
                          </span>
                          {getReliabilityBadge(agent.reliabilityScore)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{agent.totalJobs}</div>
                          <div className="text-sm text-muted-foreground">
                            {agent.completedJobs} completed
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {agent.onTimeCompletionRate.toFixed(1)}%
                          </div>
                          <Progress
                            value={agent.onTimeCompletionRate}
                            className="h-2 w-16"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{agent.averageCompletionTime.toFixed(1)}h</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            ₦{agent.totalEarnings.toLocaleString()}
                          </div>
                          {agent.pendingEarnings > 0 && (
                            <div className="text-sm text-yellow-600">
                              ₦{agent.pendingEarnings.toLocaleString()} pending
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPerformanceTrend(agent.performance.trend)}
                          <span className="text-sm">
                            {agent.performance.thisMonth} this month
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.isAvailable ? (
                          <Badge className="bg-green-600">Available</Badge>
                        ) : (
                          <Badge variant="secondary">Unavailable</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/agents/${agent.id}`)}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleToggleAvailability(
                                  agent.id,
                                  agent.isAvailable
                                )
                              }
                            >
                              {agent.isAvailable
                                ? "Mark Unavailable"
                                : "Mark Available"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/marking-oversight/jobs?agentId=${agent.id}`)}
                            >
                              View Jobs
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleSuspendAgent(agent.id)}
                            >
                              Suspend Agent
                            </DropdownMenuItem>
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