// apps/admin/src/components/admin/AgentPerformanceTable.tsx
"use client";

import { useState } from "react";
import { 
  Search, 
  TrendingUp, 
  TrendingDown,
  Star,
  Award,
  Clock
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newcondo/ui/table";
import { Input } from "@newcondo/ui/input";
import { Badge } from "@newcondo/ui/badge";
import { Progress } from "@newcondo/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/select";
import type { AgentPerformanceMetrics } from "@/types/admin";

interface AgentPerformanceTableProps {
  metrics: AgentPerformanceMetrics[];
}

export default function AgentPerformanceTable({ metrics }: AgentPerformanceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"reliability" | "jobs" | "avgTime">("reliability");

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < Math.floor(rating) 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">
          ({rating.toFixed(2)})
        </span>
      </div>
    );
  };

  const getPerformanceBadge = (completionRate: number) => {
    if (completionRate >= 90) return <Badge variant="default">Excellent</Badge>;
    if (completionRate >= 75) return <Badge variant="secondary">Good</Badge>;
    if (completionRate >= 60) return <Badge variant="outline">Average</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const filteredMetrics = metrics
    .filter(agent =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "reliability") {
        return (b.reliabilityScore || 0) - (a.reliabilityScore || 0);
      } else if (sortBy === "jobs") {
        return b.completedJobs - a.completedJobs;
      } else {
        return a.avgCompletionTime - b.avgCompletionTime;
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
        <CardDescription>
          Track and monitor marking agent performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search and Sort */}
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reliability">Reliability Score</SelectItem>
              <SelectItem value="jobs">Completed Jobs</SelectItem>
              <SelectItem value="avgTime">Avg. Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Top Performers */}
        {filteredMetrics.length > 0 && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              Top Performers
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {filteredMetrics.slice(0, 3).map((agent, index) => (
                <div key={agent.id} className="flex items-center gap-2">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center font-bold
                    ${index === 0 ? 'bg-yellow-100 text-yellow-700' : ''}
                    ${index === 1 ? 'bg-gray-100 text-gray-700' : ''}
                    ${index === 2 ? 'bg-orange-100 text-orange-700' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.completedJobs} jobs • {agent.reliabilityScore?.toFixed(2)}/5.00
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Reliability</TableHead>
                <TableHead>Total Jobs</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>Avg. Time</TableHead>
                <TableHead>Service Areas</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMetrics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">No agents found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMetrics.map((agent) => {
                  const completionRate = agent.totalJobs > 0 
                    ? (agent.completedJobs / agent.totalJobs) * 100 
                    : 0;

                  return (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{agent.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {agent.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.reliabilityScore 
                          ? getRatingStars(agent.reliabilityScore)
                          : <span className="text-muted-foreground">N/A</span>
                        }
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{agent.totalJobs}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{agent.completedJobs}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {getPerformanceBadge(completionRate)}
                            <span className="text-sm font-medium">
                              {completionRate.toFixed(1)}%
                            </span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {agent.avgCompletionTime.toFixed(1)}h
                          </span>
                          {agent.avgCompletionTimeTrend && (
                            agent.avgCompletionTimeTrend > 0 ? (
                              <TrendingUp className="w-4 h-4 text-red-500" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-green-500" />
                            )
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {agent.serviceAreas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {agent.serviceAreas.slice(0, 2).map((area, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                            {agent.serviceAreas.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{agent.serviceAreas.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.isAvailable ? "default" : "secondary"}>
                          {agent.isAvailable ? "Available" : "Unavailable"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        {filteredMetrics.length > 0 && (
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Agents</p>
              <p className="text-2xl font-bold">{filteredMetrics.length}</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Avg. Reliability</p>
              <p className="text-2xl font-bold">
                {(
                  filteredMetrics.reduce((sum, a) => sum + (a.reliabilityScore || 0), 0) /
                  filteredMetrics.filter(a => a.reliabilityScore).length
                ).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Jobs</p>
              <p className="text-2xl font-bold">
                {filteredMetrics.reduce((sum, a) => sum + a.totalJobs, 0)}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Avg. Completion</p>
              <p className="text-2xl font-bold">
                {(
                  filteredMetrics.reduce((sum, a) => sum + a.avgCompletionTime, 0) /
                  filteredMetrics.length
                ).toFixed(1)}h
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}