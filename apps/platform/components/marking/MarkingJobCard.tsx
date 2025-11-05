// apps/platform/components/marking/MarkingJobCard.tsx

import { Card, CardContent, CardFooter, CardHeader } from '@newcondo/ui/card';
import { Badge } from '@newcondo/ui/badge';
import { Button } from '@newcondo/ui/button';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@newcondo/ui/dropdown-menu';
import { formatDate, formatTimeRemaining } from '@/lib/utils/format';
import { MarkingStatusBadge } from './MarkingStatusBadge';

interface MarkingJobCardProps {
  job: {
    id: string;
    propertyId: string;
    propertyTitle: string;
    propertyAddress: string;
    propertyImages?: string[];
    status: 'QUEUED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
    contactPersonName: string;
    contactPersonPhone: string;
    accessInstructions?: string;
    preferredTime?: string;
    markingFee: number;
    paymentStatus: 'PENDING' | 'SUCCESS' | 'HELD' | 'RELEASED';
    assignedAgent?: {
      id: string;
      name: string;
      image?: string;
      phone?: string;
    };
    assignedAt?: string;
    completedAt?: string;
    timeSlotExpiry?: string;
    queuePosition?: number;
    createdAt: string;
  };
  viewType: 'owner' | 'agent';
  onViewDetails?: () => void;
  onVerify?: () => void;
  onCancel?: () => void;
  onComplete?: () => void;
}

export function MarkingJobCard({
  job,
  viewType,
  onViewDetails,
  onVerify,
  onCancel,
  onComplete,
}: MarkingJobCardProps) {
  const isOwner = viewType === 'owner';
  const isAgent = viewType === 'agent';

  const getTimeRemaining = () => {
    if (!job.timeSlotExpiry) return null;
    const expiry = new Date(job.timeSlotExpiry);
    const now = new Date();
    if (expiry <= now) return 'Expired';
    return formatTimeRemaining(expiry);
  };

  const getActionButtons = () => {
    if (isOwner) {
      if (job.status === 'COMPLETED' && job.paymentStatus === 'HELD') {
        return (
          <Button onClick={onVerify} size="sm" className="w-full">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Verify Marking
          </Button>
        );
      }

      if (job.status === 'QUEUED' || job.status === 'ASSIGNED') {
        return (
          <Button 
            onClick={onCancel} 
            variant="destructive" 
            size="sm" 
            className="w-full"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Job
          </Button>
        );
      }
    }

    if (isAgent && job.status === 'ASSIGNED' && job.assignedAgent?.id) {
      return (
        <Button onClick={onComplete} size="sm" className="w-full">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Complete Marking
        </Button>
      );
    }

    return null;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{job.propertyTitle}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{job.propertyAddress}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <MarkingStatusBadge status={job.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                {isOwner && (job.status === 'QUEUED' || job.status === 'ASSIGNED') && (
                  <DropdownMenuItem onClick={onCancel} className="text-destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Job
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Property Image */}
        {job.propertyImages && job.propertyImages.length > 0 && (
          <div className="relative h-40 w-full rounded-md overflow-hidden bg-muted">
            <img
              src={job.propertyImages[0]}
              alt={job.propertyTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Job Info Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Marking Fee</p>
            <p className="font-semibold">₦{job.markingFee.toLocaleString()}</p>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground">Payment Status</p>
            <Badge
              variant={
                job.paymentStatus === 'SUCCESS' || job.paymentStatus === 'RELEASED'
                  ? 'success'
                  : job.paymentStatus === 'HELD'
                  ? 'warning'
                  : 'secondary'
              }
            >
              {job.paymentStatus}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(job.createdAt)}
            </p>
          </div>

          {job.queuePosition && (
            <div className="space-y-1">
              <p className="text-muted-foreground">Queue Position</p>
              <p className="font-medium">#{job.queuePosition}</p>
            </div>
          )}
        </div>

        {/* Time Slot Expiry Warning */}
        {job.status === 'ASSIGNED' && timeRemaining && timeRemaining !== 'Expired' && (
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
            <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Time Remaining</p>
              <p className="text-xs text-muted-foreground">{timeRemaining}</p>
            </div>
          </div>
        )}

        {/* Contact Information (for agents) */}
        {isAgent && job.status === 'ASSIGNED' && (
          <div className="space-y-2 p-3 border rounded-md">
            <h4 className="font-medium text-sm">Contact Person</h4>
            <div className="space-y-1 text-sm">
              <p className="flex items-center gap-2">
                <User className="h-3 w-3" />
                {job.contactPersonName}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <a 
                  href={`tel:${job.contactPersonPhone}`}
                  className="text-primary hover:underline"
                >
                  {job.contactPersonPhone}
                </a>
              </p>
            </div>
            {job.accessInstructions && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {job.accessInstructions}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Assigned Agent (for owners) */}
        {isOwner && job.assignedAgent && (
          <div className="flex items-center gap-3 p-3 border rounded-md">
            {job.assignedAgent.image ? (
              <img
                src={job.assignedAgent.image}
                alt={job.assignedAgent.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">Assigned Agent</p>
              <p className="text-sm text-muted-foreground">{job.assignedAgent.name}</p>
            </div>
            {job.assignedAgent.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${job.assignedAgent.phone}`}>
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/50 pt-4">
        {getActionButtons()}
      </CardFooter>
    </Card>
  );
}





















// // apps/platform/components/marking/MarkingJobCard.tsx
// "use client";

// import { Card, CardContent, CardFooter, CardHeader } from "@newcondo/ui/card";
// import { Badge } from "@newcondo/ui/badge";
// import { Button } from "@newcondo/ui/button";
// import { MapPin, Clock, User, AlertCircle, CheckCircle } from "lucide-react";
// import { formatDistanceToNow } from "date-fns";
// import Link from "next/link";

// interface MarkingJobCardProps {
//   job: {
//     id: string;
//     propertyId: string;
//     status: string;
//     contactPersonName: string;
//     contactPersonPhone: string;
//     markingFee: number;
//     urgencyLevel: string;
//     createdAt: string;
//     assignedAt?: string;
//     completedAt?: string;
//     timeSlotExpiry?: string;
//     queuePosition?: number;
//     property: {
//       title: string;
//       address: string;
//       city: string;
//       state: string;
//     };
//   };
//   variant?: "agent" | "owner";
//   onAction?: (action: string, jobId: string) => void;
// }

// const statusConfig = {
//   QUEUED: { label: "In Queue", color: "bg-blue-500", icon: Clock },
//   ASSIGNED: { label: "Assigned", color: "bg-yellow-500", icon: User },
//   IN_PROGRESS: { label: "In Progress", color: "bg-orange-500", icon: AlertCircle },
//   COMPLETED: { label: "Completed", color: "bg-green-500", icon: CheckCircle },
//   CANCELLED: { label: "Cancelled", color: "bg-gray-500", icon: AlertCircle },
//   EXPIRED: { label: "Expired", color: "bg-red-500", icon: AlertCircle },
// };

// const urgencyColors = {
//   LOW: "bg-gray-100 text-gray-800",
//   NORMAL: "bg-blue-100 text-blue-800",
//   HIGH: "bg-orange-100 text-orange-800",
//   URGENT: "bg-red-100 text-red-800",
// };

// export function MarkingJobCard({ job, variant = "owner", onAction }: MarkingJobCardProps) {
//   const statusInfo = statusConfig[job.status as keyof typeof statusConfig];
//   const StatusIcon = statusInfo?.icon || AlertCircle;

//   return (
//     <Card className="hover:shadow-lg transition-shadow">
//       <CardHeader className="pb-3">
//         <div className="flex items-start justify-between">
//           <div className="flex-1">
//             <h3 className="font-semibold text-lg line-clamp-1">{job.property.title}</h3>
//             <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
//               <MapPin className="h-4 w-4" />
//               <span className="line-clamp-1">
//                 {job.property.address}, {job.property.city}
//               </span>
//             </div>
//           </div>
//           <Badge className={`${statusInfo?.color} text-white ml-2`}>
//             <StatusIcon className="h-3 w-3 mr-1" />
//             {statusInfo?.label}
//           </Badge>
//         </div>
//       </CardHeader>

//       <CardContent className="space-y-3">
//         <div className="flex items-center justify-between text-sm">
//           <span className="text-muted-foreground">Marking Fee</span>
//           <span className="font-semibold text-lg">₦{job.markingFee.toLocaleString()}</span>
//         </div>

//         <div className="flex items-center justify-between text-sm">
//           <span className="text-muted-foreground">Urgency</span>
//           <Badge variant="outline" className={urgencyColors[job.urgencyLevel as keyof typeof urgencyColors]}>
//             {job.urgencyLevel}
//           </Badge>
//         </div>

//         {job.queuePosition && job.status === "QUEUED" && (
//           <div className="flex items-center justify-between text-sm">
//             <span className="text-muted-foreground">Queue Position</span>
//             <span className="font-medium">#{job.queuePosition}</span>
//           </div>
//         )}

//         {job.timeSlotExpiry && job.status === "ASSIGNED" && (
//           <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
//             <div className="flex items-center gap-2 text-sm text-yellow-800">
//               <Clock className="h-4 w-4" />
//               <span>
//                 Expires in {formatDistanceToNow(new Date(job.timeSlotExpiry))}
//               </span>
//             </div>
//           </div>
//         )}

//         {variant === "agent" && job.status !== "QUEUED" && (
//           <div className="border-t pt-3 mt-3">
//             <div className="text-sm">
//               <div className="flex justify-between mb-1">
//                 <span className="text-muted-foreground">Contact Person</span>
//                 <span className="font-medium">{job.contactPersonName}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Phone</span>
//                 <span className="font-medium">{job.contactPersonPhone}</span>
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="text-xs text-muted-foreground">
//           Created {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
//         </div>
//       </CardContent>

//       <CardFooter className="pt-3 border-t flex gap-2">
//         <Link href={`/dashboard/marking/${job.id}`} className="flex-1">
//           <Button variant="outline" className="w-full">
//             View Details
//           </Button>
//         </Link>
        
//         {variant === "agent" && job.status === "ASSIGNED" && (
//           <Button
//             className="flex-1"
//             onClick={() => onAction?.("start", job.id)}
//           >
//             Start Marking
//           </Button>
//         )}

//         {variant === "owner" && job.status === "COMPLETED" && (
//           <Button
//             className="flex-1"
//             onClick={() => onAction?.("confirm", job.id)}
//           >
//             Review & Confirm
//           </Button>
//         )}
//       </CardFooter>
//     </Card>
//   );
// }














// // apps/platform/components/marking/MarkingJobCard.tsx
// 'use client';

// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Button } from '@/components/ui/button';
// import { Separator } from '@/components/ui/separator';
// import {
//   MapPin,
//   User,
//   Phone,
//   Clock,
//   DollarSign,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
// } from 'lucide-react';

// type MarkingJobStatus =
//   | 'QUEUED'
//   | 'ASSIGNED'
//   | 'IN_PROGRESS'
//   | 'COMPLETED'
//   | 'CANCELLED'
//   | 'EXPIRED';

// interface MarkingJobCardProps {
//   job: {
//     id: string;
//     propertyTitle: string;
//     propertyAddress: string;
//     status: MarkingJobStatus;
//     markingFee: number;
//     assignedAgentName?: string;
//     assignedAgentPhone?: string;
//     contactPersonName: string;
//     contactPersonPhone: string;
//     accessInstructions?: string;
//     requestedAt: Date;
//     completedAt?: Date;
//     timeSlotExpiry?: Date;
//     isConfirmed: boolean;
//   };
//   currency?: string;
//   onConfirm?: () => void;
//   onReject?: () => void;
//   onViewImages?: () => void;
// }

// export function MarkingJobCard({
//   job,
//   currency = 'NGN',
//   onConfirm,
//   onReject,
//   onViewImages,
// }: MarkingJobCardProps) {
//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency,
//       minimumFractionDigits: 0,
//     }).format(amount);
//   };

//   const formatDate = (date: Date) => {
//     return new Date(date).toLocaleString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//     });
//   };

//   const getStatusBadge = () => {
//     switch (job.status) {
//       case 'COMPLETED':
//         return <Badge className="bg-green-500">Completed</Badge>;
//       case 'IN_PROGRESS':
//         return <Badge className="bg-blue-500">In Progress</Badge>;
//       case 'ASSIGNED':
//         return <Badge className="bg-purple-500">Assigned</Badge>;
//       case 'QUEUED':
//         return (
//           <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
//             Queued
//           </Badge>
//         );
//       case 'CANCELLED':
//         return <Badge variant="destructive">Cancelled</Badge>;
//       case 'EXPIRED':
//         return (
//           <Badge variant="outline" className="bg-gray-50 text-gray-700">
//             Expired
//           </Badge>
//         );
//     }
//   };

//   const showConfirmationButtons =
//     job.status === 'COMPLETED' && !job.isConfirmed && onConfirm && onReject;

//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex items-start justify-between">
//           <div>
//             <CardTitle className="text-xl mb-2">{job.propertyTitle}</CardTitle>
//             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//               <MapPin className="h-4 w-4" />
//               <span>{job.propertyAddress}</span>
//             </div>
//           </div>
//           {getStatusBadge()}
//         </div>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {/* Marking Fee */}
//         <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
//           <div className="flex items-center gap-2">
//             <DollarSign className="h-5 w-5 text-muted-foreground" />
//             <span className="font-medium">Marking Fee</span>
//           </div>
//           <span className="text-xl font-bold">{formatCurrency(job.markingFee)}</span>
//         </div>

//         <Separator />

//         {/* Agent Information */}
//         {job.assignedAgentName && (
//           <>
//             <div className="space-y-2">
//               <h4 className="font-semibold flex items-center gap-2">
//                 <User className="h-4 w-4" />
//                 Assigned Agent
//               </h4>
//               <div className="pl-6 space-y-1">
//                 <p className="text-sm">{job.assignedAgentName}</p>
//                 {job.assignedAgentPhone && (
//                   <a
//                     href={`tel:${job.assignedAgentPhone}`}
//                     className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
//                   >
//                     <Phone className="h-3 w-3" />
//                     {job.assignedAgentPhone}
//                   </a>
//                 )}
//               </div>
//             </div>
//             <Separator />
//           </>
//         )}

//         {/* Contact Person */}
//         <div className="space-y-2">
//           <h4 className="font-semibold flex items-center gap-2">
//             <User className="h-4 w-4" />
//             Contact Person
//           </h4>
//           <div className="pl-6 space-y-1">
//             <p className="text-sm">{job.contactPersonName}</p>
//             <a
//               href={`tel:${job.contactPersonPhone}`}
//               className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
//             >
//               <Phone className="h-3 w-3" />
//               {job.contactPersonPhone}
//             </a>
//           </div>
//         </div>

//         {/* Access Instructions */}
//         {job.accessInstructions && (
//           <>
//             <Separator />
//             <div className="space-y-2">
//               <h4 className="font-semibold flex items-center gap-2">
//                 <AlertCircle className="h-4 w-4" />
//                 Access Instructions
//               </h4>
//               <p className="text-sm text-muted-foreground pl-6">
//                 {job.accessInstructions}
//               </p>
//             </div>
//           </>
//         )}

//         <Separator />

//         {/* Timeline */}
//         <div className="space-y-2">
//           <div className="flex items-center gap-2 text-sm">
//             <Clock className="h-4 w-4 text-muted-foreground" />
//             <span className="text-muted-foreground">Requested:</span>
//             <span className="font-medium">{formatDate(job.requestedAt)}</span>
//           </div>
//           {job.completedAt && (
//             <div className="flex items-center gap-2 text-sm">
//               <Clock className="h-4 w-4 text-muted-foreground" />
//               <span className="text-muted-foreground">Completed:</span>
//               <span className="font-medium">{formatDate(job.completedAt)}</span>
//             </div>
//           )}
//           {job.timeSlotExpiry && job.status === 'ASSIGNED' && (
//             <div className="flex items-center gap-2 text-sm">
//               <Clock className="h-4 w-4 text-orange-500" />
//               <span className="text-muted-foreground">Time Slot Expires:</span>
//               <span className="font-medium text-orange-600">
//                 {formatDate(job.timeSlotExpiry)}
//               </span>
//             </div>
//           )}
//         </div>

//         {/* Confirmation Status */}
//         {job.status === 'COMPLETED' && (
//           <>
//             <Separator />
//             <div className="flex items-center gap-2">
//               {job.isConfirmed ? (
//                 <>
//                   <CheckCircle className="h-5 w-5 text-green-500" />
//                   <span className="text-sm font-medium text-green-700">
//                     Marking Confirmed
//                   </span>
//                 </>
//               ) : (
//                 <>
//                   <AlertCircle className="h-5 w-5 text-yellow-500" />
//                   <span className="text-sm font-medium text-yellow-700">
//                     Awaiting Your Confirmation
//                   </span>
//                 </>
//               )}
//             </div>
//           </>
//         )}

//         {/* Action Buttons */}
//         {showConfirmationButtons && (
//           <div className="flex gap-2 pt-4">
//             <Button onClick={onConfirm} className="flex-1">
//               <CheckCircle className="h-4 w-4 mr-2" />
//               Confirm Marking
//             </Button>
//             <Button onClick={onReject} variant="destructive" className="flex-1">
//               <XCircle className="h-4 w-4 mr-2" />
//               Reject
//             </Button>
//           </div>
//         )}

//         {job.status === 'COMPLETED' && onViewImages && (
//           <Button onClick={onViewImages} variant="outline" className="w-full">
//             View Completion Images
//           </Button>
//         )}
//       </CardContent>
//     </Card>
//   );
// }