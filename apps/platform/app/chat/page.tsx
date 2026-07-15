"use client";

/* ============================================================
   /chat — dedicated live-chat page (public site only).

   No shared site chrome here on purpose: this route must NOT render the
   marketing Navbar/Footer/ChatButton. In a repo where pages share a layout
   (e.g. a (site) route group's layout.tsx), keep /chat OUTSIDE that group
   (or give it its own layout) so it doesn't inherit them — this page draws
   its own minimal top bar instead.

   Why a dedicated page at all: booting Crisp's widget on top of the Home
   page (continuous hero canvas animation + a dozen mounted sections) was
   fighting Crisp's own heavy first-open work for the main thread and read
   as a freeze on mobile. This page is minimal on purpose so nothing
   competes with Crisp here.

   Flow: ChatButton links here with ?back=<path the visitor came from>.
   Crisp opens automatically once ready. Tapping the "newcondo" wordmark, or
   Crisp's own close (X), returns to where the visitor started.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { useCrisp } from "@/hooks/useCrisp";
import { onCrisp } from "@/lib/crisp";

const LOGO_CREAM = "/assets/logo-mark-cream.png";

export default function ChatPage() {
  const router = useRouter();
  const { available, ready, connecting, open } = useCrisp();
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
    <div className="fixed inset-0 flex flex-col overflow-hidden overscroll-none bg-ink touch-none">
      <div className="flex items-center px-5 py-3.5">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back to newcondo"
          className="flex items-center gap-[9px] border-0 bg-transparent p-0 text-[16px] font-bold tracking-[0.08em] text-cream"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_CREAM} alt="" className="h-[22px] w-auto" />
          newcondo
        </button>
      </div>
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
        <span className="h-10 w-10" />
      </header>

      {/* Crisp renders its own chat window as a fixed overlay once opened —
          this content sits underneath as a welcome/backdrop until then. */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-5 px-6 pb-28 text-center">
        {!available || connecting ? (
          <>
            <Icon name="loader-2" size={26} className="animate-spin text-cream" />
            <p className="m-0 text-[13.5px] text-text-on-dark-2">Connecting…</p>
          </>
        ) : (
          <>
            <span
              aria-hidden="true"
              className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(249,249,239,0.08)] text-cream"
            >
              <Icon name="message-circle" size={26} />
            </span>
            <div className="flex flex-col gap-2">
              <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-cream">
                We&apos;re here to help
              </h1>
              <p className="m-0 max-w-[280px] text-[14.5px] leading-[1.55] text-text-on-dark-2">
                Reach NewCondo instantly for questions about renting, listing, payments, or anything else — no sign-in needed.
              </p>
            </div>
            <p className="m-0 mt-2 flex items-center gap-2 text-[13.5px] font-semibold text-cream">
              Tap the blue chat icon below to begin
              <Icon name="arrow-down" size={16} />
            </p>
          </>
        )}

        {/* Points at Crisp's own launcher (bottom-right, outside our control
            since it's a cross-origin widget) with a pulsing beacon ring. */}
        {available && !connecting && (
          <span className="pointer-events-none absolute right-6 bottom-6 h-[58px] w-[58px]" aria-hidden="true">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#3f6bff]/40" />
          </span>
        )}
      </div>
    </div>
  );
}
