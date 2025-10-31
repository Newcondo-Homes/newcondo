"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface SuccessToastProps {
  message: string;
  description?: string;
}

export function showSuccessToast({ message, description }: SuccessToastProps) {
  toast.success(message, {
    description,
    icon: <CheckCircle2 className="h-4 w-4" />,
  });
}