"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}