"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, Search, Clock, XCircle } from "lucide-react";
import { getQueueStatus, clearExpiredLocks, manualUnlock } from "@/lib/api/queue";

interface QueueItem {
  id: string;
  propertyId: string;
  unitId?: string;
  userId: string;
  userName: string;
  userEmail: string;
  propertyTitle: string;
  unitNumber?: string;
  amount: number;
  status: "ACTIVE" | "PROCESSING" | "EXPIRED" | "COMPLETED" | "FAILED";
  lockAcquiredAt: Date;
  lockExpiresAt: Date;
  position: number;
  estimatedWaitTime?: number;
}

interface QueueStats {
  totalInQueue: number;
  activePayments: number;
  expiredLocks: number;
  averageWaitTime: number;
  successRate: number;
}

export default function QueueManager() {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  const fetchQueueData = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await getQueueStatus();
      setQueueItems(data.queueItems);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch queue data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchQueueData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleClearExpired = async () => {
    try {
      setError(null);
      await clearExpiredLocks();
      await fetchQueueData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear expired locks");
    }
  };

  const handleManualUnlock = async (propertyId: string, unitId?: string) => {
    if (!confirm("Are you sure you want to manually unlock this property/unit?")) {
      return;
    }

    try {
      setError(null);
      await manualUnlock(propertyId, unitId);
      await fetchQueueData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unlock property");
    }
  };

  const filteredItems = queueItems.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: QueueItem["status"]) => {
    const variants: Record<QueueItem["status"], { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      ACTIVE: { variant: "default", label: "Active" },
      PROCESSING: { variant: "secondary", label: "Processing" },
      EXPIRED: { variant: "destructive", label: "Expired" },
      COMPLETED: { variant: "outline", label: "Completed" },
      FAILED: { variant: "destructive", label: "Failed" },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const diff = new Date(expiresAt).getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total in Queue</CardDescription>
              <CardTitle className="text-3xl">{stats.totalInQueue}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Payments</CardDescription>
              <CardTitle className="text-3xl">{stats.activePayments}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Expired Locks</CardDescription>
              <CardTitle className="text-3xl text-destructive">
                {stats.expiredLocks}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Wait Time</CardDescription>
              <CardTitle className="text-3xl">
                {Math.round(stats.averageWaitTime)}s
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Success Rate</CardDescription>
              <CardTitle className="text-3xl">
                {stats.successRate.toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Queue Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Queue</CardTitle>
              <CardDescription>
                Monitor and manage payment processing queue
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearExpired}
                disabled={refreshing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Clear Expired
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchQueueData}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by property, user name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Queue Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Remaining</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No items in queue
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        #{item.position}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {item.propertyTitle}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.unitNumber || "—"}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.userEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>₦{item.amount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className={
                            new Date(item.lockExpiresAt) < new Date()
                              ? "text-destructive"
                              : ""
                          }>
                            {formatTimeRemaining(item.lockExpiresAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(item.status === "ACTIVE" || item.status === "EXPIRED") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManualUnlock(item.propertyId, item.unitId)}
                          >
                            Unlock
                          </Button>
                        )}
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