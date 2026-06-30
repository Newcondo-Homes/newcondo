"use client";

/* ============================================================
   ChatButton — the floating live-chat launcher (public pages only).

   Tapping the bubble opens a small NewCondo-styled popover that lets the
   visitor start / continue a chat (powered by Crisp) and start a brand-new
   conversation. Chat history persists in the visitor's browser; signed-in
   users get their identity pre-filled in the Crisp dashboard.

   NOTE: this is mounted on the marketing / public surfaces only. Inside the
   authenticated platform app, owners/agents get dedicated in-product support
   instead, so the bubble is intentionally absent there.
   ============================================================ */

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { useCrisp } from "@/hooks/useCrisp";

const EASE = [0.22, 1, 0.36, 1] as const;

export function ChatButton() {
  const { available, unread, hasConversation, open, reset } = useCrisp();
  const [panelOpen, setPanelOpen] = useState(false);

  // No website id configured → don't render a dead bubble.
  if (!available) return null;

  function startChat() {
    open();
    setPanelOpen(false);
  }

  function newChat() {
    reset();
    setPanelOpen(false);
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
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.28, ease: EASE }}
            style={{ transformOrigin: "bottom right" }}
            className="w-[300px] max-w-[calc(100vw-48px)] overflow-hidden rounded-[16px] border border-border-hair bg-surface shadow-pop"
          >
            {/* Header */}
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

            {/* Body */}
            <div className="flex flex-col gap-2.5 p-4">
              <button
                onClick={startChat}
                className="group flex items-center justify-between gap-3 rounded-[12px] bg-ink px-4 py-3 text-left text-cream transition-[background,transform] duration-200 ease-nc hover:bg-ink-soft active:scale-[0.98]"
              >
                <span className="flex items-center gap-2.5">
                  <Icon name="message-square-text" size={18} />
                  <span className="text-[14.5px] font-semibold">
                    {hasConversation ? "Continue chatting" : "Start a chat"}
                  </span>
                </span>
                <Icon
                  name="arrow-right"
                  size={16}
                  className="transition-transform duration-200 ease-nc group-hover:translate-x-1"
                />
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

      {/* Launcher bubble */}
      <motion.button
        aria-label={panelOpen ? "Close chat menu" : "Chat with us"}
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen((o) => !o)}
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

        {!panelOpen && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-[22px] h-[22px] place-items-center rounded-full bg-green px-1.5 text-[12px] font-bold text-cream ring-2 ring-[var(--nc-background)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>
    </div>
  );
}
