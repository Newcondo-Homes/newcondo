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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  RefreshCw,
  Search,
  Eye,
  Download,
  Filter,
  Calendar,
} from "lucide-react";
import { getPaymentAttempts, exportAttemptLogs } from "@/lib/api/conflicts";
import { format } from "date-fns";

interface PaymentAttempt {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  propertyId: string;
  propertyTitle: string;
  unitId?: string;
  unitNumber?: string;
  amount: number;
  status: "LOCKED" | "SUCCESS" | "FAILED" | "TIMEOUT";
  failureReason?: string;
  lockAcquired: boolean;
  lockDuration?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

interface AttemptStats {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  timeoutAttempts: number;
  averageLockDuration: number;
  conflictRate: number;
}

export default function AttemptLogViewer() {
  const [attempts, setAttempts] = useState<PaymentAttempt[]>([]);
  const [stats, setStats] = useState<AttemptStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7d");
  const [selectedAttempt, setSelectedAttempt] = useState<PaymentAttempt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const fetchAttempts = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await getPaymentAttempts({
        dateRange,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setAttempts(data.attempts);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch attempt logs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, [statusFilter, dateRange]);

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);
      await exportAttemptLogs({
        dateRange,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export logs");
    } finally {
      setExporting(false);
    }
  };

  const filteredAttempts = attempts.filter((attempt) => {
    const matchesSearch =
      searchTerm === "" ||
      attempt.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attempt.userEmail.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadge = (status: PaymentAttempt["status"]) => {
    const variants: Record<PaymentAttempt["status"], { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      LOCKED: { variant: "secondary", label: "Locked" },
      SUCCESS: { variant: "default", label: "Success" },
      FAILED: { variant: "destructive", label: "Failed" },
      TIMEOUT: { variant: "outline", label: "Timeout" },
    };

    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Attempts</CardDescription>
              <CardTitle className="text-3xl">{stats.totalAttempts}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Successful</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {stats.successfulAttempts}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed</CardDescription>
              <CardTitle className="text-3xl text-destructive">
                {stats.failedAttempts}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Timeouts</CardDescription>
              <CardTitle className="text-3xl text-orange-600">
                {stats.timeoutAttempts}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Avg Lock Time</CardDescription>
              <CardTitle className="text-3xl">
                {Math.round(stats.averageLockDuration)}ms
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Conflict Rate</CardDescription>
              <CardTitle className="text-3xl">
                {stats.conflictRate.toFixed(1)}%
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Attempt Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Attempt Logs</CardTitle>
              <CardDescription>
                Detailed logs of all payment attempts and conflicts
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAttempts}
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
                <SelectItem value="LOCKED">Locked</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="TIMEOUT">Timeout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attempts Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lock Acquired</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttempts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No attempt logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttempts.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(attempt.createdAt), "MMM dd, HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{attempt.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {attempt.userEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {attempt.propertyTitle}
                        </div>
                      </TableCell>
                      <TableCell>
                        {attempt.unitNumber || "—"}
                      </TableCell>
                      <TableCell>₦{attempt.amount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(attempt.status)}</TableCell>
                      <TableCell>
                        <Badge variant={attempt.lockAcquired ? "default" : "destructive"}>
                          {attempt.lockAcquired ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {attempt.lockDuration ? `${attempt.lockDuration}ms` : "—"}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAttempt(attempt)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Attempt Details Dialog */}
      <Dialog open={!!selectedAttempt} onOpenChange={() => setSelectedAttempt(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Attempt Details</DialogTitle>
            <DialogDescription>
              Detailed information about this payment attempt
            </DialogDescription>
          </DialogHeader>
          {selectedAttempt && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">User</h4>
                  <p className="text-sm">{selectedAttempt.userName}</p>
                  <p className="text-xs text-muted-foreground">{selectedAttempt.userEmail}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Property</h4>
                  <p className="text-sm">{selectedAttempt.propertyTitle}</p>
                  {selectedAttempt.unitNumber && (
                    <p className="text-xs text-muted-foreground">Unit: {selectedAttempt.unitNumber}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Amount</h4>
                  <p className="text-sm font-medium">₦{selectedAttempt.amount.toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                  {getStatusBadge(selectedAttempt.status)}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Lock Acquired</h4>
                  <p className="text-sm">{selectedAttempt.lockAcquired ? "Yes" : "No"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Lock Duration</h4>
                  <p className="text-sm">
                    {selectedAttempt.lockDuration ? `${selectedAttempt.lockDuration}ms` : "N/A"}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">IP Address</h4>
                  <p className="text-sm font-mono">{selectedAttempt.ipAddress || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Timestamp</h4>
                  <p className="text-sm">
                    {format(new Date(selectedAttempt.createdAt), "PPpp")}
                  </p>
                </div>
              </div>
              {selectedAttempt.failureReason && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Failure Reason</h4>
                  <Alert variant="destructive">
                    <AlertDescription>{selectedAttempt.failureReason}</AlertDescription>
                  </Alert>
                </div>
              )}
              {selectedAttempt.userAgent && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">User Agent</h4>
                  <p className="text-xs font-mono bg-muted p-2 rounded">
                    {selectedAttempt.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}