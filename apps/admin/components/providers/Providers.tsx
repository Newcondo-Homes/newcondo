"use client";
// apps/admin/components/providers/Providers.tsx
// Session (Auth.js) + ONE TanStack Query cache for the whole admin app + sonner.
//
// The QueryClient lives here, above every route, so it is created once per tab
// and survives every client-side navigation. Together with <Prefetcher/> (warms
// every page the staff member can open) this is what makes page switches instant:
//   • staleTime 10 min  → revisiting a page within 10 min makes NO request
//   • after that        → cached data renders immediately, a silent background
//                         refetch swaps in fresh rows (no skeleton, ever)
//   • gcTime 60 min     → nothing is evicted while the dashboard is open
//   • mutations invalidate only the keys they touch (useAction)
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "@newcondo/auth/client";
import { Toaster } from "sonner";

function makeClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10 * 60_000,
        gcTime: 60 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true, // only refetches if stale — and then in the background
        retry: (n, e) => n < 1 && !/40[134]/.test(String((e as { response?: { status?: number } })?.response?.status ?? "")),
      },
    },
  });
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeClient);
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <QueryClientProvider client={client}>
        {children}
        <Toaster position="bottom-right" duration={7000} toastOptions={{ unstyled: true, classNames: { toast: "toast", success: "toast success", error: "toast error", title: "toast-t", description: "toast-s", icon: "toast-ic" } }} />
      </QueryClientProvider>
    </SessionProvider>
  );
}
