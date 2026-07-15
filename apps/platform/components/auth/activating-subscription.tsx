"use client";

/* ============================================================
   ActivatingSubscription

   Shown by the dashboard layout INSTEAD OF redirecting to /onboarding
   when role is correct (OWNER/AGENT) but isPremium is still false —
   i.e. the user just paid and the Flutterwave webhook that flips
   isPremium: true on the backend hasn't landed yet.

   Polls the session every 1.5s (via NextAuth's update(), which re-pulls
   the user row per the packages/auth jwt callback's trigger==="update"
   branch) and hard-reloads once isPremium comes back true, so the
   server layout re-evaluates and renders the real dashboard.

   This is what breaks the redirect ping-pong: dashboard no longer
   bounces to /onboarding while payment is still settling.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSession } from "@newcondo/auth/client";
import { getSubscriptionStatus } from "@/lib/api/profile";

const MAX_ATTEMPTS = 12; // ~18s at 1.5s intervals
const INTERVAL_MS = 1500;

export default function ActivatingSubscription() {
  const router = useRouter();
  const { update } = useSession();
  const [attempt, setAttempt] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      // Read the AUTHORITATIVE value straight from Prisma (never trust a
      // bare update()'s silent refetch — see subscription-status/route.ts),
      // then push it into the session explicitly so the jwt callback's
      // unconditional `{ ...token, ...session }` merge is guaranteed to apply
      // it, regardless of whether the other refetch branch works correctly.
      const status = await getSubscriptionStatus();
      if (cancelled.current) return;
      if (status.success && status.isPremium) {
        await update({ isPremium: true });
        if (cancelled.current) return;
        router.refresh(); // re-run the server layout with the now-fresh session
        return;
      }
      setAttempt((a) => {
        const next = a + 1;
        if (next >= MAX_ATTEMPTS) {
          setTimedOut(true);
        } else {
          timer = setTimeout(poll, INTERVAL_MS);
        }
        return next;
      });
    };

    timer = setTimeout(poll, INTERVAL_MS);
    return () => {
      cancelled.current = true;
      clearTimeout(timer);
    };
  }, [update, router]);

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-ink" strokeWidth={2} />
      <div>
        <h1 className="m-0 text-[22px] font-bold tracking-[-0.03em] text-text-primary">
          Confirming your payment…
        </h1>
        <p className="mx-auto mt-2 max-w-[38ch] text-[14.5px] leading-[1.5] text-text-secondary">
          This usually takes a few seconds. Your dashboard will load automatically.
        </p>
      </div>
      {timedOut && (
        <button
          type="button"
          onClick={() => router.refresh()}
          className="mt-2 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-[14.5px] font-semibold text-cream transition-colors duration-200 ease-nc hover:bg-black"
        >
          Try again
        </button>
      )}
    </main>
  );
}
