"use client";

/* ============================================================
   TanStack Query provider for the dashboard.
   The staleTime/gcTime defaults are the reason tabs & pages do NOT
   refetch every time the user leaves and comes back: data stays fresh
   for 5 minutes and cached for 30, so revisits paint instantly from
   cache while a background refetch (if stale) updates silently.
   ============================================================ */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60_000,
            gcTime: 30 * 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
