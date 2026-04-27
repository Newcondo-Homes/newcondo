"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow, format } from "date-fns";
import {
  MapPin,
  Clock,
  User,
  Phone,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Filter,
} from "lucide-react";

import { Badge } from "@newcondo/ui/";
import { Button } from "@newcondo/ui/";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@newcondo/ui/";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@newcondo/ui/";
import { Textarea } from "@newcondo/ui/";
import { Label } from "@newcondo/ui/";
import { Separator } from "@newcondo/ui/";
import { toast } from "@newcondo/ui/";
import { Skeleton } from "@newcondo/ui/";

import type { MarkingJobStatus, UrgencyLevel, MarkingType } from "@/types/marking";
import { useMarkingStore } from "@/store/markingStore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarkingRequest {
  id: string;
  propertyId: string;
  property: {
    title: string;
    address: string;
    city: string;
    state: string;
  };
  requestedBy: string;
  requester: {
    name: string;
    email: string;
    phone?: string;
  };
  markingType: MarkingType;
  contactPersonName: string;
  contactPersonPhone: string;
  accessInstructions?: string;
  preferredTime?: string;
  urgencyLevel: UrgencyLevel;
  markingFee: number;
  paymentStatus: string;
  status: MarkingJobStatus;
  queuePosition?: number;
  assignedAgentId?: string;
  assignedAgent?: {
    name: string;
    phone?: string;
  };
  completionImages: string[];
  completionNotes?: string;
  createdAt: string;
  updatedAt: string;
  timeSlotExpiry?: string;
  maxCompletionTime?: string;
}

interface RequestsResponse {
  success: boolean;
  data: {
    requests: MarkingRequest[];
    total: number;
    page: number;
    pageSize: number;
  };
}

type FilterStatus = "ALL" | MarkingJobStatus;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function fetchMarkingRequests(
  status: FilterStatus,
  urgency: string,
  page: number
): Promise<RequestsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: "10",
    ...(status !== "ALL" && { status }),
    ...(urgency !== "ALL" && { urgencyLevel: urgency }),
  });

  const res = await fetch(`/api/marking/requests?${params}`);
  if (!res.ok) throw new Error("Failed to fetch marking requests");
  return res.json();
}

async function cancelMarkingRequest(jobId: string, reason: string) {
  const res = await fetch(`/api/marking/requests/${jobId}/cancel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error("Failed to cancel marking request");
  return res.json();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: MarkingJobStatus }) {
  const map: Record<MarkingJobStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    QUEUED:      { label: "Queued",      variant: "secondary" },
    ASSIGNED:    { label: "Assigned",    variant: "default" },
    IN_PROGRESS: { label: "In Progress", variant: "default" },
    COMPLETED:   { label: "Completed",   variant: "outline" },
    CANCELLED:   { label: "Cancelled",   variant: "destructive" },
    EXPIRED:     { label: "Expired",     variant: "destructive" },
  };
  const cfg = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function UrgencyBadge({ level }: { level: UrgencyLevel }) {
  const map: Record<UrgencyLevel, { label: string; className: string }> = {
    LOW:    { label: "Low",    className: "bg-slate-100 text-slate-700" },
    NORMAL: { label: "Normal", className: "bg-blue-100 text-blue-700" },
    HIGH:   { label: "High",   className: "bg-orange-100 text-orange-700" },
    URGENT: { label: "Urgent", className: "bg-red-100 text-red-700" },
  };
  const cfg = map[level] ?? { label: level, className: "bg-slate-100 text-slate-700" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function MarkingTypeBadge({ type }: { type: MarkingType }) {
  const labels: Record<string, string> = {
    SELF_MARK:      "Self Mark",
    CONTACT_PERSON: "Contact Person",
    AGENT_QUEUE:    "Agent Queue",
    NEWCONDO_MARK:  "Newcondo Agent",
  };
  return (
    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
      {labels[type] ?? type}
    </span>
  );
}

function RequestCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Cancel dialog
// ---------------------------------------------------------------------------

function CancelDialog({
  open,
  jobId,
  onClose,
}: {
  open: boolean;
  jobId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => cancelMarkingRequest(jobId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marking-requests"] });
      toast.success( "Request cancelled successfully." );
      onClose();
    },
    onError: () => {
      toast.error("Failed to cancel request",{
        description: "Please try again.",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Marking Request</DialogTitle>
          <DialogDescription>
            Please provide a reason for cancelling. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <Label htmlFor="cancel-reason">Reason</Label>
          <Textarea
            id="cancel-reason"
            placeholder="e.g. No longer need marking, found an agent directly…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Keep Request
          </Button>
          <Button
            variant="destructive"
            disabled={!reason.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Request detail expand
// ---------------------------------------------------------------------------

function RequestCard({ request }: { request: MarkingRequest }) {
  const [expanded, setExpanded] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const canCancel = request.status === "QUEUED";

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <CardTitle className="text-base leading-snug">
                {request.property.title}
              </CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <MapPin className="h-3 w-3 shrink-0" />
                {request.property.address}, {request.property.city},{" "}
                {request.property.state}
              </CardDescription>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <StatusBadge status={request.status} />
              <UrgencyBadge level={request.urgencyLevel} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pb-3">
          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {request.requester.name}
            </span>
            <MarkingTypeBadge type={request.markingType} />
          </div>

          {/* Fee */}
          <div className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Marking Fee</span>
            <span className="font-semibold">
              ₦{Number(request.markingFee).toLocaleString()}
            </span>
          </div>

          {/* Queue position */}
          {request.status === "QUEUED" && request.queuePosition != null && (
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              Queue position: #{request.queuePosition}
            </div>
          )}

          {/* Assigned agent */}
          {request.assignedAgent && (
            <div className="flex items-center gap-2 text-xs text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Assigned to {request.assignedAgent.name}
            </div>
          )}

          {/* Expandable detail */}
          {expanded && (
            <div className="space-y-3 pt-1">
              <Separator />
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{request.contactPersonName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Contact Phone</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {request.contactPersonPhone}
                  </p>
                </div>
                {request.preferredTime && (
                  <div>
                    <p className="text-xs text-muted-foreground">Preferred Time</p>
                    <p className="font-medium">
                      {format(new Date(request.preferredTime), "PPp")}
                    </p>
                  </div>
                )}
                {request.maxCompletionTime && (
                  <div>
                    <p className="text-xs text-muted-foreground">Deadline</p>
                    <p className="font-medium">
                      {format(new Date(request.maxCompletionTime), "PPp")}
                    </p>
                  </div>
                )}
              </div>
              {request.accessInstructions && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Access Instructions</p>
                  <p className="rounded-md bg-muted/40 p-2 text-sm">
                    {request.accessInstructions}
                  </p>
                </div>
              )}
              {request.completionNotes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Completion Notes</p>
                  <p className="rounded-md bg-green-50 p-2 text-sm text-green-800">
                    {request.completionNotes}
                  </p>
                </div>
              )}
              {request.completionImages.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Completion Images ({request.completionImages.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {request.completionImages.slice(0, 4).map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-14 w-14 overflow-hidden rounded-md border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Completion image ${i + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                    {request.completionImages.length > 4 && (
                      <span className="flex h-14 w-14 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
                        +{request.completionImages.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between gap-2 pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Hide details
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> View details
              </>
            )}
          </Button>

          <div className="flex gap-2">
            {request.status === "COMPLETED" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-xs"
                asChild
              >
                <a
                  href={`/properties/${request.propertyId}/marking-status`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Marking
                </a>
              </Button>
            )}
            {canCancel && (
              <Button
                size="sm"
                variant="destructive"
                className="gap-1 text-xs"
                onClick={() => setCancelOpen(true)}
              >
                <XCircle className="h-3.5 w-3.5" />
                Cancel
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <CancelDialog
        open={cancelOpen}
        jobId={request.id}
        onClose={() => setCancelOpen(false)}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MarkingRequests() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("ALL");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["marking-requests", statusFilter, urgencyFilter, page],
    queryFn: () => fetchMarkingRequests(statusFilter, urgencyFilter, page),
  });

  const requests = data?.data.requests ?? [];
  const total = data?.data.total ?? 0;
  const pageSize = data?.data.pageSize ?? 10;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Marking Requests</h1>
        <p className="text-sm text-muted-foreground">
          Track all property marking jobs you have requested.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as FilterStatus);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="QUEUED">Queued</SelectItem>
            <SelectItem value="ASSIGNED">Assigned</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={urgencyFilter}
          onValueChange={(v) => {
            setUrgencyFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Urgency</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="NORMAL">Normal</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="URGENT">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>

        {total > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {total} request{total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <RequestCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-3">
            <XCircle className="mx-auto h-10 w-10 text-destructive" />
            <p className="font-medium">Failed to load marking requests</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card className="py-16 text-center">
          <CardContent className="space-y-2">
            <MapPin className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No marking requests found</p>
            <p className="text-sm text-muted-foreground">
              Requests you create when listing a property will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}