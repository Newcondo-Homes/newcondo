// backend/marking-service/src/services/markingJobService.ts
// ============================================================
// Marking jobs — request → broadcast queue (FCFS, 3h slot) → agent marks
// (boundary polygon + photos) → owner confirms within 72h.
// Geometry reuses the EXISTING algorithm in property-service/src/lib/marking-geo.ts.
// Fees: BROADCAST ₦20,000 · NEWCONDO ₦25,000; marker earns ₦5,000
// (₦1,000 held on completion, ₦4,000 on owner confirmation). SELF /
// KNOWN_PERSON are free.
//
// SCHEMA ALIGNMENT — PropertyMarkingJob in packages/db is:
//   requestedBy · assignedAgentId · markingFee · contactPersonName ·
//   contactPersonPhone · accessInstructions · completedAt · completionImages[] ·
//   completionNotes · boundaryData · confirmDeadline · confirmedAt ·
//   disputeReason · snapshotImageKey · maskImageKey · method · queueEntries
//   status enum MarkingJobStatus = QUEUED | ASSIGNED | IN_PROGRESS | COMPLETED |
//   CANCELLED | EXPIRED | AWAITING_CONFIRMATION | DISPUTED
//   (there is no `fee`, `requesterId`, `markedById`, `markedAt`, `photoKeys`,
//    `OPEN` or `AWAITING_MARKING`)
//
// THE VERIFIED MARK LIVES ON `Property`, not a separate PropertyMark model:
//   boundaryCoordinates (Json) · boundaryVerified · boundaryMarkedBy
//
// Every exported fn has an explicit return type (Prisma 7 payload types aren't
// nameable across packages — TS2742).
// ============================================================
import { prisma } from "@newcondo/db";
import {
  conflict, forbidden, notFound,
  publishNotification, redis, MARKING, presignUpload,
} from "@newcondo/backend-shared";
import {
  polygonNormToGps, centroidOf, buildingFingerprint, checkDuplicate,
} from "@newcondo/property-service"; // marking-geo re-export
import { assertOwnershipProof } from "@newcondo/property-service";
import type { MarkingJobStatus, MarkingMethod as PrismaMarkingMethod } from "@newcondo/db";

// All numbers come from constants/business.ts — change them there, not here.
export const MARKING_FEES = MARKING.fees;
export const MARKER_PAYOUT = MARKING.markerPayout;
export const PAYOUT_HOLD = MARKING.payoutHoldOnComplete;
export const SLOT_HOURS = MARKING.slotHours;
export const CONFIRM_HOURS = MARKING.ownerConfirmHours;

export type MarkingMethod = PrismaMarkingMethod;

/** Broadcast jobs waiting for a marker. Self-marking jobs are ASSIGNED immediately. */
const OPEN_STATUS: MarkingJobStatus = "QUEUED";

/* ---------- DTOs ---------- */
export interface MarkingJobDTO {
  id: string;
  propertyId: string;
  propertyTitle: string;
  method: string;
  fee: number;
  status: string;
  markedByName: string | null;
  markedAt: Date | null;
  confirmDeadline: Date | null;
  photoCount: number;
  createdAt: Date;
}
export interface AvailableJobDTO {
  id: string; title: string; area: string; payout: number;
  queue: number; posted: Date; contactPerson: string; hasPhotos: boolean;
}
export interface PresignedPhoto { key: string; uploadUrl: string; expiresIn: number; kind: "boundary" | "rooms" }
export interface CompleteMarkingResult { fingerprint: string; confirmDeadline: Date; heldPayout: number }

/* ---------- owner/agent: create a job (paid methods come via the webhook) ---------- */
export async function createMarkingJob(opts: {
  propertyId: string;
  requesterId: string;
  method: MarkingMethod;
  contactName?: string;
  contactPhone?: string;
  accessNotes?: string;
  feePaid?: boolean;
}): Promise<{ id: string; status: string; fee: number }> {
  const p = await prisma.property.findUnique({
    where: { id: opts.propertyId },
    select: { id: true, title: true, ownerId: true, agentId: true, boundaryVerified: true },
  });
  if (!p) throw notFound("Property not found");
  if (p.ownerId !== opts.requesterId && p.agentId !== opts.requesterId) throw forbidden("You do not list this property");
  if (p.boundaryVerified) throw conflict("This property is already marked");

  // OWNERSHIP GATE — only for the FREE methods.
  //
  // Two routes reach this function:
  //   SELF / KNOWN_PERSON  → called directly, nothing checked them yet, so
  //                          this is their one and only ownership check.
  //   BROADCAST / NEWCONDO → called by confirmMarkingFeePaid() AFTER the card
  //                          has been charged. They were already checked in
  //                          initiateMarkingPayment(), before any money moved.
  //
  // Hence `if (!opts.feePaid)`. Checking unconditionally would re-run the test
  // on a job the user has ALREADY PAID for — and if the document happened to be
  // deleted between checkout and the webhook, we'd take ₦25,000 and then refuse
  // to create the job. The check belongs before the charge, never after it.
  if (!opts.feePaid) {
    await assertOwnershipProof(opts.propertyId, "MARK");
  }

  const fee = MARKING_FEES[opts.method];
  const job = await prisma.propertyMarkingJob.create({
    data: {
      propertyId: p.id,
      requestedBy: opts.requesterId,
      method: opts.method,
      markingFee: fee,
      paymentStatus: opts.feePaid ? "SUCCESS" : "PENDING",
      // SELF marks straight away (the requester IS the marker); paid methods
      // sit in the broadcast queue until an agent takes a slot.
      status: opts.method === "SELF" ? "ASSIGNED" : "QUEUED",
      assignedAgentId: opts.method === "SELF" ? opts.requesterId : null,
      contactPersonName: opts.contactName ?? "Owner on site",
      contactPersonPhone: opts.contactPhone ?? "",
      accessInstructions: opts.accessNotes ?? null,
    },
    select: { id: true, status: true, markingFee: true },
  });
  return { id: job.id, status: String(job.status), fee: Number(job.markingFee) };
}

/* ---------- agent: open broadcast jobs in the agent's area ----------
   Property has no latitude/longitude columns, and an unmarked property has no
   boundaryCoordinates yet — so "nearby" is resolved by city/state (the
   structured address the listing wizard collects).
   TODO(schema, optional): add `latitude Float?` / `longitude Float?` to
   Property (set from the listing address geocode) to sort by true distance. */
export async function availableJobs(opts: {
  city?: string; state?: string; limit?: number;
}): Promise<AvailableJobDTO[]> {
  const jobs = await prisma.propertyMarkingJob.findMany({
    where: {
      status: OPEN_STATUS,
      method: { in: ["BROADCAST", "NEWCONDO"] },
      ...(opts.city || opts.state
        ? { property: { ...(opts.city && { city: opts.city }), ...(opts.state && { state: opts.state }) } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 30,
    select: {
      id: true, createdAt: true, contactPersonName: true, completionImages: true,
      property: { select: { title: true, city: true, state: true } },
      _count: { select: { queueEntries: true } },
    },
  });

  return jobs.map((j) => ({
    id: j.id,
    title: j.property.title,
    area: [j.property.city, j.property.state].filter(Boolean).join(", "),
    payout: MARKER_PAYOUT,
    queue: j._count.queueEntries,
    posted: j.createdAt,
    contactPerson: j.contactPersonName,
    hasPhotos: j.completionImages.length > 0,
  }));
}

/* ---------- agent: FCFS queue — join / advance (3h Redis-timed slot) ---------- */
export async function joinQueue(jobId: string, agentId: string): Promise<{ position: number; slotHours: number }> {
  const job = await prisma.propertyMarkingJob.findUnique({
    where: { id: jobId },
    select: { id: true, status: true, _count: { select: { queueEntries: true } } },
  });
  if (!job || job.status !== OPEN_STATUS) throw notFound("Job is no longer open");

  const dup = await prisma.markingQueueEntry.findFirst({ where: { jobId, agentId }, select: { id: true } });
  if (dup) throw conflict("You are already in this queue");

  const entry = await prisma.markingQueueEntry.create({
    data: { jobId, agentId, position: job._count.queueEntries + 1 },
    select: { position: true },
  });
  if (entry.position === 1) await activateSlot(jobId, agentId);
  return { position: entry.position, slotHours: SLOT_HOURS };
}

async function activateSlot(jobId: string, agentId: string): Promise<void> {
  const expiry = new Date(Date.now() + SLOT_HOURS * 3600_000);
  await prisma.$transaction(async (tx) => {
    await tx.markingQueueEntry.updateMany({ where: { jobId, agentId }, data: { slotStartedAt: new Date() } });
    await tx.propertyMarkingJob.update({
      where: { id: jobId },
      data: { assignedAgentId: agentId, assignedAt: new Date(), timeSlotExpiry: expiry, status: "ASSIGNED" },
    });
  });
  await redis.set(`marking:slot:${jobId}`, agentId, "EX", SLOT_HOURS * 3600).catch(() => {});
  await publishNotification({
    userId: agentId, kind: "marking", title: "Your marking slot is active",
    body: `You have ${SLOT_HOURS} hours to mark the property. Payout ₦${MARKER_PAYOUT.toLocaleString("en-NG")}.`,
    to: "/marking", entityType: "markingJob", entityId: jobId,
  });
}

/** Cron (or on-read): expire stale slots and promote the next agent. */
export async function advanceExpiredSlots(): Promise<number> {
  const stale = await prisma.markingQueueEntry.findMany({
    where: {
      slotStartedAt: { lt: new Date(Date.now() - SLOT_HOURS * 3600_000) },
      completedAt: null, abandonedAt: null,
      job: { status: { in: ["QUEUED", "ASSIGNED"] } },
    },
    select: { id: true, jobId: true },
  });
  for (const e of stale) {
    await prisma.markingQueueEntry.update({ where: { id: e.id }, data: { abandonedAt: new Date() } });
    await promoteNext(e.jobId);
  }
  return stale.length;
}

/** Agent leaves their own slot — hands the job to the next agent in the queue. */
export async function abandonSlot(jobId: string, agentId: string): Promise<{ promoted: boolean }> {
  await prisma.markingQueueEntry.updateMany({ where: { jobId, agentId }, data: { abandonedAt: new Date() } });
  await redis.del(`marking:slot:${jobId}`).catch(() => {});
  return { promoted: await promoteNext(jobId) };
}

async function promoteNext(jobId: string): Promise<boolean> {
  const next = await prisma.markingQueueEntry.findFirst({
    where: { jobId, abandonedAt: null, completedAt: null },
    orderBy: { position: "asc" },
    select: { agentId: true },
  });
  if (next) { await activateSlot(jobId, next.agentId); return true; }
  // Nobody left — back to the open broadcast pool.
  await prisma.propertyMarkingJob.update({
    where: { id: jobId },
    data: { status: "QUEUED", assignedAgentId: null, assignedAt: null, timeSlotExpiry: null },
  });
  return false;
}

/* ---------- agent: presigned photo uploads ----------
   presignUpload() owns the S3 key layout (marking-photos namespace →
   properties/.../marking/{boundary|rooms}/), so callers pass a namespace +
   owner, never a raw bucket/key. */
export async function presignMarkingPhotos(
  jobId: string,
  agentId: string,
  photos: { kind: "boundary" | "rooms"; contentType: string; contentLength: number }[]
): Promise<PresignedPhoto[]> {
  await ownedSlot(jobId, agentId);
  return Promise.all(
    photos.map(async (ph) => {
      const { key, uploadUrl, expiresIn } = await presignUpload({
        ns: "marking-photos",
        ownerId: agentId,
        contentType: ph.contentType,
        contentLength: ph.contentLength,
      });
      return { key, uploadUrl, expiresIn, kind: ph.kind };
    })
  );
}

async function ownedSlot(jobId: string, agentId: string) {
  const job = await prisma.propertyMarkingJob.findUnique({
    where: { id: jobId },
    select: {
      id: true, propertyId: true, status: true, assignedAgentId: true,
      property: { select: { state: true, city: true, ownerId: true, title: true } },
    },
  });
  if (!job) throw notFound("Job not found");
  const holder = await redis.get(`marking:slot:${jobId}`).catch(() => null);
  const owner = holder ?? job.assignedAgentId;
  if (owner && owner !== agentId) throw forbidden("It is not your slot");
  return job;
}

/* ---------- agent: submit the marking (polygon + uploaded photo keys) ---------- */
/* ---------- agent: submit the marking (polygon + uploaded photo keys) ---------- */
export async function completeMarking(opts: {
  jobId: string;
  agentId: string;
  polygonNorm: [number, number][];
  mapBounds: { north: number; south: number; east: number; west: number };
  photoKeys: string[];
  snapshotImageKey?: string;
  maskImageKey?: string;
  notes?: string;
}): Promise<CompleteMarkingResult> {
  const job = await ownedSlot(opts.jobId, opts.agentId);

  // EXISTING geometry pipeline (marking-geo.ts): normalized → GPS → centroid →
  // fingerprint → IoU duplicate check against every already-marked property.
  const polygon = polygonNormToGps(opts.polygonNorm, opts.mapBounds);
  const centroid = centroidOf(polygon);
  const fingerprint = buildingFingerprint(centroid);

  // The verified mark lives on Property.boundaryCoordinates — there is no
  // separate PropertyMark table. JSON can't be range-filtered, so candidates
  // are narrowed by city/state and compared in memory.
  // Prisma Json filters can't take a bare `null` (JsonNullValueFilter only),
  // so the "has a boundary" check happens on the mapped rows below.
  const markedRows = await prisma.property.findMany({
    where: {
      boundaryVerified: true,
      city: job.property.city,
      state: job.property.state,
      id: { not: job.propertyId },
    },
    select: { id: true, boundaryCoordinates: true },
  });
  const marked = markedRows.filter(
    (m: { boundaryCoordinates: unknown }) => m.boundaryCoordinates != null
  );
  const dup = checkDuplicate(
    polygon,
    marked.map((m: { id: string; boundaryCoordinates: unknown }) => ({ id: m.id, polygon: m.boundaryCoordinates as never }))
  );
  if (dup) throw conflict("This building is already marked to another property — it cannot be double-listed");

  const confirmDeadline = new Date(Date.now() + CONFIRM_HOURS * 3600_000);
  await prisma.$transaction(async (tx) => {
    // Boundary is provisional until the owner confirms — boundaryVerified
    // flips only in confirmMarking().
    await tx.property.update({
      where: { id: job.propertyId },
      data: { boundaryCoordinates: polygon as never, boundaryMarkedBy: opts.agentId },
    });
    await tx.propertyMarkingJob.update({
      where: { id: job.id },
      data: {
        status: "AWAITING_CONFIRMATION",
        assignedAgentId: opts.agentId,
        completedAt: new Date(),
        confirmDeadline,
        completionImages: opts.photoKeys,
        completionNotes: opts.notes ?? null,
        boundaryData: { polygon, centroid, fingerprint } as never,
        snapshotImageKey: opts.snapshotImageKey ?? null,
        maskImageKey: opts.maskImageKey ?? null,
      },
    });
    await tx.markingQueueEntry.updateMany({
      where: { jobId: job.id, agentId: opts.agentId }, data: { completedAt: new Date() },
    });
  });

  // ₦1,000 hold now; balance on owner confirmation. TODO: wallet ledger credit.
  await publishNotification({
    userId: job.property.ownerId, kind: "marking",
    title: `Confirm marking — ${job.property.title}`,
    body: `Review the boundary and ${opts.photoKeys.length} photos within ${CONFIRM_HOURS}h.`,
    to: "/marking", entityType: "markingJob", entityId: job.id,
  });
  return { fingerprint, confirmDeadline, heldPayout: PAYOUT_HOLD };
}

/* ---------- owner: confirm / dispute ---------- */
export async function confirmMarking(jobId: string, ownerId: string): Promise<void> {
  const job = await prisma.propertyMarkingJob.findUnique({
    where: { id: jobId },
    select: {
      id: true, status: true, propertyId: true, assignedAgentId: true,
      property: { select: { ownerId: true, title: true } },
    },
  });
  if (!job || job.status !== "AWAITING_CONFIRMATION") throw notFound("Nothing to confirm");
  if (job.property.ownerId !== ownerId) throw forbidden("Not your property");

  await prisma.$transaction(async (tx) => {
    await tx.propertyMarkingJob.update({
      where: { id: jobId }, data: { status: "COMPLETED", confirmedAt: new Date() },
    });
    await tx.property.update({
      where: { id: job.propertyId },
      // Property has boundaryVerified + boundaryMarkedBy; there is no
      // boundaryVerifiedAt column — the job's confirmedAt is the timestamp.
      data: { boundaryVerified: true },
    });
  });

  if (job.assignedAgentId && job.assignedAgentId !== ownerId) {
    // release the remaining ₦4,000. TODO: wallet ledger credit + auto-payout hook
    await publishNotification({
      userId: job.assignedAgentId, kind: "wallet", title: "Marking payout released",
      body: `₦${(MARKER_PAYOUT - PAYOUT_HOLD).toLocaleString("en-NG")} released — ${job.property.title} confirmed by the owner.`,
      to: "/wallet", entityType: "markingJob", entityId: jobId,
    });
  }
}

export async function disputeMarking(jobId: string, ownerId: string, reason: string): Promise<void> {
  const job = await prisma.propertyMarkingJob.findUnique({
    where: { id: jobId },
    select: { id: true, property: { select: { ownerId: true } } },
  });
  if (!job) throw notFound("Job not found");
  if (job.property.ownerId !== ownerId) throw forbidden("Not your property");
  await prisma.propertyMarkingJob.update({
    where: { id: jobId }, data: { status: "DISPUTED", disputeReason: reason },
  });
}

/* ---------- lists ---------- */
const JOB_SELECT = {
  id: true, propertyId: true, method: true, markingFee: true, status: true,
  completedAt: true, confirmDeadline: true, completionImages: true, createdAt: true,
  property: { select: { title: true } },
  assignedAgent: { select: { name: true } },
} as const;

export async function ownerJobs(requesterId: string): Promise<MarkingJobDTO[]> {
  const rows = await prisma.propertyMarkingJob.findMany({
    where: { requestedBy: requesterId },
    orderBy: { createdAt: "desc" },
    select: JOB_SELECT,
  });
  return rows.map(toJobDTO);
}

export async function agentHistory(agentId: string): Promise<MarkingJobDTO[]> {
  const rows = await prisma.propertyMarkingJob.findMany({
    where: { assignedAgentId: agentId },
    orderBy: { completedAt: "desc" },
    select: JOB_SELECT,
  });
  return rows.map(toJobDTO);
}

function toJobDTO(r: {
  id: string; propertyId: string; method: unknown; markingFee: unknown; status: unknown;
  completedAt: Date | null; confirmDeadline: Date | null; completionImages: string[]; createdAt: Date;
  property: { title: string }; assignedAgent: { name: string | null } | null;
}): MarkingJobDTO {
  return {
    id: r.id,
    propertyId: r.propertyId,
    propertyTitle: r.property.title,
    method: String(r.method),
    fee: Number(r.markingFee ?? 0),
    status: String(r.status),
    markedByName: r.assignedAgent?.name ?? null,
    markedAt: r.completedAt,
    confirmDeadline: r.confirmDeadline,
    photoCount: r.completionImages.length,
    createdAt: r.createdAt,
  };
}
