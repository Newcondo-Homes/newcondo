"use client";

/* ============================================================
   Real-time notifications — one EventSource against the combined backend:
     GET /api/v1/notifications/stream   (SSE; auth via ?token= because
     EventSource can't set headers — the backend shims it into the same
     authMiddleware, so there's no second auth path)
   On each `notification` event: prepend into the TanStack cache (badge +
   popover update instantly) and raise a toast. Auto-reconnects with
   backoff; silently inactive when NEXT_PUBLIC_API_URL isn't set (preview).
   ============================================================ */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@newcondo/ui";
import type { Notification, Role } from "@/lib/dashboard/data";

async function getAccessToken(): Promise<string | null> {
  try {
    // Same token apiClient uses — from the NextAuth session (@newcondo/auth/client).
    const { getSession } = await import("@newcondo/auth/client");
    const s = (await getSession()) as { accessToken?: string } | null;
    return s?.accessToken ?? null;
  } catch { return null; }
}

export function useNotificationStream(role: Role) {
  const qc = useQueryClient();
  const retryRef = useRef(0);
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return; // preview mode — no live backend
    let es: EventSource | null = null;
    let closed = false;
    let retryTimer: ReturnType<typeof setTimeout>;

    const connect = async () => {
      const token = await getAccessToken();
      if (!token || closed) return;
      es = new EventSource(`${base}/notifications/stream?token=${encodeURIComponent(token)}`);
      es.addEventListener("ready", () => { retryRef.current = 0; });
      es.addEventListener("notification", (ev) => {
        const n = JSON.parse((ev as MessageEvent).data) as Notification & { readAt: string | null; title?: string; };
        qc.setQueryData<Notification[]>(["notifications", role], (old = []) => [{ ...n, unread: !n.readAt }, ...old].slice(0, 30));
        toast.info(n.title ?? (n as { t?: string }).t ?? "New notification", { description: (n as { body?: string }).body ?? n.s });
      });
      es.onerror = () => {
        es?.close();
        if (closed) return;
        const backoff = Math.min(30_000, 1000 * 2 ** retryRef.current++);
        retryTimer = setTimeout(connect, backoff);
      };
    };
    connect();
    return () => { closed = true; clearTimeout(retryTimer); es?.close(); };
  }, [role, qc]);
}
