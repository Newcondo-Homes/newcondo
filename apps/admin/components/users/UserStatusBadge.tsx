"use client";

import { Badge } from "@newcondo/ui/badge";
import { CheckCircle, Clock, XCircle } from "lucide-react";

interface UserStatusBadgeProps {
  status: string;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "VERIFIED":
        return {
          label: "Verified",
          className: "bg-green-100 text-green-800 border-green-200",
          icon: <CheckCircle className="h-3 w-3 mr-1" />,
        };
      case "PENDING":
        return {
          label: "Pending",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: <Clock className="h-3 w-3 mr-1" />,
        };
      case "REJECTED":
        return {
          label: "Rejected",
          className: "bg-red-100 text-red-800 border-red-200",
          icon: <XCircle className="h-3 w-3 mr-1" />,
        };
      default:
        return {
          label: status,
          className: "bg-gray-100 text-gray-800 border-gray-200",
          icon: null,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge variant="outline" className={`${config.className} flex items-center w-fit`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}