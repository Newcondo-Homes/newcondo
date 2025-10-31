"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export default function StatusBadge({ status, variant = "default" }: StatusBadgeProps) {
  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
  };

  return (
    <Badge className={cn("capitalize", variantStyles[variant])}>
      {status.replace(/_/g, " ").toLowerCase()}
    </Badge>
  );
}