// apps/admin/src/app/(dashboard)/support/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Eye, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { supportApi } from "@/lib/api/support";
import type { SupportTicket, TicketStatus, TicketCategory, TicketPriority } from "@/types/admin";

const statusColors: Record<TicketStatus, string> = {
  OPEN: "bg-yellow-500",
  IN_PROGRESS: "bg-blue-500",
  RESOLVED: "bg-green-500",
  CLOSED: "bg-gray-500",
};

const priorityColors: Record<TicketPriority, string> = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export default function SupportPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<TicketCategory | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch tickets with filters
  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ["support-tickets", statusFilter, categoryFilter, priorityFilter, searchQuery, currentPage],
    queryFn: () => supportApi.getTickets({
      status: statusFilter !== "ALL" ? statusFilter : undefined,
      category: categoryFilter !== "ALL" ? categoryFilter : undefined,
      priority: priorityFilter !== "ALL" ? priorityFilter : undefined,
      search: searchQuery || undefined,
      page: currentPage,
      limit: pageSize,
    }),
  });

  // Fetch ticket statistics
  const { data: stats } = useQuery({
    queryKey: ["support-stats"],
    queryFn: supportApi.getTicketStats,
  });

  const tickets = ticketsData?.tickets || [];
  const totalPages = Math.ceil((ticketsData?.total || 0) / pageSize);

  // Update ticket status
  const updateStatusMutation = useMutation({
    mutationFn: ({ ticketId, status }: { ticketId: string; status: TicketStatus }) =>
      supportApi.updateTicketStatus(ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-stats"] });
    },
  });

  const handleStatusChange = (ticketId: string, newStatus: TicketStatus) => {
    updateStatusMutation.mutate({ ticketId, status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage and respond to user support requests</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.open || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Urgent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.urgent || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, description, or user email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TicketStatus | "ALL")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as TicketCategory | "ALL")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="TECHNICAL">Technical</SelectItem>
                  <SelectItem value="BILLING">Billing</SelectItem>
                  <SelectItem value="PROPERTY">Property</SelectItem>
                  <SelectItem value="VERIFICATION">Verification</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-2 block">Priority</label>
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TicketPriority | "ALL")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="text-center py-8">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No tickets found</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket: SupportTicket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-xs">{ticket.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ticket.user.name}</div>
                          <div className="text-xs text-muted-foreground">{ticket.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{ticket.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={ticket.status}
                          onValueChange={(v) => handleStatusChange(ticket.id, v as TicketStatus)}
                        >
                          <SelectTrigger className="w-32">
                            <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OPEN">Open</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                            <SelectItem value="CLOSED">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Link href={`/support/${ticket.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}