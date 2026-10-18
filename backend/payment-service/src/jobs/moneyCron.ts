// backend/payment-service/src/jobs/moneyCron.ts
// ============================================================
// Every scheduled money task in one place (Africa/Lagos). Started once from
// combined-backend/src/server.ts:  startMoneyCron({ extra: [...] })
// Each task is idempotent, so an overlapping run or a restart mid-run is safe.
// ============================================================
import cron from "node-cron";
import { prisma } from "@newcondo/db";
import { Referrals, reconcileLedger } from "@newcondo/backend-shared";
import { releaseExpiredEscrows } from "../services/commissionSplit.service";
import { runAutoPayouts } from "../services/wallet.service";
import { payDueVendorJobs } from "../services/vendorPayout.service";

type Task = { name: string; schedule: string; run: () => Promise<unknown> };

const isLastDayOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getDate() === 1;

const TASKS: Task[] = [
  { name: "escrow-release", schedule: "*/10 * * * *", run: releaseExpiredEscrows },
  { name: "auto-payout-instant", schedule: "*/15 * * * *", run: () => runAutoPayouts("INSTANT") },
  { name: "auto-payout-weekly", schedule: "0 9 * * 5", run: () => runAutoPayouts("WEEKLY") },
  { name: "auto-payout-monthly", schedule: "0 9 * * *", run: async () => (isLastDayOfMonth() ? runAutoPayouts("MONTHLY") : "not-today") },
  { name: "vendor-payouts", schedule: "30 * * * *", run: () => payDueVendorJobs() },
  { name: "referral-release", schedule: "5 * * * *", run: () => Referrals.releaseScheduledRewards() },
  { name: "referral-expiry", schedule: "0 2 * * *", run: () => Referrals.expireCredits() },
  {
    name: "referral-funding-recheck", schedule: "15 2 * * *",
    run: async () => {
      const ids = await prisma.referralLedgerEntry.findMany({ where: { status: "PENDING_FUNDING" }, select: { userId: true }, distinct: ["userId"] });
      for (const { userId } of ids) await Referrals.recheckPendingFunding(userId);
      return ids.length;
    },
  },
  { name: "ledger-reconcile", schedule: "0 3 * * *", run: reconcileLedger },
];

export function startMoneyCron(opts: { extra?: Task[] } = {}): void {
  for (const t of [...TASKS, ...(opts.extra ?? [])]) {
    let running = false;
    cron.schedule(t.schedule, async () => {
      if (running) return; // never overlap a slow run with the next tick
      running = true;
      try { const out = await t.run(); console.log(`[money-cron] ${t.name}:`, out); }
      catch (e) { console.error(`[money-cron] ${t.name} failed:`, e); }
      finally { running = false; }
    }, { timezone: "Africa/Lagos" });
  }
  console.log(`[money-cron] scheduled ${TASKS.length + (opts.extra?.length ?? 0)} tasks`);
}
