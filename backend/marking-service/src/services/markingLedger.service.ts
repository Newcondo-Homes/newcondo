// backend/marking-service/src/services/markingLedger.service.ts
// ============================================================
// Marking-fee money, on the ledger.
//
//   fee paid           world/suspense → escrow:marking            (MARKING_FEE_COLLECTED)
//   agent completes    escrow → user:{marker}:pending  ₦1,000     (MARKING_HOLD)
//   owner confirms     pending → available ₦1,000
//                      escrow → marker available  ₦4,000
//                      escrow → platform:revenue   the rest       (MARKING_RELEASED)
//   owner never answers each lapsed window releases a tranche
//                      (MONEY.marking.lapseTrancheNaira) to the marker until
//                      they are fully paid; then the job closes unconfirmed
//                      and the margin goes to revenue.
//   NEWCONDO method    no marker payout — the whole fee is revenue on confirm.
// All keys are per job, so retries and overlapping crons are no-ops.
// ============================================================
import { prisma } from "@newcondo/db";
import { ACC, postLedger, toKobo, collectionLegs, MARKING, MONEY, publishNotification, type FundingSource, type Tx } from "@newcondo/backend-shared";

const fee = (method: string) => (MARKING.fees as Record<string, number>)[method] ?? 0;
const paysMarker = (method: string) => method === "BROADCAST";
export { fee as markingFeeFor };

/** Fee paid → the MARKING FEE goes to escrow:marking; the processing fee the
 *  owner paid on top repays Flutterwave (platform:processing). */
export async function bookMarkingFee(tx: Tx, o: {
  paymentId: string; payerId: string; dueNaira: number; feeNaira: number;
  receivedNaira: number; settledNaira: number | null; via: FundingSource;
}): Promise<void> {
  await postLedger(tx, {
    idempotencyKey: `marking-fee:${o.paymentId}`,
    type: "MARKING_FEE_COLLECTED",
    sourceType: "PAYMENT",
    sourceId: o.paymentId,
    paymentId: o.paymentId,
    memo: "Marking service fee",
    legs: collectionLegs({
      via: o.via,
      receivedKobo: toKobo(o.receivedNaira),
      settledKobo: o.settledNaira != null ? toKobo(o.settledNaira) : null,
      dueKobo: toKobo(o.dueNaira),
      payerId: o.payerId,
      allocations: [{ account: ACC.markingEscrow, amountKobo: toKobo(o.feeNaira) }],
    }),
  });
}

/** Called inside completeMarking's transaction. */
export async function holdMarkerPayout(tx: Tx, job: { id: string; method: string; feePaid: boolean }, markerId: string): Promise<number> {
  if (!job.feePaid || !paysMarker(job.method)) return 0;
  await postLedger(tx, {
    idempotencyKey: `marking-hold:${job.id}`,
    type: "MARKING_HOLD",
    sourceType: "MARKING_JOB",
    sourceId: job.id,
    memo: "Marking completed — payout held until the owner confirms",
    legs: [{ account: ACC.markingEscrow, amountKobo: -toKobo(MARKING.payoutHoldOnComplete) }, { account: ACC.userPending(markerId), amountKobo: toKobo(MARKING.payoutHoldOnComplete) }],
  });
  return MARKING.payoutHoldOnComplete;
}

/** How much of the marker payout has already left escrow for this job. */
async function releasedToMarker(jobId: string, markerId: string): Promise<bigint> {
  const rows = await prisma.ledgerEntry.findMany({
    where: { account: { code: { in: [ACC.userAvailable(markerId), ACC.userPending(markerId)] } }, transaction: { sourceType: "MARKING_JOB", sourceId: jobId } },
    select: { amountKobo: true, account: { select: { kind: true } }, transaction: { select: { type: true } } },
  });
  // Sum of escrow → marker movements (hold + tranches); pending→available moves are internal.
  return rows
    .filter((r) => r.transaction.type === "MARKING_HOLD" || (r.transaction.type === "MARKING_RELEASED" && r.account.kind === "USER_AVAILABLE"))
    .reduce((s, r) => s + (r.amountKobo > 0n ? r.amountKobo : 0n), 0n);
}

/** Owner confirmed (or the drip finished): pay the marker in full, move the
 *  remaining fee to revenue. */
export async function settleMarkingJob(tx: Tx, job: { id: string; method: string; markingFee: unknown }, markerId: string | null, reason: "CONFIRMED" | "LAPSED"): Promise<number> {
  const feeKobo = toKobo(job.markingFee as number);
  if (feeKobo <= 0n) return 0;
  const legs: { account: string; amountKobo: bigint }[] = [];
  let markerTopUp = 0n;
  let alreadyOut = 0n;
  if (markerId && paysMarker(job.method)) {
    // pending → available for the hold (only if it is still pending)
    const pendingRows = await tx.ledgerEntry.aggregate({
      where: { account: { code: ACC.userPending(markerId) }, transaction: { sourceType: "MARKING_JOB", sourceId: job.id } },
      _sum: { amountKobo: true },
    });
    const stillPending = pendingRows._sum.amountKobo ?? 0n;
    if (stillPending > 0n) legs.push({ account: ACC.userPending(markerId), amountKobo: -stillPending }, { account: ACC.userAvailable(markerId), amountKobo: stillPending });
    alreadyOut = await releasedToMarker(job.id, markerId);
    markerTopUp = toKobo(MARKING.markerPayout) - alreadyOut;
    if (markerTopUp > 0n) legs.push({ account: ACC.userAvailable(markerId), amountKobo: markerTopUp });
  }
  const leftInEscrow = feeKobo - alreadyOut - (markerTopUp > 0n ? markerTopUp : 0n);
  if (leftInEscrow > 0n) legs.push({ account: ACC.revenue, amountKobo: leftInEscrow });
  const fromEscrow = (markerTopUp > 0n ? markerTopUp : 0n) + (leftInEscrow > 0n ? leftInEscrow : 0n);
  if (fromEscrow > 0n) legs.push({ account: ACC.markingEscrow, amountKobo: -fromEscrow });
  if (!legs.length) return 0;
  await postLedger(tx, {
    idempotencyKey: `marking-settle:${job.id}`,
    type: "MARKING_RELEASED",
    sourceType: "MARKING_JOB",
    sourceId: job.id,
    memo: reason === "CONFIRMED" ? "Marking confirmed by owner" : "Marking closed after the owner's windows lapsed",
    legs,
  });
  return Number(markerTopUp > 0n ? markerTopUp : 0n) / 100;
}

/** Hourly cron — one tranche per lapsed confirmation window. */
export async function dripLapsedMarkingPayouts(now = new Date()): Promise<{ tranches: number; closed: number }> {
  const lapsed = await prisma.propertyMarkingJob.findMany({
    where: { status: "AWAITING_CONFIRMATION", confirmDeadline: { lt: now }, paymentStatus: "SUCCESS", method: "BROADCAST", assignedAgentId: { not: null } },
    select: { id: true, method: true, markingFee: true, assignedAgentId: true, confirmDeadline: true, property: { select: { title: true, ownerId: true } } },
    take: 200,
  });
  let tranches = 0, closed = 0;
  for (const job of lapsed) {
    const marker = job.assignedAgentId!;
    const out = await releasedToMarker(job.id, marker);
    const remaining = toKobo(MARKING.markerPayout) - out;
    const tranche = toKobo(MONEY.marking.lapseTrancheNaira);
    if (remaining > tranche) {
      const n = Number(out / tranche); // stable per-tranche key
      await prisma.$transaction(async (tx) => {
        await postLedger(tx, {
          idempotencyKey: `marking-drip:${job.id}:${n}`, type: "MARKING_RELEASED", sourceType: "MARKING_JOB", sourceId: job.id,
          memo: "Owner confirmation window lapsed — tranche released",
          legs: [{ account: ACC.markingEscrow, amountKobo: -tranche }, { account: ACC.userAvailable(marker), amountKobo: tranche }],
        });
        await tx.propertyMarkingJob.update({ where: { id: job.id }, data: { confirmDeadline: new Date(now.getTime() + MARKING.ownerConfirmHours * 3600_000) } });
      });
      tranches++;
      await publishNotification({ userId: job.property.ownerId, kind: "marking", title: `Confirm the marking on ${job.property.title}`, body: `The confirmation window lapsed, so part of the marker's payout was released. Confirm within ${MARKING.ownerConfirmHours}h or the job closes unconfirmed.`, to: "/marking", entityType: "markingJob", entityId: job.id });
    } else {
      await prisma.$transaction(async (tx) => {
        await settleMarkingJob(tx, job, marker, "LAPSED");
        await tx.propertyMarkingJob.update({ where: { id: job.id }, data: { status: "EXPIRED" } });
      });
      closed++;
      await publishNotification({ userId: job.property.ownerId, kind: "marking", title: "Marking job closed unconfirmed", body: `${job.property.title} was not confirmed. Request a new marking job when you're ready.`, to: "/marking", entityType: "markingJob", entityId: job.id });
    }
  }
  return { tranches, closed };
}
