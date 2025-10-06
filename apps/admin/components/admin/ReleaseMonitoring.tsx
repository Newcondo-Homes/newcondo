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
import { Clock, AlertCircle, CheckCircle, XCircle, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PaymentRelease {
  id: string;
  rentalId: string;
  propertyTitle: string;
  unitNumber?: string;
  amount: number;
  confirmationPeriodEnd: string;
  isReleased: boolean;
  releasedAt?: string;
  status: "PENDING" | "READY" | "RELEASED" | "FAILED";
  renterName: string;
  ownerName: string;
  agentName?: string;
  subAgentName?: string;
  createdAt: string;
}

interface ReleaseStats {
  pendingReleases: number;
  readyForRelease: number;
  releasedToday: number;
  totalHeldAmount: number;
  totalReleasedToday: number;
}

export default function ReleaseMonitoring() {
  const [releases, setReleases] = useState<PaymentRelease[]>([]);
  const [stats, setStats] = useState<ReleaseStats>({
    pendingReleases: 0,
    readyForRelease: 0,
    releasedToday: 0,
    totalHeldAmount: 0,
    totalReleasedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchReleaseData();
  }, [filter, page]);

  const fetchReleaseData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/payments/releases?filter=${filter}&page=${page}&search=${searchTerm}`
      );
      const data = await response.json();
      
      setReleases(data.releases);
      setStats(data.stats);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching release data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRelease = async (paymentId: string) => {
    if (!confirm("Are you sure you want to manually trigger this release?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/payments/releases/${paymentId}/manual`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Payment release initiated successfully");
        fetchReleaseData();
      } else {
        const error = await response.json();
        alert(`Failed to release payment: ${error.message}`);
      }
    } catch (error) {
      console.error("Error releasing payment:", error);
      alert("An error occurred while releasing the payment");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      PENDING: "secondary",
      READY: "default",
      RELEASED: "outline",
      FAILED: "destructive",
    };

    const icons = {
      PENDING: <Clock className="w-3 h-3 mr-1" />,
      READY: <AlertCircle className="w-3 h-3 mr-1" />,
      RELEASED: <CheckCircle className="w-3 h-3 mr-1" />,
      FAILED: <XCircle className="w-3 h-3 mr-1" />,
    };

    return (
      <Badge variant={variants[status]} className="flex items-center w-fit">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const getTimeUntilRelease = (confirmationEnd: string) => {
    const now = new Date();
    const endDate = new Date(confirmationEnd);
    
    if (now > endDate) {
      return "Ready for release";
    }
    
    return `Releases in ${formatDistanceToNow(endDate)}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Releases
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReleases}</div>
            <p className="text-xs text-muted-foreground">
              In confirmation period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ready for Release
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.readyForRelease}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting automated release
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Released Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.releasedToday}</div>
            <p className="text-xs text-muted-foreground">
              Successful releases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Held
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalHeldAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              In escrow
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Released Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalReleasedToday)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total amount
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Release Monitoring Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Release Monitoring</CardTitle>
          <CardDescription>
            Track and manage payment releases after confirmation periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by property, renter, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchReleaseData()}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="ready">Ready for Release</SelectItem>
                <SelectItem value="released">Released</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading release data...</div>
          ) : releases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment releases found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Renter</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Agent(s)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Release Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {releases.map((release) => (
                    <TableRow key={release.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{release.propertyTitle}</div>
                          {release.unitNumber && (
                            <div className="text-sm text-muted-foreground">
                              Unit {release.unitNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(release.amount)}
                      </TableCell>
                      <TableCell>{release.renterName}</TableCell>
                      <TableCell>{release.ownerName}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {release.agentName && (
                            <div>Listing: {release.agentName}</div>
                          )}
                          {release.subAgentName && (
                            <div className="text-muted-foreground">
                              Sub: {release.subAgentName}
                            </div>
                          )}
                          {!release.agentName && !release.subAgentName && (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(release.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {release.isReleased && release.releasedAt ? (
                            <span className="text-green-600">
                              Released {formatDistanceToNow(new Date(release.releasedAt))} ago
                            </span>
                          ) : (
                            <span className={
                              release.status === "READY" 
                                ? "text-orange-600" 
                                : "text-muted-foreground"
                            }>
                              {getTimeUntilRelease(release.confirmationPeriodEnd)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {release.status === "READY" && !release.isReleased && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleManualRelease(release.id)}
                          >
                            Release Now
                          </Button>
                        )}
                        {release.status === "FAILED" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleManualRelease(release.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}