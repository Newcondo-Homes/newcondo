// backend/marking-service/src/services/markingAdmin.service.ts
// ============================================================
// Staff-side marking operations. They live HERE (not in admin-service)
// because they move marker money — one owner of the marking ledger.
// admin-service reaches them through combined-backend's injected deps.
//
//   assignFieldMarker   NEWCONDO jobs only (₦25,000, NewCondo keeps the
//                       whole fee). Only `isFieldMarker` accounts — salaried
//                       field team — may take them; a regular agent would be
//                       doing paid work for ₦0 (paysMarker() is BROADCAST-only).
//   resolveMarkingDispute
//     UPHOLD_MARKER     the mask was right: job → AWAITING_CONFIRMATION and
//                       confirmMarking() runs on the owner's behalf, so the
//                       marker is paid and boundaryVerified flips through the
//                       exact same code path as a normal confirmation.
//     REMARK            the mask was wrong: the marker's ₦1,000 hold (still
//                       PENDING) is reversed back to escrow, the provisional
//                       boundary is cleared and the job re-opens for the
//                       queue. Blocked if any tranche already reached the
//                       marker's withdrawable wallet — that needs a manual
//                       ledger adjustment, never an automatic double payout.
//   allowRemark         unlock a CONFIRMED (verified) mark so the owner can
//                       request a new one — the house leaves Browse until re-marked.
// ============================================================
import { prisma, Prisma } from "@newcondo/db";
import { ACC, postLedger, publishNotification, redis, badRequest, conflict, notFound } from "@newcondo/backend-shared";
import { confirmMarking } from "./markingJobService";

export async function assignFieldMarker(jobId: string, markerId: string) {
  const [job, marker] = await Promise.all([
    prisma.propertyMarkingJob.findUnique({ where: { id: jobId }, select: { id: true, method: true, status: true, paymentStatus: true, assignedAgentId: true, requestedBy: true, contactPersonName: true, contactPersonPhone: true, property: { select: { title: true, address: true, city: true } } } }),
    prisma.user.findUnique({ where: { id: markerId }, select: { id: true, name: true, role: true, isFieldMarker: true, verificationStatus: true, suspendedAt: true, deletedAt: true } }),
  ]);
  if (!job) throw notFound("Marking job not found");
  if (job.method !== "NEWCONDO") throw badRequest("Only NewCondo-handled jobs are assigned by staff — broadcast jobs use the agent queue");
  if (job.paymentStatus !== "SUCCESS") throw badRequest("The marking fee hasn’t been paid yet");
  if (!["QUEUED", "ASSIGNED"].includes(job.status)) throw conflict(`This job is ${job.status.toLowerCase().replace(/_/g, " ")}`);
  if (!marker || marker.role !== "AGENT" || !marker.isFieldMarker || marker.verificationStatus !== "VERIFIED" || marker.suspendedAt || marker.deletedAt) throw badRequest("Pick an active, verified NewCondo field marker");
  const previous = job.assignedAgentId;
  await prisma.propertyMarkingJob.update({ where: { id: jobId }, data: { assignedAgentId: markerId, assignedAt: new Date(), status: "ASSIGNED", timeSlotExpiry: null } });
  await redis.set(`marking:slot:${jobId}`, markerId).catch(() => {}); // ownedSlot() reads this first
  await Promise.all([
    publishNotification({ userId: markerId, kind: "marking", title: "Marking job assigned to you", body: `${job.property.title}, ${job.property.address}. Contact: ${job.contactPersonName} ${job.contactPersonPhone}`, to: "/marking", entityType: "markingJob", entityId: jobId }),
    publishNotification({ userId: job.requestedBy, kind: "marking", title: "A NewCondo marker is on the way", body: `${marker.name ?? "Our field team"} will mark ${job.property.title}.`, to: "/marking", entityType: "markingJob", entityId: jobId }),
    ...(previous && previous !== markerId ? [publishNotification({ userId: previous, kind: "marking", title: "Marking job reassigned", body: job.property.title, to: "/marking", entityType: "markingJob", entityId: jobId })] : []),
  ]);
  return { previous };
}

export async function resolveMarkingDispute(jobId: string, outcome: "UPHOLD_MARKER" | "REMARK", note?: string) {
  const job = await prisma.propertyMarkingJob.findUnique({ where: { id: jobId }, select: { id: true, status: true, method: true, propertyId: true, assignedAgentId: true, requestedBy: true, property: { select: { ownerId: true, title: true } } } });
  if (!job) throw notFound("Marking job not found");
  if (job.status !== "DISPUTED") throw conflict("This job isn’t disputed");

  if (outcome === "UPHOLD_MARKER") {
    // Re-enter the normal confirmation path (it pays the marker and verifies the boundary).
    const { count } = await prisma.propertyMarkingJob.updateMany({ where: { id: jobId, status: "DISPUTED" }, data: { status: "AWAITING_CONFIRMATION", completionNotes: note ? `Dispute closed by NewCondo: ${note}` : undefined } });
    if (!count) throw conflict("This job changed — refresh and try again");
    await confirmMarking(jobId, job.property.ownerId);
    await publishNotification({ userId: job.property.ownerId, kind: "marking", title: "Marking dispute closed", body: `We reviewed ${job.property.title} and confirmed the marked boundary.${note ? " " + note : ""}`, to: "/marking", entityType: "markingJob", entityId: jobId });
    return { outcome };
  }

  const marker = job.assignedAgentId && job.assignedAgentId !== job.property.ownerId ? job.assignedAgentId : null;
  await prisma.$transaction(async (tx) => {
    if (marker) {
      const rows = await tx.ledgerEntry.findMany({
        where: { account: { code: { in: [ACC.userPending(marker), ACC.userAvailable(marker)] } }, transaction: { sourceType: "MARKING_JOB", sourceId: jobId } },
        select: { amountKobo: true, account: { select: { code: true } } },
      });
      const available = rows.filter((r) => r.account.code === ACC.userAvailable(marker)).reduce((s, r) => s + r.amountKobo, 0n);
      if (available > 0n) throw conflict("The marker was already paid part of this job. Uphold the marking, or ask finance for a manual ledger adjustment.");
      const pending = rows.filter((r) => r.account.code === ACC.userPending(marker)).reduce((s, r) => s + r.amountKobo, 0n);
      if (pending > 0n) {
        await postLedger(tx, {
          idempotencyKey: `marking-hold-reverse:${jobId}:${marker}`,
          type: "ADJUSTMENT", sourceType: "MARKING_JOB", sourceId: jobId,
          memo: "Marking rejected on dispute — held payout returned to escrow",
          legs: [{ account: ACC.userPending(marker), amountKobo: -pending }, { account: ACC.markingEscrow, amountKobo: pending }],
        });
      }
      await tx.markingQueueEntry.updateMany({ where: { jobId, agentId: marker }, data: { abandonedAt: new Date() } });
    }
    await tx.property.update({ where: { id: job.propertyId }, data: { boundaryVerified: false, boundaryCoordinates: Prisma.DbNull, boundaryMarkedBy: null, boundaryMarkedAt: null, boundaryMaskImageKey: null, buildingFingerprint: null } });
    await tx.propertyMarkingJob.update({ where: { id: jobId }, data: {
      status: "QUEUED", assignedAgentId: null, assignedAt: null, timeSlotExpiry: null, completedAt: null, confirmDeadline: null,
      boundaryData: Prisma.DbNull, snapshotImageKey: null, maskImageKey: null, completionImages: [], completionNotes: note ? `Re-opened after dispute: ${note}` : "Re-opened after dispute",
    } });
  });
  await redis.del(`marking:slot:${jobId}`).catch(() => {});
  await publishNotification({ userId: job.property.ownerId, kind: "marking", title: "We’ll mark your property again", body: `Your dispute on ${job.property.title} was upheld. ${job.method === "BROADCAST" ? "The job is back with nearby markers at no extra cost." : job.method === "NEWCONDO" ? "Our field team will be assigned shortly." : "You can submit the marking again."}`, to: "/marking", entityType: "markingJob", entityId: jobId });
  if (marker) await publishNotification({ userId: marker, kind: "marking", title: "Marking not accepted", body: `${job.property.title}: the owner’s dispute was upheld, so this job won’t be paid.${note ? " " + note : ""}`, to: "/marking", entityType: "markingJob", entityId: jobId });
  return { outcome };
}

export async function allowRemark(propertyId: string) {
  const p = await prisma.property.findUnique({ where: { id: propertyId }, select: { title: true, ownerId: true, boundaryVerified: true, markingJobs: { where: { status: { in: ["QUEUED", "ASSIGNED", "IN_PROGRESS", "AWAITING_CONFIRMATION", "DISPUTED"] } }, select: { id: true } } } });
  if (!p) throw notFound("Property not found");
  if (p.markingJobs.length) throw conflict("A marking job is still open for this property — resolve it first");
  await prisma.property.update({ where: { id: propertyId }, data: { boundaryVerified: false, boundaryCoordinates: Prisma.DbNull, boundaryMarkedBy: null, boundaryMarkedAt: null, boundaryMaskImageKey: null, buildingFingerprint: null } });
  await publishNotification({ userId: p.ownerId, kind: "marking", title: "Please mark your property again", body: `${p.title} is hidden from Browse until it is re-marked and confirmed.`, to: "/marking", entityType: "Property", entityId: propertyId });
  return { title: p.title };
}
