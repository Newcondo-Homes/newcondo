// backend/payment-service/src/services/vendorPayout.service.ts
// ============================================================
// Vendor payouts — fumigation, waste, inspection, repairs.
// Newcondo collects subscriptions into platform:revenue; vendors are paid
// from revenue when a job is DONE and the owner's issue window has passed
// (MONEY.vendors.releaseHours). Same two-phase shape as withdrawals:
//   payVendorForJob()   revenue → transit:payouts, then Flutterwave transfer
//   settleVendorPayout() (transfer webhook, NC-VP-*)
//        success → transit → world · failure → transit → revenue (retryable)
//
// ++ FLW FEES — the vendor bears Flutterwave's transfer fee, exactly like a
// user withdrawal: revenue is debited the job cost, the vendor's bank
// receives cost − fee (₦11/₦27/₦54). A failed transfer costs nothing.
// ============================================================
import axios from "axios";
import { randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import { ACC, postLedger, toKobo, flutterwaveConfig, MONEY, conflict, notFound, badGateway, payoutBreakdown, payoutSettleLegs, FLW_FEES } from "@newcondo/backend-shared";

const FLW_BASE = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";

export async function payVendorForJob(jobId: string, by = "system"): Promise<{ reference: string; amount: number; feeNaira: number; receiveNaira: number }> {
  const job = await prisma.serviceJob.findUnique({
    where: { id: jobId },
    include: { vendor: true, property: { select: { title: true } } },
  });
  if (!job) throw notFound("Service job not found");
  if (job.status !== "COMPLETED") throw conflict("Only completed jobs are paid");
  if (job.payoutRef) throw conflict("This job has already been paid");
  const amount = Number(job.cost);
  if (!(amount > 0)) throw conflict("This job has no cost recorded");
  const v = job.vendor;
  if (!v?.accountNumber || !v.bankCode) throw conflict("The vendor has no verified bank account");

  const payout = payoutBreakdown(amount);
  if (payout.receiveNaira < FLW_FEES.minTransferNaira) throw conflict("Job cost is below the minimum payout after Flutterwave's fee");
  const reference = `NC-VP-${Date.now()}-${randomBytes(4).toString("hex")}`;
  await prisma.$transaction(async (tx) => {
    // Claim the job first — the unique payoutRef makes a double payout impossible.
    const { count } = await tx.serviceJob.updateMany({ where: { id: jobId, payoutRef: null }, data: { payoutRef: reference } });
    if (!count) throw conflict("This job is already being paid");
    await postLedger(tx, {
      idempotencyKey: `vendor-pay:${reference}`,
      type: "VENDOR_PAYOUT",
      sourceType: "SERVICE_JOB",
      sourceId: jobId,
      createdBy: by,
      memo: `${v.name} — ${job.serviceType} at ${job.property.title}`,
      metadata: { feeNaira: payout.feeNaira, receiveNaira: payout.receiveNaira },
      legs: [{ account: ACC.revenue, amountKobo: -toKobo(amount) }, { account: ACC.payoutsInTransit, amountKobo: toKobo(amount) }],
    });
  });

  try {
    const res = await axios.post(
      `${FLW_BASE}/transfers`,
      { account_bank: v.bankCode, account_number: v.accountNumber, amount: payout.receiveNaira, currency: "NGN", reference, narration: `Newcondo ${job.serviceType}`, debit_currency: "NGN" },
      { headers: { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` }, timeout: 20_000 }
    );
    if (res.data?.status !== "success") throw new Error(res.data?.message ?? "rejected");
  } catch (e) {
    await settleVendorPayout(reference, false);
    throw badGateway(`Vendor transfer failed: ${(e as Error).message}`);
  }
  return { reference, amount, feeNaira: payout.feeNaira, receiveNaira: payout.receiveNaira };
}

export async function settleVendorPayout(reference: string, ok: boolean, actualFeeNaira?: number | null): Promise<void> {
  const job = await prisma.serviceJob.findUnique({ where: { payoutRef: reference }, select: { id: true, cost: true, paidOutAt: true } });
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
        memo: "Vendor transfer failed — returned to revenue",
        legs: [{ account: ACC.payoutsInTransit, amountKobo: -kobo }, { account: ACC.revenue, amountKobo: kobo }],
      });
      // Free the job so the next run (or an admin) can retry.
      await tx.serviceJob.update({ where: { id: job.id }, data: { payoutRef: null } });
    }
  });
}

/** Cron — pay every completed, issue-free job past its hold window. */
export async function payDueVendorJobs(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - MONEY.vendors.releaseHours * 3600_000);
  const due = await prisma.serviceJob.findMany({
    where: { status: "COMPLETED", payoutRef: null, completedAt: { lte: cutoff }, cost: { gt: 0 }, vendor: { accountNumber: { not: null } } },
    select: { id: true },
    take: 200,
  });
  let paid = 0;
  for (const j of due) {
    try { await payVendorForJob(j.id); paid++; } catch (e) { console.error(`[vendor-payout] ${j.id}:`, (e as Error).message); }
  }
  return paid;
}
