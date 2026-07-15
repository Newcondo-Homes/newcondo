"use client";

/* ============================================================
   ChatLauncherLink — Home-page-only chat launcher.

   A plain link to the dedicated /chat page instead of booting Crisp inline
   (that's what <ChatButton> does on every other page). Home runs a
   continuous hero canvas animation that fights Crisp's own heavy first-open
   work for the main thread when Crisp boots inline there — see
   app/chat/page.tsx for the full explanation.
   ============================================================ */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { isCrispConfigured, loadCrisp } from "@/lib/crisp";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export function ChatLauncherLink() {
  const [configured, setConfigured] = useState(false);
  const { user } = useCurrentUser();

  useEffect(() => {
    if (!isCrispConfigured()) return;
    setConfigured(true);
    // Start loading Crisp the moment this bubble appears — not after the
    // user taps — so by the time they land on /chat the SDK is already
    // warm (or fully ready) instead of them staring at a "Connecting…"
    // state right after a page navigation, which reads as broken.
    loadCrisp(user ? { tokenId: `nc_${user.id}` } : undefined);
  }, [user]);

  if (!configured) return null;

  return (
    <Link
      href="/chat?back=%2F"
      aria-label="Chat with NewCondo"
      className="fixed right-6 bottom-6 z-[90] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-ink text-cream shadow-lift transition-transform duration-200 ease-nc hover:-translate-y-1 active:scale-95"
    >
      <Icon name="message-circle" size={24} />
    </Link>
  );
}
