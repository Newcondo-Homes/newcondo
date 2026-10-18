// backend/shared/src/money/reconcile.ts
// ============================================================
// Nightly reconciliation — proves the ledger and the bank agree.
//
//   1. Every account's cached balanceKobo == Σ its entries   (drift = bug)
//   2. Σ every non-WORLD balance == −world balance           (double-entry holds)
//   3. Flutterwave NGN balance ≈ cash we should hold
//        = −world − transit:payouts   (Flutterwave debits a transfer the
//          moment it is queued, before the bank confirms)
// Never auto-corrects. It reports; a human decides.
// ============================================================
import axios from "axios";
import { prisma } from "@newcondo/db";
import { flutterwaveConfig } from "../config/flutterwave";
import { MONEY } from "../constants/money";
import { ACC } from "./accounts";
import { toKobo, toNaira, type Kobo } from "./kobo";

export interface ReconcileReport {
  at: string;
  driftedAccounts: { code: string; cachedKobo: string; entriesKobo: string }[];
  doubleEntryHolds: boolean;
  expectedCashNaira: number;
  /** ++ FLW FEES — fees users paid us minus fees Flutterwave took. Should sit
   *  near ₦0 (small + from rounding up); a growing negative means charges are
   *  costing more than FLW_FEES prices them (foreign cards, a fee change). */
  processingFloatNaira: number;
  flutterwaveAvailableNaira: number | null;
  differenceNaira: number | null;
  ok: boolean;
}

export async function reconcileLedger(): Promise<ReconcileReport> {
  const [accounts, sums] = await Promise.all([
    prisma.ledgerAccount.findMany({ select: { id: true, code: true, kind: true, balanceKobo: true } }),
    prisma.ledgerEntry.groupBy({ by: ["accountId"], _sum: { amountKobo: true } }),
  ]);
  const byId = new Map(sums.map((s) => [s.accountId, s._sum.amountKobo ?? 0n]));

  const driftedAccounts = accounts
    .filter((a) => (byId.get(a.id) ?? 0n) !== a.balanceKobo)
    .map((a) => ({ code: a.code, cachedKobo: a.balanceKobo.toString(), entriesKobo: String(byId.get(a.id) ?? 0n) }));

  const world = accounts.find((a) => a.code === ACC.world)?.balanceKobo ?? 0n;
  const transit = accounts.find((a) => a.code === ACC.payoutsInTransit)?.balanceKobo ?? 0n;
  const internal = accounts.filter((a) => a.kind !== "WORLD").reduce((s, a) => s + a.balanceKobo, 0n);
  const doubleEntryHolds = internal === -world;
  const expected: Kobo = -world - transit;

  let flwAvailable: number | null = null;
  try {
    const base = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";
    const res = await axios.get(`${base}/balances/NGN`, {
      headers: { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` },
      timeout: 15_000,
    });
    flwAvailable = Number(res.data?.data?.available_balance ?? NaN);
    if (!Number.isFinite(flwAvailable)) flwAvailable = null;
  } catch (e) {
    console.error("[reconcile] could not read Flutterwave balance:", (e as Error).message);
  }

  const difference = flwAvailable === null ? null : flwAvailable - toNaira(expected);
  const ok =
    driftedAccounts.length === 0 &&
    doubleEntryHolds &&
    (difference === null || Math.abs(difference) <= MONEY.reconciliationToleranceNaira);

  const report: ReconcileReport = {
    at: new Date().toISOString(),
    driftedAccounts,
    doubleEntryHolds,
    expectedCashNaira: toNaira(expected),
    processingFloatNaira: toNaira(accounts.find((a) => a.code === ACC.processing)?.balanceKobo ?? 0n),
    flutterwaveAvailableNaira: flwAvailable,
    differenceNaira: difference,
    ok,
  };
  (ok ? console.log : console.error)(`[reconcile] ${JSON.stringify(report)}`);
  return report;
}

// Re-exported for scripts that need to seed opening balances in naira.
export { toKobo };
