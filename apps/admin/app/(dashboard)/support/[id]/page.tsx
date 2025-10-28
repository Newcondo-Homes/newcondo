// apps/admin/src/app/(dashboard)/support/[id]/page.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, User, Mail, Phone, Calendar, Tag } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { supportApi } from "@/lib/api/support";
import { useToast } from "@/hooks/use-toast";
import type { TicketStatus, TicketPriority } from "@/types/admin";

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

export default function SupportTicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const ticketId = params.id as string;

  const [adminResponse, setAdminResponse] = useState("");
  const [status, setStatus] = useState<TicketStatus>("OPEN");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");

  // Fetch ticket details
  const { data: ticket, isLoading } = useQuery({
    queryKey: ["support-ticket", ticketId],
    queryFn: () => supportApi.getTicketById(ticketId),
    onSuccess: (data) => {
      setStatus(data.status);
      setPriority(data.priority);
      setAdminResponse(data.adminResponse || "");
    },
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: (data: { status?: TicketStatus; priority?: TicketPriority; adminResponse?: string }) =>
      supportApi.updateTicket(ticketId, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update ticket",
        variant: "destructive",
      });
    },
  });

  // Resolve ticket mutation
  const resolveTicketMutation = useMutation({
    mutationFn: () => supportApi.resolveTicket(ticketId, adminResponse),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Ticket resolved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["support-ticket", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["support-stats"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve ticket",
        variant: "destructive",
      });
    },
  });

  const handleUpdateStatus = () => {
    updateTicketMutation.mutate({ status });
  };

  const handleUpdatePriority = () => {
    updateTicketMutation.mutate({ priority });
  };

  const handleSaveResponse = () => {
    updateTicketMutation.mutate({ adminResponse });
  };

  const handleResolve = () => {
    if (!adminResponse.trim()) {
      toast({
        title: "Error",
        description: "Please provide a response before resolving",
        variant: "destructive",
      });
      return;
    }
    resolveTicketMutation.mutate();
  };

  if (isLoading) {
    return <div className="p-8">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="p-8">Ticket not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Support Ticket Details</h1>
          <p className="text-muted-foreground">Ticket #{ticket.id.slice(0, 8)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Information */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{ticket.title}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">{ticket.category}</Badge>
                    <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
                    <Badge className={statusColors[ticket.status]}>{ticket.status}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    Created {format(new Date(ticket.createdAt), "PPP 'at' p")}
                  </div>
                  {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Calendar className="h-4 w-4 mr-2" />
                      Last updated {format(new Date(ticket.updatedAt), "PPP 'at' p")}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Response */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your response to the user..."
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                rows={6}
                disabled={ticket.status === "CLOSED"}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveResponse}
                  disabled={updateTicketMutation.isPending || ticket.status === "CLOSED"}
                  variant="outline"
                >
                  Save Response
                </Button>
                <Button
                  onClick={handleResolve}
                  disabled={resolveTicketMutation.isPending || ticket.status === "RESOLVED" || ticket.status === "CLOSED"}
                  className="ml-auto"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Resolve & Send
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resolution History */}
          {ticket.resolvedAt && (
            <Card>
              <CardHeader>
                <CardTitle>Resolution Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-semibold">Resolved by:</span> Admin
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Resolved at:</span>{" "}
                    {format(new Date(ticket.resolvedAt), "PPP 'at' p")}
                  </div>
                  {ticket.adminResponse && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <p className="text-sm font-semibold mb-2">Response:</p>
                      <p className="text-sm whitespace-pre-wrap">{ticket.adminResponse}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{ticket.user.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${ticket.user.email}`} className="text-sm text-blue-600 hover:underline">
                  {ticket.user.email}
                </a>
              </div>
              {ticket.user.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${ticket.user.phone}`} className="text-sm text-blue-600 hover:underline">
                    {ticket.user.phone}
                  </a>
                </div>
              )}
              <div className="pt-2 border-t">
                <Link href={`/users/${ticket.userId}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View User Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as TicketStatus)}
                  disabled={ticket.status === "CLOSED"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
                {status !== ticket.status && (
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={updateTicketMutation.isPending}
                    size="sm"
                    className="w-full mt-2"
                  >
                    Update Status
                  </Button>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as TicketPriority)}
                  disabled={ticket.status === "CLOSED"}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {priority !== ticket.priority && (
                  <Button
                    onClick={handleUpdatePriority}
                    disabled={updateTicketMutation.isPending}
                    size="sm"
                    className="w-full mt-2"
                  >
                    Update Priority
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}