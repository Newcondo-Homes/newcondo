"use client";

/* ============================================================
   /chat — dedicated live-chat page (public site only).

   Why a whole page instead of an overlay on the marketing pages: booting
   Crisp's widget on top of the Home page (with its continuous hero canvas
   animation and dozen mounted sections) was fighting Crisp's own heavy
   first-open work for the main thread and reading as a freeze on mobile.
   This page is minimal on purpose — nothing else competes with Crisp here.

   Flow: ChatButton links here with ?back=<path the visitor came from>.
   Crisp opens automatically on arrival (arriving IS the "open chat"
   action). When the visitor taps Crisp's own close (X), we treat that as
   "done" and navigate back to where they started.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { useCrisp } from "@/hooks/useCrisp";
import { onCrisp } from "@/lib/crisp";

export default function ChatPage() {
  const router = useRouter();
  const { available, ready, connecting, hasConversation, open, reset } = useCrisp();
  const openedRef = useRef(false);
  const [backHref, setBackHref] = useState("/");

  // Read ?back= manually (not useSearchParams) so this page doesn't need a
  // Suspense boundary — same convention as components/gate/LocationGate.tsx.
  useEffect(() => {
    const back = new URLSearchParams(window.location.search).get("back");
    if (back) setBackHref(back);
  }, []);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push(backHref);
  }

  // Arriving on this page IS the "open chat" action.
  useEffect(() => {
    if (ready && !openedRef.current) {
      openedRef.current = true;
      open();
    }
  }, [ready, open]);

  // Crisp's own close (X) button means "done" — return where they came from.
  useEffect(() => {
    if (!available) return;
    onCrisp("chat:closed", goBack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  return (
    <div className="flex h-[100dvh] flex-col bg-ink">
      <header className="flex items-center justify-between gap-3 border-b border-[rgba(249,249,239,0.1)] px-4 py-3.5">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className="grid h-10 w-10 place-items-center rounded-full bg-[rgba(249,249,239,0.08)] text-cream"
        >
          <Icon name="arrow-left" size={20} />
        </button>
        <span className="text-[14.5px] font-semibold text-cream">Chat with NewCondo</span>
        {hasConversation ? (
          <button
            type="button"
            onClick={reset}
            aria-label="Start a new chat"
            className="grid h-10 w-10 place-items-center rounded-full bg-[rgba(249,249,239,0.08)] text-cream"
          >
            <Icon name="square-pen" size={18} />
          </button>
        ) : (
          <span className="h-10 w-10" />
        )}
      </header>

      {/* Crisp renders its own chat window as a fixed overlay once opened —
          this area is just backdrop while that loads. */}
      <div className="relative flex-1">
        {(!available || connecting) && (
          <div className="absolute inset-0 grid place-items-center gap-3">
            <Icon name="loader-2" size={26} className="animate-spin text-cream" />
            <p className="m-0 text-[13.5px] text-text-on-dark-2">Connecting…</p>
          </div>
        )}
      </div>
    </div>
  );
}
