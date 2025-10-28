"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Badge } from "@newcondo/ui/components/badge";
import { Input } from "@newcondo/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@newcondo/ui/components/select";
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  MapPin,
  Building2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newcondo/ui/components/table";

interface DuplicateReport {
  id: string;
  originalPropertyId: string;
  duplicatePropertyId: string;
  reportedBy: string | null;
  status: "PENDING" | "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE" | "RESOLVED";
  createdAt: string;
  originalProperty: {
    title: string;
    address: string;
    city: string;
    state: string;
    owner: {
      name: string;
      email: string;
    };
  };
  duplicateProperty: {
    title: string;
    address: string;
    city: string;
    state: string;
    owner: {
      name: string;
      email: string;
    };
  };
  reporter?: {
    name: string;
    email: string;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function DuplicatesPage() {
  const router = useRouter();
  const [duplicates, setDuplicates] = useState<DuplicateReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  useEffect(() => {
    fetchDuplicates();
  }, [pagination.page, statusFilter]);

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const res = await fetch(`/api/admin/duplicates?${params}`);
      if (!res.ok) throw new Error("Failed to fetch duplicates");
      
      const data = await res.json();
      setDuplicates(data.duplicates);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching duplicates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchDuplicates();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "CONFIRMED_DUPLICATE":
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case "NOT_DUPLICATE":
        return <Badge variant="secondary"><XCircle className="h-3 w-3 mr-1" />Not Duplicate</Badge>;
      case "RESOLVED":
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleViewDetails = (duplicateId: string) => {
    router.push(`/duplicates/${duplicateId}`);
  };

  const stats = {
    pending: duplicates.filter((d) => d.status === "PENDING").length,
    confirmed: duplicates.filter((d) => d.status === "CONFIRMED_DUPLICATE").length,
    resolved: duplicates.filter((d) => d.status === "RESOLVED").length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Duplicate Property Reports</h1>
        <p className="text-muted-foreground">
          Review and manage duplicate property listings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting admin action
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Duplicates</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
            <p className="text-xs text-muted-foreground">
              Verified as duplicates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">
              Successfully handled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address, owner, or property title..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED_DUPLICATE">Confirmed</SelectItem>
                <SelectItem value="NOT_DUPLICATE">Not Duplicate</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Duplicates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Reports ({pagination.total})</CardTitle>
          <CardDescription>
            Review potential duplicate property listings and take action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : duplicates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No duplicate reports found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Original Property</TableHead>
                    <TableHead>Duplicate Property</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {duplicates.map((duplicate) => (
                    <TableRow key={duplicate.id}>
                      <TableCell>{getStatusBadge(duplicate.status)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{duplicate.originalProperty.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {duplicate.originalProperty.owner.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{duplicate.duplicateProperty.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {duplicate.duplicateProperty.owner.name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {duplicate.originalProperty.city}, {duplicate.originalProperty.state}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(duplicate.createdAt).toLocaleDateString()}
                          {duplicate.reporter && (
                            <p className="text-xs text-muted-foreground">
                              by {duplicate.reporter.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(duplicate.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} results
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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