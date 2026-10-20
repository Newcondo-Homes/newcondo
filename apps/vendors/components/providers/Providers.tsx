"use client";
// Session (Auth.js) + TanStack Query + sonner, styled like @newcondo/ui's toaster
// (white surface, coloured left rule). Toasts stay 7s for slower readers.
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "@newcondo/auth/client";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, refetchOnWindowFocus: false, retry: 1 } } }));
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        {children}
        <Toaster position="bottom-right" duration={7000} toastOptions={{ unstyled: true, classNames: { toast: "toast", success: "toast success", error: "toast error", title: "toast-t", description: "toast-s", icon: "toast-ic" } }} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
