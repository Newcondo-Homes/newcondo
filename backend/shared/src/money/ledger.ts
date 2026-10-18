// backend/shared/src/money/ledger.ts
// ============================================================
// THE LEDGER — double-entry, idempotent, race-safe.
//
// Every money movement in Newcondo (rent, escrow release, commission split,
// subscription, marking fee, vendor payout, withdrawal, referral override) is
// ONE call to postLedger() inside the same DB transaction as the business
// write it belongs to. That gives three guarantees no amount of "update the
// balance column" code can:
//
//   1. Balanced   — legs must sum to 0 kobo, or nothing is written.
//   2. Exactly-once — idempotencyKey is unique. Flutterwave retries webhooks,
//                  crons overlap; the second post is a no-op that returns the
//                  first transaction.
//   3. No overdraft — a debit from a non-WORLD account is a conditional
//                  UPDATE … WHERE balanceKobo >= amount. Two withdrawals racing
//                  for the same ₦50,000 cannot both succeed.
//
// Accounts are touched in a stable order (sorted by code) so concurrent
// transactions lock rows in the same sequence and cannot deadlock.
// ============================================================
import { prisma } from "@newcondo/db";
import type { Prisma, LedgerTxnType } from "@newcondo/db";
import { specFor } from "./accounts";
import type { Kobo } from "./kobo";

export type Tx = Prisma.TransactionClient;

export interface Leg {
  account: string;
  /** +credit / −debit, in kobo. */
  amountKobo: Kobo;
}

export interface PostInput {
  idempotencyKey: string;
  type: LedgerTxnType;
  sourceType: string;
  sourceId: string;
  paymentId?: string | null;
  memo?: string;
  metadata?: Record<string, unknown>;
  createdBy?: string;
  legs: Leg[];
}

export interface PostResult {
  transactionId: string;
  duplicate: boolean;
}

export class InsufficientFundsError extends Error {
  readonly statusCode = 409;
  constructor(readonly account: string, readonly neededKobo: Kobo) {
    super(`Insufficient balance in ${account}`);
  }
}

export class UnbalancedLedgerError extends Error {
  constructor(readonly sumKobo: Kobo) {
    super(`Ledger transaction does not balance (Σ = ${sumKobo} kobo)`);
  }
}

/** Get-or-create the account row for a code. Upsert on the unique code, so
 *  two transactions opening the same wallet at once both succeed. */
export async function ensureAccount(tx: Tx, code: string): Promise<{ id: string; allowNegative: boolean }> {
  const spec = specFor(code);
  return tx.ledgerAccount.upsert({
    where: { code },
    create: { code, kind: spec.kind, userId: spec.userId, allowNegative: spec.allowNegative },
    update: {},
    select: { id: true, allowNegative: true },
  });
}

/** Post one balanced transaction. MUST be called with the caller's `tx` so it
 *  commits or rolls back together with the business write. */
export async function postLedger(tx: Tx, input: PostInput): Promise<PostResult> {
  if (!input.legs.length) throw new Error("postLedger: no legs");
  const legs = mergeLegs(input.legs);
  const sum = legs.reduce((s, l) => s + l.amountKobo, 0n);
  if (sum !== 0n) throw new UnbalancedLedgerError(sum);
  if (legs.every((l) => l.amountKobo === 0n)) throw new Error("postLedger: all legs are zero");

  const existing = await tx.ledgerTransaction.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    select: { id: true },
  });
  if (existing) return { transactionId: existing.id, duplicate: true };

  const txn = await tx.ledgerTransaction.create({
    data: {
      idempotencyKey: input.idempotencyKey,
      type: input.type,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      paymentId: input.paymentId ?? null,
      memo: input.memo,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      createdBy: input.createdBy ?? "system",
    },
    select: { id: true },
  });

  const entries: { transactionId: string; accountId: string; amountKobo: bigint }[] = [];
  for (const leg of [...legs].sort((a, b) => a.account.localeCompare(b.account))) {
    if (leg.amountKobo === 0n) continue;
    const acct = await ensureAccount(tx, leg.account);
    if (leg.amountKobo < 0n && !acct.allowNegative) {
      const need = -leg.amountKobo;
      const { count } = await tx.ledgerAccount.updateMany({
        where: { id: acct.id, balanceKobo: { gte: need } },
        data: { balanceKobo: { decrement: need } },
      });
      if (count === 0) throw new InsufficientFundsError(leg.account, need);
    } else {
      await tx.ledgerAccount.update({
        where: { id: acct.id },
        data: { balanceKobo: { increment: leg.amountKobo } },
      });
    }
    entries.push({ transactionId: txn.id, accountId: acct.id, amountKobo: leg.amountKobo });
  }
  await tx.ledgerEntry.createMany({ data: entries });
  return { transactionId: txn.id, duplicate: false };
}

/** Same account named twice in one transaction → one net leg. */
function mergeLegs(legs: Leg[]): Leg[] {
  const m = new Map<string, Kobo>();
  for (const l of legs) m.set(l.account, (m.get(l.account) ?? 0n) + l.amountKobo);
  return [...m.entries()].map(([account, amountKobo]) => ({ account, amountKobo }));
}

/** Prisma unique-violation on idempotencyKey — a concurrent duplicate that
 *  lost the race. Callers treat it exactly like `duplicate: true`. */
export function isDuplicatePost(e: unknown): boolean {
  const err = e as { code?: string; meta?: { target?: unknown } };
  return err?.code === "P2002" && JSON.stringify(err.meta?.target ?? "").includes("idempotencyKey");
}

/** Convenience for callers that only need the ledger write: runs its own
 *  transaction and maps a lost race to a duplicate result. */
export async function postLedgerStandalone(input: PostInput): Promise<PostResult> {
  try {
    return await prisma.$transaction((tx) => postLedger(tx, input));
  } catch (e) {
    if (isDuplicatePost(e)) {
      const row = await prisma.ledgerTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true } });
      return { transactionId: row!.id, duplicate: true };
    }
    throw e;
  }
}

/* ---------------- reads ---------------- */

export async function balanceOf(code: string, client: Tx | typeof prisma = prisma): Promise<Kobo> {
  const row = await client.ledgerAccount.findUnique({ where: { code }, select: { balanceKobo: true } });
  return row?.balanceKobo ?? 0n;
}

export interface StatementLine {
  id: string;
  at: Date;
  type: LedgerTxnType;
  memo: string | null;
  amountKobo: Kobo;
  bucket: "available" | "pending";
  paymentId: string | null;
  sourceType: string;
  sourceId: string;
}

/** A user's wallet movements, newest first — what the wallet page lists. */
export async function statementFor(userId: string, opts: { page?: number; pageSize?: number } = {}) {
  const pageSize = Math.min(100, Math.max(1, opts.pageSize ?? 20));
  const page = Math.max(1, opts.page ?? 1);
  const where = { account: { userId } };
  const [total, rows] = await Promise.all([
    prisma.ledgerEntry.count({ where }),
    prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, amountKobo: true, createdAt: true,
        account: { select: { kind: true } },
        transaction: { select: { type: true, memo: true, paymentId: true, sourceType: true, sourceId: true } },
      },
    }),
  ]);
  const lines: StatementLine[] = rows.map((r) => ({
    id: r.id,
    at: r.createdAt,
    type: r.transaction.type,
    memo: r.transaction.memo,
    amountKobo: r.amountKobo,
    bucket: r.account.kind === "USER_PENDING" ? "pending" : "available",
    paymentId: r.transaction.paymentId,
    sourceType: r.transaction.sourceType,
    sourceId: r.transaction.sourceId,
  }));
  return { total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)), lines };
}
