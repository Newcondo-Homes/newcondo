"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface DisputeDetails {
  id: string;
  rentalId: string;
  paymentId: string;
  renterId: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  unitNumber?: string;
  amount: number;
  disputeReason: string;
  disputeDescription: string;
  evidenceUrls: string[];
  status: "PENDING" | "INVESTIGATING" | "APPROVED" | "REJECTED";
  createdAt: string;
  confirmationDeadline: string;
  hoursRemaining: number;
}

interface DisputeResolutionProps {
  className?: string;
}

export default function DisputeResolution({ className }: DisputeResolutionProps) {
  const [selectedDispute, setSelectedDispute] = useState<DisputeDetails | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionAction, setResolutionAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  const queryClient = useQueryClient();

  // Fetch disputes
  const { data: disputes, isLoading } = useQuery({
    queryKey: ["admin", "disputes", filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== "all") params.append("status", filterStatus);
      
      const response = await fetch(`/api/admin/disputes?${params}`);
      if (!response.ok) throw new Error("Failed to fetch disputes");
      return response.json() as Promise<DisputeDetails[]>;
    },
  });

  // Resolve dispute mutation
  const resolveDisputeMutation = useMutation({
    mutationFn: async (data: {
      disputeId: string;
      action: "APPROVE" | "REJECT";
      notes: string;
    }) => {
      const response = await fetch(`/api/admin/disputes/${data.disputeId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: data.action,
          resolutionNotes: data.notes,
        }),
      });
      if (!response.ok) throw new Error("Failed to resolve dispute");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] });
      toast.success(
        variables.action === "APPROVE" 
          ? "Dispute approved - Refund will be processed" 
          : "Dispute rejected - Payment will be released"
      );
      setSelectedDispute(null);
      setResolutionNotes("");
    },
    onError: (error: Error) => {
      toast.error(`Failed to resolve dispute: ${error.message}`);
    },
  });

  const handleResolveDispute = () => {
    if (!selectedDispute) return;
    if (!resolutionNotes.trim()) {
      toast.error("Please provide resolution notes");
      return;
    }

    resolveDisputeMutation.mutate({
      disputeId: selectedDispute.id,
      action: resolutionAction,
      notes: resolutionNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      PENDING: { variant: "outline", icon: Clock },
      INVESTIGATING: { variant: "secondary", icon: AlertCircle },
      APPROVED: { variant: "default", icon: CheckCircle },
      REJECTED: { variant: "destructive", icon: XCircle },
    };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const getUrgencyBadge = (hoursRemaining: number) => {
    if (hoursRemaining < 6) {
      return <Badge variant="destructive">Critical - {hoursRemaining}h left</Badge>;
    } else if (hoursRemaining < 12) {
      return <Badge variant="secondary">Urgent - {hoursRemaining}h left</Badge>;
    }
    return <Badge variant="outline">{hoursRemaining}h remaining</Badge>;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Disputes</CardTitle>
            <CardDescription>
              Review and resolve payment disputes within the 24-hour confirmation period
            </CardDescription>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Disputes</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="INVESTIGATING">Investigating</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : disputes && disputes.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Renter</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Time Left</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((dispute) => (
                <TableRow key={dispute.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{dispute.renterName}</span>
                      <span className="text-sm text-muted-foreground">{dispute.renterEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{dispute.propertyTitle}</span>
                      <span className="text-sm text-muted-foreground">
                        {dispute.unitNumber ? `Unit ${dispute.unitNumber}` : dispute.propertyAddress}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₦{dispute.amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{dispute.disputeReason}</span>
                  </TableCell>
                  <TableCell>{getUrgencyBadge(dispute.hoursRemaining)}</TableCell>
                  <TableCell>{getStatusBadge(dispute.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDispute(dispute)}
                      disabled={dispute.status !== "PENDING" && dispute.status !== "INVESTIGATING"}
                    >
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No disputes found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filterStatus === "all" 
                ? "All payment disputes have been resolved" 
                : `No ${filterStatus.toLowerCase()} disputes`}
            </p>
          </div>
        )}
      </CardContent>

      {/* Dispute Resolution Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resolve Payment Dispute</DialogTitle>
            <DialogDescription>
              Review the dispute details and make a decision
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-6">
              {/* Urgency Alert */}
              {selectedDispute.hoursRemaining < 6 && (
                <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <span className="text-sm font-medium">
                    Critical: Only {selectedDispute.hoursRemaining} hours remaining before auto-release
                  </span>
                </div>
              )}

              {/* Dispute Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Renter</Label>
                  <p className="font-medium">{selectedDispute.renterName}</p>
                  <p className="text-sm text-muted-foreground">{selectedDispute.renterEmail}</p>
                  <p className="text-sm text-muted-foreground">{selectedDispute.renterPhone}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Property</Label>
                  <p className="font-medium">{selectedDispute.propertyTitle}</p>
                  <p className="text-sm text-muted-foreground">{selectedDispute.propertyAddress}</p>
                  {selectedDispute.unitNumber && (
                    <p className="text-sm text-muted-foreground">Unit: {selectedDispute.unitNumber}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Dispute Amount</Label>
                  <p className="text-2xl font-bold">₦{selectedDispute.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Confirmation Deadline</Label>
                  <p className="font-medium">
                    {new Date(selectedDispute.confirmationDeadline).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDispute.hoursRemaining} hours remaining
                  </p>
                </div>
              </div>

              {/* Dispute Reason */}
              <div>
                <Label className="text-sm text-muted-foreground">Dispute Reason</Label>
                <p className="font-medium mt-1">{selectedDispute.disputeReason}</p>
              </div>

              {/* Dispute Description */}
              <div>
                <Label className="text-sm text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 p-3 bg-muted rounded-lg whitespace-pre-wrap">
                  {selectedDispute.disputeDescription}
                </p>
              </div>

              {/* Evidence */}
              {selectedDispute.evidenceUrls.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Evidence Submitted</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDispute.evidenceUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video rounded-lg border overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        <img src={url} alt={`Evidence ${idx + 1}`} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Action */}
              <div className="space-y-4">
                <div>
                  <Label>Resolution Decision</Label>
                  <Select value={resolutionAction} onValueChange={(v) => setResolutionAction(v as "APPROVE" | "REJECT")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="APPROVE">Approve Dispute - Issue Refund</SelectItem>
                      <SelectItem value="REJECT">Reject Dispute - Release Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Resolution Notes</Label>
                  <Textarea
                    placeholder="Explain your decision and any actions taken..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDispute(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleResolveDispute}
              disabled={resolveDisputeMutation.isPending || !resolutionNotes.trim()}
            >
              {resolveDisputeMutation.isPending ? "Processing..." : "Submit Resolution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}














// // apps/admin/src/components/admin/DisputeResolution.tsx
// "use client";

// import { useState } from "react";
// import { 
//   AlertTriangle, 
//   CheckCircle2, 
//   XCircle, 
//   MessageSquare,
//   Image as ImageIcon,
//   User,
//   Calendar
// } from "lucide-react";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/card";
// import { Button } from "@newcondo/ui/button";
// import { Badge } from "@newcondo/ui/badge";
// import { Textarea } from "@newcondo/ui/textarea";
// import { Label } from "@newcondo/ui/label";
// import { Separator } from "@newcondo/ui/separator";
// import { Alert, AlertDescription } from "@newcondo/ui/alert";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@newcondo/ui/dialog";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@newcondo/ui/select";
// import { markingOversightApi } from "@/lib/api/markingOversight";
// import { formatDate } from "@/lib/utils/format";
// import type { DisputeInfo } from "@/types/admin";

// interface DisputeResolutionProps {
//   dispute: DisputeInfo;
//   jobId: string;
//   onResolve: () => void;
// }

// export default function DisputeResolution({ 
//   dispute, 
//   jobId, 
//   onResolve 
// }: DisputeResolutionProps) {
//   const [resolution, setResolution] = useState<"approve" | "reject" | "">("");
//   const [resolutionNotes, setResolutionNotes] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);

//   const handleResolve = async () => {
//     if (!resolution) {
//       setError("Please select a resolution");
//       return;
//     }

//     if (!resolutionNotes.trim()) {
//       setError("Please provide resolution notes");
//       return;
//     }

//     try {
//       setLoading(true);
//       setError(null);

//       await markingOversightApi.resolveDispute(dispute.id, {
//         resolution,
//         notes: resolutionNotes
//       });

//       onResolve();
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Failed to resolve dispute");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getDisputeTypeBadge = (type: string) => {
//     const variants: Record<string, "default" | "secondary" | "destructive"> = {
//       WRONG_PROPERTY: "destructive",
//       POOR_QUALITY: "destructive",
//       INCOMPLETE: "destructive",
//       BOUNDARY_ISSUE: "secondary",
//       OTHER: "default"
//     };
//     return <Badge variant={variants[type] || "default"}>{type.replace("_", " ")}</Badge>;
//   };

//   return (
//     <div className="space-y-6">
//       {/* Dispute Overview */}
//       <Card className="border-destructive">
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <CardTitle className="flex items-center gap-2">
//               <AlertTriangle className="w-5 h-5 text-destructive" />
//               Dispute Details
//             </CardTitle>
//             {getDisputeTypeBadge(dispute.type)}
//           </div>
//           <CardDescription>
//             Review and resolve marking job dispute
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <Alert variant="destructive">
//             <AlertTriangle className="h-4 w-4" />
//             <AlertDescription>
//               This marking job is under dispute. Please review all information carefully before making a decision.
//             </AlertDescription>
//           </Alert>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <User className="w-4 h-4 text-muted-foreground" />
//                 <span className="text-sm font-medium">Reported By</span>
//               </div>
//               <p className="text-sm">{dispute.reportedBy.name}</p>
//               <p className="text-xs text-muted-foreground">{dispute.reportedBy.email}</p>
//             </div>
//             <div>
//               <div className="flex items-center gap-2 mb-2">
//                 <Calendar className="w-4 h-4 text-muted-foreground" />
//                 <span className="text-sm font-medium">Reported On</span>
//               </div>
//               <p className="text-sm">{formatDate(dispute.reportedAt)}</p>
//             </div>
//           </div>

//           <Separator />

//           <div className="space-y-2">
//             <Label className="text-sm font-medium">Dispute Reason</Label>
//             <p className="text-sm text-muted-foreground">
//               {dispute.reason}
//             </p>
//           </div>

//           {dispute.description && (
//             <>
//               <Separator />
//               <div className="space-y-2">
//                 <Label className="text-sm font-medium">Detailed Description</Label>
//                 <p className="text-sm text-muted-foreground">
//                   {dispute.description}
//                 </p>
//               </div>
//             </>
//           )}
//         </CardContent>
//       </Card>

//       {/* Evidence Provided */}
//       {dispute.evidenceImages && dispute.evidenceImages.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <ImageIcon className="w-5 h-5" />
//               Evidence
//             </CardTitle>
//             <CardDescription>
//               Images provided by the disputing party
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-4 gap-2">
//               {dispute.evidenceImages.map((image, index) => (
//                 <Dialog key={index}>
//                   <DialogTrigger asChild>
//                     <div 
//                       className="relative aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border-2 border-destructive"
//                       onClick={() => setSelectedImage(image)}
//                     >
//                       <img
//                         src={image}
//                         alt={`Evidence ${index + 1}`}
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                   </DialogTrigger>
//                   <DialogContent className="max-w-4xl">
//                     <DialogHeader>
//                       <DialogTitle>Evidence Photo {index + 1}</DialogTitle>
//                     </DialogHeader>
//                     <img
//                       src={image}
//                       alt={`Evidence ${index + 1}`}
//                       className="w-full h-auto rounded-md"
//                     />
//                   </DialogContent>
//                 </Dialog>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Original Marking Photos */}
//       {dispute.originalMarkingImages && dispute.originalMarkingImages.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Original Marking Photos</CardTitle>
//             <CardDescription>
//               Photos submitted by the agent during marking
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-4 gap-2">
//               {dispute.originalMarkingImages.map((image, index) => (
//                 <Dialog key={index}>
//                   <DialogTrigger asChild>
//                     <div 
//                       className="relative aspect-square rounded-md overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
//                       onClick={() => setSelectedImage(image)}
//                     >
//                       <img
//                         src={image}
//                         alt={`Original marking ${index + 1}`}
//                         className="w-full h-full object-cover"
//                       />
//                     </div>
//                   </DialogTrigger>
//                   <DialogContent className="max-w-4xl">
//                     <DialogHeader>
//                       <DialogTitle>Original Marking Photo {index + 1}</DialogTitle>
//                     </DialogHeader>
//                     <img
//                       src={image}
//                       alt={`Original marking ${index + 1}`}
//                       className="w-full h-auto rounded-md"
//                     />
//                   </DialogContent>
//                 </Dialog>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Agent Response */}
//       {dispute.agentResponse && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <MessageSquare className="w-5 h-5" />
//               Agent Response
//             </CardTitle>
//             <CardDescription>
//               Response from the assigned agent
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <p className="text-sm text-muted-foreground">
//               {dispute.agentResponse}
//             </p>
//           </CardContent>
//         </Card>
//       )}

//       {/* Resolution Section */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Resolve Dispute</CardTitle>
//           <CardDescription>
//             Make a decision on this dispute case
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {error && (
//             <Alert variant="destructive">
//               <AlertTriangle className="h-4 w-4" />
//               <AlertDescription>{error}</AlertDescription>
//             </Alert>
//           )}

//           <div className="space-y-2">
//             <Label>Resolution Decision</Label>
//             <Select value={resolution} onValueChange={(value: any) => setResolution(value)}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Select resolution" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="approve">
//                   Approve Agent's Work (Dispute Invalid)
//                 </SelectItem>
//                 <SelectItem value="reject">
//                   Reject Agent's Work (Dispute Valid)
//                 </SelectItem>
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-2">
//             <Label>Resolution Notes</Label>
//             <Textarea
//               placeholder="Provide detailed notes about your decision..."
//               value={resolutionNotes}
//               onChange={(e) => setResolutionNotes(e.target.value)}
//               rows={5}
//               className="resize-none"
//             />
//             <p className="text-xs text-muted-foreground">
//               These notes will be visible to both the property owner and the agent.
//             </p>
//           </div>

//           {resolution && (
//             <Alert variant={resolution === "approve" ? "default" : "destructive"}>
//               <AlertDescription>
//                 {resolution === "approve" ? (
//                   <>
//                     <strong>Approving the agent's work will:</strong>
//                     <ul className="list-disc list-inside mt-2 space-y-1">
//                       <li>Release payment to the agent</li>
//                       <li>Mark the marking job as completed</li>
//                       <li>Close the dispute</li>
//                       <li>Update the agent's reliability score positively</li>
//                     </ul>
//                   </>
//                 ) : (
//                   <>
//                     <strong>Rejecting the agent's work will:</strong>
//                     <ul className="list-disc list-inside mt-2 space-y-1">
//                       <li>Refund payment to the property owner</li>
//                       <li>Reassign the job to a new agent</li>
//                       <li>Update the agent's reliability score negatively</li>
//                       <li>Send notifications to all parties</li>
//                     </ul>
//                   </>
//                 )}
//               </AlertDescription>
//             </Alert>
//           )}

//           <Separator />

//           <div className="flex gap-2">
//             <Button
//               onClick={handleResolve}
//               disabled={loading || !resolution || !resolutionNotes.trim()}
//               className="flex-1"
//               variant={resolution === "approve" ? "default" : "destructive"}
//             >
//               {loading ? (
//                 "Processing..."
//               ) : resolution === "approve" ? (
//                 <>
//                   <CheckCircle2 className="w-4 h-4 mr-2" />
//                   Approve Agent's Work
//                 </>
//               ) : (
//                 <>
//                   <XCircle className="w-4 h-4 mr-2" />
//                   Reject Agent's Work
//                 </>
//               )}
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Previous Disputes (if any) */}
//       {dispute.previousDisputes && dispute.previousDisputes.length > 0 && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Previous Disputes</CardTitle>
//             <CardDescription>
//               History of disputes involving this agent
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               {dispute.previousDisputes.map((prev, index) => (
//                 <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
//                   <div>
//                     <p className="text-sm font-medium">{prev.type.replace("_", " ")}</p>
//                     <p className="text-xs text-muted-foreground">
//                       {formatDate(prev.date)} • Resolved: {prev.resolution}
//                     </p>
//                   </div>
//                   <Badge variant={prev.resolution === "APPROVED" ? "default" : "destructive"}>
//                     {prev.resolution}
//                   </Badge>
//                 </div>
//               ))}
//             </div>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }