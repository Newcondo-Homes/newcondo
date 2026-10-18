// backend/shared/src/money/inbound.ts
// ============================================================
// Inbound bank transfers to the central account (and, in PER_USER_VA mode,
// to a user's own NUBAN).
//
// Cash arrives BEFORE we know what it is for, so it is booked in two steps:
//   1. recordInboundTransfer()  world → suspense:inbound   (always, immediately)
//   2. the purpose handler      suspense → escrow/revenue  (when matched)
// Step 1 is what makes the ledger agree with Flutterwave's balance the
// instant money lands; step 2 can happen seconds later (automatic reference
// match) or days later (admin resolves it from the suspense queue).
// ============================================================
import { prisma } from "@newcondo/db";
import { MONEY } from "../constants/money";
import { ACC } from "./accounts";
import { postLedger, type Tx } from "./ledger";
import { toKobo, type Kobo } from "./kobo";
import { getAccountProvider } from "./providers";
import { settledFromFlutterwave, estimateSettledKobo } from "./collect";

/** tx_ref prefixes created by OUR checkouts. Anything else that is a bank
 *  transfer is an unsolicited credit to the central account / a VA. */
export const CHECKOUT_PREFIXES = ["NC-SUB-", "NC-RENEW-", "NC-RENT-", "NC-MKFEE-", "NC-PSUB-"] as const;

const REF_RE = new RegExp(MONEY.transferReferencePattern);

/** First NC-… token in a narration ("Rent NC-RENT-1727-ab12 Flat B" → "NC-RENT-1727-ab12"). */
export function extractReference(text?: string | null): string | null {
  if (!text) return null;
  const m = REF_RE.exec(text.toUpperCase().replace(/\s+/g, " "));
  if (!m) return null;
  // Narrations are upper-cased by most banks; our refs end in lowercase hex.
  return m[0].replace(/-([A-F0-9]{8})$/, (_s, h: string) => `-${h.toLowerCase()}`);
}

export interface InboundCredit {
  flwTransactionId: string;
  accountNumber: string;
  amountKobo: Kobo;
  /** what Flutterwave settled after its fee; null = estimate from FLW_FEES */
  settledKobo: Kobo | null;
  narration: string | null;
  senderName: string | null;
  senderAccount: string | null;
  senderBank: string | null;
  raw: unknown;
}

/** Shape a VERIFIED Flutterwave transaction into an InboundCredit, or null
 *  when it is one of our own checkout charges. */
export function parseInboundCredit(tx: Record<string, any>): InboundCredit | null {
  const txRef = String(tx?.tx_ref ?? "");
  if (CHECKOUT_PREFIXES.some((p) => txRef.startsWith(p))) return null;
  if (String(tx?.payment_type ?? "").toLowerCase() !== "bank_transfer") return null;
  if ((tx?.currency ?? "NGN") !== "NGN") return null;
  const meta = (tx?.meta ?? {}) as Record<string, any>;
  return {
    flwTransactionId: String(tx.id),
    accountNumber: String(meta.account_number ?? meta.beneficiary_account_number ?? MONEY.centralAccount.accountNumber),
    amountKobo: toKobo(tx.amount),
    // Flutterwave deducts its collection fee + stamp duty before settling.
    settledKobo: settledFromFlutterwave(tx),
    narration: tx.narration ?? meta.narration ?? null,
    senderName: meta.originatorname ?? tx.customer?.name ?? null,
    senderAccount: meta.originatoraccountnumber ?? null,
    senderBank: meta.bankname ?? null,
    raw: tx,
  };
}

export interface RecordedInbound {
  transferId: string;
  reference: string | null;
  ownerUserId: string | null;
  duplicate: boolean;
  amountKobo: Kobo;
}

/** Step 1 — book the cash. Idempotent on the Flutterwave transaction id.
 *  Suspense holds the GROSS the payer sent (that's what gets matched against
 *  the amount due); Flutterwave's cut is booked to platform:processing now,
 *  and repaid from the processing fee the payer included when it's matched. */
export async function recordInboundTransfer(c: InboundCredit): Promise<RecordedInbound> {
  const seen = await prisma.inboundTransfer.findUnique({
    where: { flwTransactionId: c.flwTransactionId },
    select: { id: true, reference: true, amountKobo: true },
  });
  if (seen) return { transferId: seen.id, reference: seen.reference, ownerUserId: null, duplicate: true, amountKobo: seen.amountKobo };

  const reference = extractReference(c.narration);
  const ownerUserId = await getAccountProvider().ownerOfAccountNumber(c.accountNumber);

  const settled = c.settledKobo ?? estimateSettledKobo(c.amountKobo);
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.inboundTransfer.create({
      data: {
        flwTransactionId: c.flwTransactionId,
        accountNumber: c.accountNumber,
        amountKobo: c.amountKobo,
        narration: c.narration,
        reference,
        senderName: c.senderName,
        senderAccount: c.senderAccount,
        senderBank: c.senderBank,
        raw: c.raw as never,
      },
      select: { id: true },
    });
    await postLedger(tx, {
      idempotencyKey: `inbound:${c.flwTransactionId}`,
      type: "INBOUND_TRANSFER",
      sourceType: "INBOUND",
      sourceId: created.id,
      memo: `Bank transfer from ${c.senderName ?? "unknown sender"}`,
      legs: [
        { account: ACC.world, amountKobo: -settled },
        { account: ACC.suspense, amountKobo: c.amountKobo },
        ...(c.amountKobo - settled !== 0n ? [{ account: ACC.processing, amountKobo: settled - c.amountKobo }] : []),
      ],
    });
    return created;
  });
  return { transferId: row.id, reference, ownerUserId, duplicate: false, amountKobo: c.amountKobo };
}

/** Step 2 bookkeeping — call inside the purpose handler's transaction. */
export async function markInboundMatched(tx: Tx, transferId: string, paymentId: string, resolvedBy = "system") {
  await tx.inboundTransfer.update({
    where: { id: transferId },
    data: { status: "MATCHED", matchedPaymentId: paymentId, matchedAt: new Date(), resolvedBy },
  });
}


export interface SuspenseRow {
  id: string;
  flwTransactionId: string;
  accountNumber: string;
  amountKobo: bigint;
  senderName: string | null;
  senderAccount: string | null;
  senderBank: string | null;
  narration: string | null;
  reference: string | null;
  status: string;
  createdAt: Date;
}

export interface SuspensePage {
  total: number;
  page: number;
  pageSize: number;
  rows: SuspenseRow[];
}


/** Admin queue — what is sitting in suspense and since when. */
export async function listSuspense(opts: { page?: number; pageSize?: number } = {}): Promise<SuspensePage>  {
  const pageSize = Math.min(100, opts.pageSize ?? 25);
  const page = Math.max(1, opts.page ?? 1);
  const where = { status: "UNMATCHED" as const };
  const [total, rows] = await Promise.all([
    prisma.inboundTransfer.count({ where }),
    prisma.inboundTransfer.findMany({ where, orderBy: { createdAt: "asc" }, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return { total, page, pageSize, rows };
}
