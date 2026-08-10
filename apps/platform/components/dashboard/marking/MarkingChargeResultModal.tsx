"use client";

/* ============================================================
   MarkingChargeResultModal

   Outcome of a saved-card (tokenized) marking charge.

   SUCCESS  → what was charged, on which card, and what happens next.
   FAILURE  → the bank's reason in plain words. Insufficient funds gets its
              own treatment: it isn't a broken card, it's an empty account,
              so the copy asks them to fund the account and try again rather
              than offering a different card.

   Failure codes come from the backend's classifyFailure() so the copy is
   driven by the real processor response, never guessed client-side.
   ============================================================ */

import { Icon } from "@/components/ui/icon";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, KV, Banner } from "@/components/dashboard/primitives";
import { ngn } from "@/lib/dashboard/format";
import type { ChargeFailureCode } from "@/lib/api/dashboard";

export interface MarkingChargeOutcome {
  ok: boolean;
  amount: number;
  reference: string;
  method: "BROADCAST" | "NEWCONDO";
  cardLabel?: string;
  failureCode?: ChargeFailureCode;
  failureMessage?: string;
  retryWithInline?: boolean;
}

/* Per-code copy. Everything else falls through to a neutral decline. */
const FAILURE_COPY: Record<
  ChargeFailureCode,
  { title: string; body: string; hint?: string; icon: string }
> = {
  INSUFFICIENT_FUNDS: {
    title: "Not enough funds in your account",
    body: "Your bank declined the charge because the balance on your saved card is too low to cover this marking fee.",
    hint: "Fund the account, then tap Try again — you have not been charged.",
    icon: "wallet",
  },
  CARD_DECLINED: {
    title: "Your bank declined the card",
    body: "The charge was refused by your bank. This is usually a card restriction on online or recurring payments.",
    hint: "Try another card, or call your bank to authorise the payment.",
    icon: "triangle-alert",
  },
  CARD_EXPIRED: {
    title: "Your saved card has expired",
    body: "The card we have on file is past its expiry date, so it can no longer be charged.",
    hint: "Pay with another card to continue — we'll save it for next time.",
    icon: "credit-card",
  },
  NO_SAVED_CARD: {
    title: "No saved card on file",
    body: "We don't have a card stored for your account yet.",
    hint: "Continue to the secure checkout to pay.",
    icon: "credit-card",
  },
  NETWORK: {
    title: "We couldn't reach the bank",
    body: "The connection to Flutterwave dropped before the charge completed.",
    hint: "You have not been charged. Please try again.",
    icon: "wifi-off",
  },
  UNKNOWN: {
    title: "The payment didn't go through",
    body: "Your bank did not complete the charge.",
    hint: "You have not been charged. Please try again.",
    icon: "triangle-alert",
  },
};

export function MarkingChargeResultModal({
  outcome,
  onClose,
  onRetry,
  onPayAnotherWay,
}: {
  outcome: MarkingChargeOutcome;
  onClose: () => void;
  /** Re-run the same saved-card charge. */
  onRetry: () => void;
  /** Open the Inline checkout so they can use a different card. */
  onPayAnotherWay: () => void;
}) {
  /* ---------------- SUCCESS ---------------- */
  if (outcome.ok) {
    return (
      <Modal
        title="Payment successful"
        sub={`${ngn(outcome.amount)} charged`}
        onClose={onClose}
        footer={<DBtn onClick={onClose}>Done</DBtn>}
      >
        <div className="mb-4 flex flex-col items-center py-2 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-green-wash text-green-dark">
            <Icon name="check" size={26} strokeWidth={2.4} />
          </span>
          <h3 className="mb-0 mt-3.5 text-[18px] font-bold tracking-[-0.02em]">
            Your marking job is live
          </h3>
          <p className="mb-0 mt-1.5 max-w-[42ch] text-[13px] leading-normal text-text-tertiary">
            {outcome.method === "BROADCAST"
              ? "Broadcasting to verified agents near the property — most jobs are picked up within hours."
              : "A vetted Newcondo agent will be assigned within 24 hours."}
          </p>
        </div>

        <div className="mb-1.5 flex items-center justify-between rounded-[14px] bg-surface-sunken px-4 py-[13px] text-[13.5px]">
          <span>Marking service fee</span>
          <b className="font-mono text-[15px]">{ngn(outcome.amount)}</b>
        </div>
        <KV k="Paid with" v={outcome.cardLabel ?? "Your saved card"} />
        <KV k="Reference" v={outcome.reference} mono />
        <div className="mt-3">
          <Banner icon="lock">
            The fee is held by Newcondo and only released to the marker after completion — with the
            balance released when you confirm.
          </Banner>
        </div>
      </Modal>
    );
  }

  /* ---------------- FAILURE ---------------- */
  const copy = FAILURE_COPY[outcome.failureCode ?? "UNKNOWN"] ?? FAILURE_COPY.UNKNOWN;
  const lowBalance = outcome.failureCode === "INSUFFICIENT_FUNDS";

  return (
    <Modal
      title="Payment not completed"
      sub={`${ngn(outcome.amount)} could not be charged`}
      onClose={onClose}
      footer={
        <>
          <DBtn variant="line" onClick={onClose}>
            Cancel
          </DBtn>
          {outcome.retryWithInline || outcome.failureCode === "NO_SAVED_CARD" ? (
            <DBtn onClick={onPayAnotherWay}>
              <Icon name="credit-card" size={14} strokeWidth={2.2} />
              Use another card
            </DBtn>
          ) : (
            <DBtn onClick={onRetry}>
              <Icon name="rotate-ccw" size={14} strokeWidth={2.2} />
              Try again
            </DBtn>
          )}
        </>
      }
    >
      <div className="mb-4 flex flex-col items-center py-2 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-[rgba(192,57,43,0.08)] text-danger">
          <Icon name={copy.icon} size={26} strokeWidth={2} />
        </span>
        <h3 className="mb-0 mt-3.5 text-[18px] font-bold tracking-[-0.02em]">{copy.title}</h3>
        <p className="mb-0 mt-1.5 max-w-[44ch] text-[13px] leading-normal text-text-tertiary">
          {copy.body}
        </p>
      </div>

      {lowBalance && (
        <div className="mb-3">
          <Banner tone="warn" icon="wallet">
            <b className="font-semibold">Add money to your account, then try again.</b>
            <div className="mt-0.5 text-[12.5px]">
              Nothing was taken from your card and your marking request has not been sent.
            </div>
          </Banner>
        </div>
      )}

      <div className="mb-1.5 flex items-center justify-between rounded-[14px] bg-surface-sunken px-4 py-[13px] text-[13.5px]">
        <span>Amount attempted</span>
        <b className="font-mono text-[15px]">{ngn(outcome.amount)}</b>
      </div>
      <KV k="Card" v={outcome.cardLabel ?? "Your saved card"} />
      {outcome.failureMessage && <KV k="Bank response" v={outcome.failureMessage} />}
      {outcome.reference && <KV k="Reference" v={outcome.reference} mono />}

      {!lowBalance && copy.hint && (
        <div className="mt-3">
          <Banner icon="info">{copy.hint}</Banner>
        </div>
      )}
    </Modal>
  );
}
