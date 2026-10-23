// backend/payment-service/src/services/vendorPayout.service.ts
// ============================================================
// Vendor payouts — fumigation, waste, inspection (+ legacy repairs).
//
// ++ VENDORS: payouts now come from the PROPERTY'S SERVICE FUND
// (fund:{propertyId}:{service}), never from platform:revenue. The fund only
// ever holds the vendor-cost share of what the owner has paid, and postLedger
// refuses to overdraw it — so a vendor can't be paid out of profit even by
// mistake. Legacy jobs with no assignment (pre-network, admin-dispatched
// repairs) still pay from revenue as before.
//
// Two timings (Vendor.releaseMode):
//   INSTANT     payVendorForJob() right after the visit code is verified
//               (combined-backend injects it into the verify route).
//   END_OF_DAY  payEndOfDayBatches() at VENDORS.payout.endOfDayHour: ONE
//               transfer per vendor for everything verified — one fee.
//
// Two-phase like withdrawals:
//   send   source → transit:payouts, then Flutterwave transfer
//   settle (transfer webhook) NC-VP-* → settleVendorPayout, NC-VB-* → settleVendorBatch
//          success → transit → world · failure → transit → source (retryable)
//
// The vendor bears Flutterwave's transfer fee, exactly like a user withdrawal.
// WEBHOOK: add next to the NC-VP- line in webhooks/flutterwave.webhook.ts
//   if (t.reference.startsWith("NC-VB-")) { await settleVendorBatch(t.reference, ok, t.feeNaira); return "vendor-batch-settled"; }
// ============================================================
import axios from "axios";
import { randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import {
  ACC, postLedger, toKobo, toNaira, flutterwaveConfig, MONEY, VENDORS, conflict, notFound, badGateway,
  payoutBreakdown, payoutSettleLegs, FLW_FEES, publishNotification, sendBrandedEmail, VendorEmailTemplates,
} from "@newcondo/backend-shared";

const FLW_BASE = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";

type PayJob = { id: string; propertyId: string; serviceType: string; assignmentId: string | null; cost: unknown };
const sourceFor = (j: PayJob) => (j.assignmentId ? ACC.serviceFund(j.propertyId, j.serviceType) : ACC.revenue);

async function transfer(v: { bankCode: string; accountNumber: string }, amountNaira: number, reference: string, narration: string) {
  const res = await axios.post(
    `${FLW_BASE}/transfers`,
    { account_bank: v.bankCode, account_number: v.accountNumber, amount: amountNaira, currency: "NGN", reference, narration, debit_currency: "NGN" },
    { headers: { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` }, timeout: 20_000 }
  );
  if (res.data?.status !== "success") throw new Error(res.data?.message ?? "rejected");
}

function assertPayable(v: { status?: string | null; accountNumber: string | null; bankCode: string | null; bankVerifiedAt?: Date | null } | null, legacy: boolean) {
  if (!v?.accountNumber || !v.bankCode) throw conflict("The vendor has no verified bank account");
  if (!legacy && (v.status !== "VERIFIED" || !v.bankVerifiedAt)) throw conflict("The vendor isn't verified for payouts yet");
}

export async function payVendorForJob(jobId: string, by = "system"): Promise<{ reference: string; amount: number; feeNaira: number; receiveNaira: number }> {
  const job = await prisma.serviceJob.findUnique({ where: { id: jobId }, include: { vendor: true, property: { select: { title: true } } } });
  if (!job) throw notFound("Service job not found");
  if (job.status !== "COMPLETED") throw conflict("Only completed jobs are paid");
  if (job.payoutRef || job.payoutBatchId) throw conflict("This job has already been paid");
  if (job.assignmentId && !job.verifiedAt) throw conflict("This visit hasn't been verified with a code");
  const amount = Number(job.cost);
  if (!(amount > 0)) throw conflict("This job has no cost recorded");
  const v = job.vendor;
  assertPayable(v, !job.assignmentId);

  const payout = payoutBreakdown(amount);
  if (payout.receiveNaira < FLW_FEES.minTransferNaira) throw conflict("Job cost is below the minimum payout after Flutterwave's fee");
  const reference = `NC-VP-${Date.now()}-${randomBytes(4).toString("hex")}`;
  await prisma.$transaction(async (tx) => {
    const { count } = await tx.serviceJob.updateMany({ where: { id: jobId, payoutRef: null, payoutBatchId: null }, data: { payoutRef: reference } });
    if (!count) throw conflict("This job is already being paid");
    await postLedger(tx, {
      idempotencyKey: `vendor-pay:${reference}`, type: "VENDOR_PAYOUT", sourceType: "SERVICE_JOB", sourceId: jobId, createdBy: by,
      memo: `${v!.name} — ${job.serviceType} at ${job.property.title}`,
      metadata: { feeNaira: payout.feeNaira, receiveNaira: payout.receiveNaira, source: sourceFor(job) },
      legs: [{ account: sourceFor(job), amountKobo: -toKobo(amount) }, { account: ACC.payoutsInTransit, amountKobo: toKobo(amount) }],
    });
  });

  try {
    await transfer({ bankCode: v!.bankCode!, accountNumber: v!.accountNumber! }, payout.receiveNaira, reference, `Newcondo ${job.serviceType}`);
  } catch (e) {
    await settleVendorPayout(reference, false);
    throw badGateway(`Vendor transfer failed: ${(e as Error).message}`);
  }
  return { reference, amount, feeNaira: payout.feeNaira, receiveNaira: payout.receiveNaira };
}

export async function settleVendorPayout(reference: string, ok: boolean, actualFeeNaira?: number | null): Promise<void> {
  const job = await prisma.serviceJob.findUnique({
    where: { payoutRef: reference },
    select: { id: true, cost: true, paidOutAt: true, propertyId: true, serviceType: true, assignmentId: true, vendor: { select: { userId: true, name: true, email: true, bankName: true, accountNumber: true } } },
  });
  if (!job || job.paidOutAt) return;
  const kobo = toKobo(job.cost);
  const payout = payoutBreakdown(Number(job.cost)); // deterministic — same figures as at send time
  await prisma.$transaction(async (tx) => {
    if (ok) {
      await tx.serviceJob.update({ where: { id: job.id }, data: { paidOutAt: new Date() } });
      await postLedger(tx, {
        idempotencyKey: `vendor-settle:${reference}`, type: "VENDOR_PAYOUT", sourceType: "SERVICE_JOB", sourceId: job.id,
        memo: "Vendor transfer delivered",
        legs: payoutSettleLegs({ requestedKobo: kobo, sentKobo: toKobo(payout.receiveNaira), actualFeeKobo: toKobo(actualFeeNaira ?? payout.feeNaira) }),
      });
    } else {
      await postLedger(tx, {
        idempotencyKey: `vendor-reverse:${reference}`, type: "VENDOR_PAYOUT", sourceType: "SERVICE_JOB", sourceId: job.id,
        memo: "Vendor transfer failed — returned to its source",
        legs: [{ account: ACC.payoutsInTransit, amountKobo: -kobo }, { account: sourceFor(job), amountKobo: kobo }],
      });
      await tx.serviceJob.update({ where: { id: job.id }, data: { payoutRef: null } });
    }
  });
  if (ok) await announcePayout(job.vendor, payout.receiveNaira, 1);
}

/* ---------- END_OF_DAY: one transfer per vendor ---------- */

export async function payEndOfDayBatches(): Promise<number> {
  const vendors = await prisma.vendor.findMany({
    where: { releaseMode: "END_OF_DAY", status: "VERIFIED", bankVerifiedAt: { not: null }, jobs: { some: { status: "COMPLETED", verifiedAt: { not: null }, paidOutAt: null, payoutRef: null, payoutBatchId: null } } },
    select: { id: true, name: true, bankCode: true, accountNumber: true },
  });
  let sent = 0;
  for (const v of vendors) {
    try { if (await payVendorBatch(v)) sent++; } catch (e) { console.error(`[vendor-batch] ${v.id}:`, (e as Error).message); }
  }
  return sent;
}

async function payVendorBatch(v: { id: string; name: string; bankCode: string | null; accountNumber: string | null }): Promise<boolean> {
  if (!v.bankCode || !v.accountNumber) return false;
  const reference = `NC-VB-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const total = await prisma.$transaction(async (tx) => {
    const jobs = await tx.serviceJob.findMany({ where: { vendorId: v.id, status: "COMPLETED", verifiedAt: { not: null }, paidOutAt: null, payoutRef: null, payoutBatchId: null }, select: { id: true, propertyId: true, serviceType: true, assignmentId: true, cost: true }, take: 100 });
    if (!jobs.length) return 0n;
    const batch = await tx.vendorPayoutBatch.create({ data: { vendorId: v.id, reference, amountKobo: 0n, jobCount: jobs.length } });
    let sum = 0n;
    for (const j of jobs) {
      const { count } = await tx.serviceJob.updateMany({ where: { id: j.id, payoutRef: null, payoutBatchId: null }, data: { payoutBatchId: batch.id } });
      if (!count) continue;
      const k = toKobo(Number(j.cost));
      await postLedger(tx, {
        idempotencyKey: `vendor-batch:${reference}:${j.id}`, type: "VENDOR_PAYOUT", sourceType: "SERVICE_JOB", sourceId: j.id,
        memo: `${v.name} — end-of-day payout`, legs: [{ account: sourceFor(j), amountKobo: -k }, { account: ACC.payoutsInTransit, amountKobo: k }],
      });
      sum += k;
    }
    await tx.vendorPayoutBatch.update({ where: { id: batch.id }, data: { amountKobo: sum } });
    return sum;
  });
  if (total <= 0n) return false;
  const payout = payoutBreakdown(toNaira(total));
  try {
    await transfer({ bankCode: v.bankCode, accountNumber: v.accountNumber }, payout.receiveNaira, reference, "Newcondo service payouts");
  } catch (e) {
    await settleVendorBatch(reference, false);
    throw e;
  }
  return true;
}

export async function settleVendorBatch(reference: string, ok: boolean, actualFeeNaira?: number | null): Promise<void> {
  const batch = await prisma.vendorPayoutBatch.findUnique({
    where: { reference },
    select: { id: true, status: true, amountKobo: true, jobCount: true, vendor: { select: { userId: true, name: true, email: true, bankName: true, accountNumber: true } },
      jobs: { select: { id: true, propertyId: true, serviceType: true, assignmentId: true, cost: true } } },
  });
  if (!batch || batch.status !== "SENT") return;
  const payout = payoutBreakdown(toNaira(batch.amountKobo));
  await prisma.$transaction(async (tx) => {
    if (ok) {
      await tx.serviceJob.updateMany({ where: { payoutBatchId: batch.id }, data: { paidOutAt: new Date() } });
      await tx.vendorPayoutBatch.update({ where: { id: batch.id }, data: { status: "SETTLED", settledAt: new Date() } });
      await postLedger(tx, {
        idempotencyKey: `vendor-batch-settle:${reference}`, type: "VENDOR_PAYOUT", sourceType: "SERVICE_JOB", sourceId: batch.id, memo: "Vendor batch delivered",
        legs: payoutSettleLegs({ requestedKobo: batch.amountKobo, sentKobo: toKobo(payout.receiveNaira), actualFeeKobo: toKobo(actualFeeNaira ?? payout.feeNaira) }),
      });
    } else {
      for (const j of batch.jobs) {
        const k = toKobo(Number(j.cost));
        await postLedger(tx, {
          idempotencyKey: `vendor-batch-reverse:${reference}:${j.id}`, type: "VENDOR_PAYOUT", sourceType: "SERVICE_JOB", sourceId: j.id,
          memo: "Vendor batch failed — returned to its source", legs: [{ account: ACC.payoutsInTransit, amountKobo: -k }, { account: sourceFor(j), amountKobo: k }],
        });
      }
      await tx.serviceJob.updateMany({ where: { payoutBatchId: batch.id }, data: { payoutBatchId: null } });
      await tx.vendorPayoutBatch.update({ where: { id: batch.id }, data: { status: "FAILED" } });
    }
  });
  if (ok) await announcePayout(batch.vendor, payout.receiveNaira, batch.jobCount);
}

async function announcePayout(v: { userId: string | null; name: string; email: string | null; bankName: string | null; accountNumber: string | null } | null, naira: number, jobs: number) {
  if (!v) return;
  const bank = `${v.bankName ?? "your bank"} ••${(v.accountNumber ?? "").slice(-4)}`;
  if (v.userId) await publishNotification({ userId: v.userId, kind: "wallet", title: `₦${naira.toLocaleString("en-NG")} sent to ${bank}`, body: `${jobs} verified job(s)`, to: "/payouts" });
  if (v.email) void sendBrandedEmail(v.email, VendorEmailTemplates.payoutSent({ name: v.name, amountNaira: naira, jobs, bank }));
}

/** Hourly cron — retries for INSTANT vendors whose transfer failed, plus
 *  legacy (admin-completed, no code) jobs after MONEY.vendors.releaseHours. */
export async function payDueVendorJobs(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - MONEY.vendors.releaseHours * 3600_000);
  const due = await prisma.serviceJob.findMany({
    where: {
      status: "COMPLETED", payoutRef: null, payoutBatchId: null, cost: { gt: 0 }, vendor: { accountNumber: { not: null } },
      OR: [
        { verifiedAt: { not: null }, vendor: { releaseMode: "INSTANT" } },
        { assignmentId: null, completedAt: { lte: cutoff } },
      ],
    },
    select: { id: true }, take: 200,
  });
  let paid = 0;
  for (const j of due) {
    try { await payVendorForJob(j.id); paid++; } catch (e) { console.error(`[vendor-payout] ${j.id}:`, (e as Error).message); }
  }
  return paid;
}

export const VENDOR_EOD_CRON = `0 ${VENDORS.payout.endOfDayHour} * * *`;
