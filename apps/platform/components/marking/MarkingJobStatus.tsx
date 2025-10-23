// apps/platform/components/marking/MarkingJobStatus.tsx
"use client";

import { Badge } from "@newcondo/ui/badge";
import { Progress } from "@newcondo/ui/progress";
import { 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2
} from "lucide-react";

interface MarkingJobStatusProps {
  status: string;
  queuePosition?: number;
  timeSlotExpiry?: string;
  showProgress?: boolean;
  className?: string;
}

const statusConfig = {
  QUEUED: {
    label: "In Queue",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: Clock,
    description: "Waiting for agent assignment",
    progress: 20,
  },
  ASSIGNED: {
    label: "Assigned",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: User,
    description: "Agent assigned, marking pending",
    progress: 40,
  },
  IN_PROGRESS: {
    label: "In Progress",
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    icon: Loader2,
    description: "Agent is marking the property",
    progress: 70,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    icon: CheckCircle,
    description: "Marking completed successfully",
    progress: 100,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-500",
    textColor: "text-gray-700",
    bgColor: "bg-gray-50",
    icon: XCircle,
    description: "Job cancelled",
    progress: 0,
  },
  EXPIRED: {
    label: "Expired",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    icon: AlertCircle,
    description: "Job expired without completion",
    progress: 0,
  },
  // ADDED CONFIRMATION_PENDING status as a common next step
  CONFIRMATION_PENDING: {
    label: "Pending Confirmation",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    icon: AlertCircle,
    description: "Awaiting customer approval or rejection",
    progress: 90,
  },
  // ADDED APPROVED status
  APPROVED: {
    label: "Approved",
    color: "bg-emerald-500",
    textColor: "text-emerald-700",
    bgColor: "bg-emerald-50",
    icon: CheckCircle,
    description: "Marking approved by customer, funds released",
    progress: 100,
  },
};

export function MarkingJobStatus({ 
  status, 
  queuePosition, 
  timeSlotExpiry,
  showProgress = false,
  className = "" 
}: MarkingJobStatusProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.QUEUED;
  const StatusIcon = config.icon;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status Badge */}
      <div className="flex items-center gap-3">
        <div className={`p-2 ${config.bgColor} rounded-lg`}>
          <StatusIcon 
            className={`h-5 w-5 ${config.textColor} ${status === "IN_PROGRESS" ? "animate-spin" : ""}`} 
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Badge className={`${config.color} text-white`}>
              {config.label}
            </Badge>
            {queuePosition && status === "QUEUED" && (
              <span className="text-sm text-muted-foreground">
                Position #{queuePosition}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {config.description}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{config.progress}%</span>
          </div>
          <Progress value={config.progress} className="h-2" />
        </div>
      )}

      {/* Time Slot Warning */}
      {timeSlotExpiry && status === "ASSIGNED" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Time Slot Active</p>
              <p className="text-yellow-700 text-xs mt-1">
                Agent must complete marking before expiry to avoid reassignment
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Queue Info */}
      {queuePosition && queuePosition > 1 && status === "QUEUED" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">In Queue</p>
              <p className="text-blue-700 text-xs mt-1">
                {queuePosition - 1} agent{queuePosition - 1 !== 1 ? "s" : ""} ahead of you
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}