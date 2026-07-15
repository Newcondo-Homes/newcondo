"use client";

/* ============================================================
   ChatButton — the floating live-chat launcher, mounted ONCE in
   (site)/layout.tsx so it appears on every marketing page.

   It self-selects behaviour by route:
   • Home ("/") — renders <ChatLauncherLink>, a plain link to the dedicated
     /chat page. Home runs a continuous hero canvas animation that fights
     Crisp's own heavy first-open work for the main thread when Crisp boots
     inline there — that contention read as a freeze on mobile. See
     app/(site)/(home)/chat/page.tsx for the full explanation.
   • Every other page — renders <ChatButtonPopover>, which boots Crisp
     inline and opens a small popover (Start/Continue chat, New chat).
     Those pages are light enough that this works fine.

   NOTE: mounted on public surfaces only. Inside the authenticated platform
   app, owners/agents get dedicated in-product support instead.
   ============================================================ */

import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { useCrisp } from "@/hooks/useCrisp";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ChatLauncherLink } from "@/components/chat-launcher-link";

const EASE = [0.22, 1, 0.36, 1] as const;

export function ChatButton() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  // The dedicated /chat page only exists to dodge the mobile-only main-
  // thread contention between Home's hero canvas loop and Crisp's first
  // open. On larger screens Home behaves like every other page.
  const useDedicatedPage = pathname === "/" && isMobile;
  return useDedicatedPage ? <ChatLauncherLink /> : <ChatButtonPopover />;
}

function ChatButtonPopover() {
  const { available, hasConversation, open, reset, connecting } = useCrisp();
  const [panelOpen, setPanelOpen] = useState(false);
  const [instantClose, setInstantClose] = useState(false);

  if (!available) return null;

  function startChat() {
    setInstantClose(true);
    setPanelOpen(false);
    open();
  }

  function newChat() {
    setInstantClose(true);
    setPanelOpen(false);
    reset();
  }

  return (
    <div className="fixed right-6 bottom-6 z-[90] flex flex-col items-end gap-3">
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Chat with NewCondo"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={instantClose ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={instantClose ? { duration: 0 } : { duration: 0.28, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
            className="w-[300px] max-w-[calc(100vw-48px)] overflow-hidden rounded-[16px] border border-border-hair bg-surface shadow-pop"
          >
            <div className="bg-ink px-5 pt-5 pb-4 text-cream">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-cream/12 text-cream">
                  <Icon name="message-circle" size={18} />
                </span>
                <div>
                  <div className="text-[15px] font-bold tracking-[-0.01em] leading-tight">
                    Chat with NewCondo
                  </div>
                  <div className="text-[12.5px] text-text-on-dark-2 leading-tight mt-0.5">
                    Questions about renting or listing? Ask us.
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 p-4">
              <button
                onClick={startChat}
                disabled={connecting}
                aria-busy={connecting}
                className="group flex items-center justify-between gap-3 rounded-[12px] bg-ink px-4 py-3 text-left text-cream transition-[background,transform] duration-200 ease-nc hover:bg-ink-soft active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                <span className="flex items-center gap-2.5">
                  {connecting ? (
                    <Icon name="loader-2" size={18} className="animate-spin" />
                  ) : (
                    <Icon name="message-square-text" size={18} />
                  )}
                  <span className="text-[14.5px] font-semibold">
                    {connecting
                      ? "Connecting…"
                      : hasConversation
                      ? "Continue chatting"
                      : "Start a chat"}
                  </span>
                </span>
                {!connecting && (
                  <Icon
                    name="arrow-right"
                    size={16}
                    className="transition-transform duration-200 ease-nc group-hover:translate-x-1"
                  />
                )}
              </button>

              {hasConversation && (
                <button
                  onClick={newChat}
                  className="flex items-center gap-2.5 rounded-[12px] border border-border-hair bg-surface px-4 py-2.5 text-left text-text-secondary transition-colors duration-200 ease-nc hover:bg-surface-sunken hover:text-text-primary active:scale-[0.98]"
                >
                  <Icon name="square-pen" size={17} />
                  <span className="text-[14px] font-semibold">Start a new chat</span>
                </button>
              )}

              <p className="m-0 px-1 pt-0.5 text-[11.5px] leading-[1.45] text-text-tertiary">
                Your conversation is saved in this browser.
                {hasConversation && " Starting a new chat clears it."}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        aria-label={panelOpen ? "Close chat menu" : "Chat with us"}
        aria-expanded={panelOpen}
        onClick={() => {
          setInstantClose(false);
          setPanelOpen((o) => !o);
        }}
        className="relative flex h-[58px] w-[58px] items-center justify-center rounded-full border-0 bg-ink text-cream shadow-lift cursor-pointer"
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={panelOpen ? "close" : "chat"}
            initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="absolute inset-0 grid place-items-center"
          >
            <Icon name={panelOpen ? "x" : "message-circle"} size={24} />
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
