"use client";

import { useState } from "react";
import { Badge } from "@newcondo/ui/components/badge";
import { Button } from "@newcondo/ui/components/button";
import { Input } from "@newcondo/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@newcondo/ui/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/components/select";
import { Search, Eye, Filter } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Dispute {
  id: string;
  originalPropertyId: string;
  duplicatePropertyId: string;
  status: "PENDING" | "CONFIRMED_DUPLICATE" | "NOT_DUPLICATE" | "RESOLVED";
  reportedBy?: string;
  reporterName?: string;
  originalPropertyAddress: string;
  duplicatePropertyAddress: string;
  createdAt: string;
}

interface DisputeListProps {
  disputes: Dispute[];
  isLoading?: boolean;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED_DUPLICATE: "bg-red-100 text-red-800",
  NOT_DUPLICATE: "bg-green-100 text-green-800",
  RESOLVED: "bg-blue-100 text-blue-800",
};

const statusLabels = {
  PENDING: "Pending Review",
  CONFIRMED_DUPLICATE: "Confirmed Duplicate",
  NOT_DUPLICATE: "Not Duplicate",
  RESOLVED: "Resolved",
};

export default function DisputeList({ disputes, isLoading }: DisputeListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredDisputes = disputes.filter((dispute) => {
    const matchesSearch =
      dispute.originalPropertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.duplicatePropertyAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.reporterName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || dispute.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by address or reporter..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED_DUPLICATE">Confirmed Duplicate</SelectItem>
            <SelectItem value="NOT_DUPLICATE">Not Duplicate</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispute ID</TableHead>
              <TableHead>Original Property</TableHead>
              <TableHead>Duplicate Property</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDisputes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No disputes found
                </TableCell>
              </TableRow>
            ) : (
              filteredDisputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell className="font-mono text-xs">
                    {dispute.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {dispute.originalPropertyAddress}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {dispute.duplicatePropertyAddress}
                  </TableCell>
                  <TableCell>{dispute.reporterName || "System"}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[dispute.status]}>
                      {statusLabels[dispute.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(dispute.createdAt), {
                      addSuffix: true,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/dashboard/disputes/${dispute.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Info */}
      <div className="text-sm text-gray-500">
        Showing {filteredDisputes.length} of {disputes.length} disputes
      </div>
    </div>
  );
}