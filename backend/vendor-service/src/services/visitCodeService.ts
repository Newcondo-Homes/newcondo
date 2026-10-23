// backend/vendor-service/src/services/visitCodeService.ts
// ============================================================
// Proof that a visit happened.
//   generateVisitCode — ONLY the property's owner, its listing agent, or an
//     ACTIVE tenant; ONLY on the visit day (Lagos) and before 17:00; ONLY
//     while the property's plan is active. A new code voids the previous one.
//   verifyVisitCode — the assigned vendor submits the 6 digits (or the QR
//     payload). Photos first; VENDORS.codes.maxAttempts wrong tries lock the
//     job for admin review. A match completes the job in one transaction and
//     returns what the payout hook needs (combined-backend pays INSTANT
//     vendors immediately; END_OF_DAY vendors are batched by payment-service).
// ============================================================
import { prisma } from "@newcondo/db";
import {
  VENDORS, publishNotification, sendBrandedEmail, VendorEmailTemplates,
  badRequest, conflict, forbidden, notFound, tooMany, type VendorServiceType,
} from "@newcondo/backend-shared";
import { codeMatches, extractCode, hashVisitCode, newVisitCode, qrPayload } from "../utils/visitCode";
import { sameLagosDay, serviceDayEnd } from "../utils/time";
import { isServiceableLine } from "./serviceability";

const MAX_CODES_PER_DAY = 6;

export async function generateVisitCode(jobId: string, userId: string, now = new Date()) {
  const job = await prisma.serviceJob.findUnique({
    where: { id: jobId },
    select: { id: true, status: true, scheduledFor: true, propertyId: true, property: { select: { ownerId: true, agentId: true } } },
  });
  if (!job) throw notFound("Visit not found");
  const role = job.property.ownerId === userId ? "OWNER" : job.property.agentId === userId ? "LISTING_AGENT"
    : (await prisma.rental.count({ where: { propertyId: job.propertyId, renterId: userId, status: "ACTIVE" } })) ? "TENANT" : null;
  if (!role) throw forbidden("Only the owner, the listing agent or a tenant of this property can create a visit code");
  if (!["SCHEDULED", "ACTIVE"].includes(job.status)) throw conflict("This visit isn't open for confirmation");
  if (!job.scheduledFor || !sameLagosDay(job.scheduledFor, now)) throw conflict("Visit codes can only be created on the day of the visit");
  const expiresAt = serviceDayEnd(now);
  if (now >= expiresAt) throw conflict("Service hours for today have ended");
  if (!(await isServiceableLine(job.propertyId))) throw conflict("This property's plan isn't active, so visits are on hold");

  const today = await prisma.serviceVisitCode.count({ where: { jobId, createdAt: { gte: new Date(expiresAt.getTime() - 86_400_000) } } });
  if (today >= MAX_CODES_PER_DAY) throw tooMany("Too many codes for this visit today — contact support");

  const code = newVisitCode();
  await prisma.$transaction([
    prisma.serviceVisitCode.updateMany({ where: { jobId, usedAt: null, expiresAt: { gt: now } }, data: { expiresAt: now } }),
    prisma.serviceVisitCode.create({ data: { jobId, codeHash: hashVisitCode(jobId, code), generatedById: userId, generatedRole: role, expiresAt } }),
  ]);
  return { code, qr: qrPayload(jobId, code), expiresAt: expiresAt.toISOString(), qrOptions: VENDORS.codes.qr };
}

export interface VerifiedVisit { jobId: string; vendorId: string; releaseMode: string; propertyId: string }

export async function verifyVisitCode(vendorId: string, jobId: string, input: string, now = new Date()): Promise<VerifiedVisit> {
  const job = await prisma.serviceJob.findUnique({
    where: { id: jobId },
    select: { id: true, vendorId: true, status: true, scheduledFor: true, serviceType: true, photoKeys: true, codeAttempts: true, propertyId: true,
      property: { select: { title: true, ownerId: true, owner: { select: { name: true, email: true } } } }, vendor: { select: { name: true, releaseMode: true } } },
  });
  if (!job || job.vendorId !== vendorId) throw notFound("Job not found");
  if (job.status === "LOCKED") throw conflict("This job is locked after too many wrong codes. Newcondo support will contact you.");
  if (!["SCHEDULED", "ACTIVE"].includes(job.status)) throw conflict("This visit can't be confirmed");
  if (!job.scheduledFor || !sameLagosDay(job.scheduledFor, now)) throw conflict("Visits are confirmed on their scheduled day only");
  const minPhotos = VENDORS.services[job.serviceType as VendorServiceType]?.minPhotos ?? 1;
  if (job.photoKeys.length < minPhotos) throw badRequest(`Upload at least ${minPhotos} photo(s) of the work first`);

  const code = extractCode(input, jobId);
  const codes = code ? await prisma.serviceVisitCode.findMany({ where: { jobId, usedAt: null, expiresAt: { gt: now } }, select: { id: true, codeHash: true, generatedById: true, generatedRole: true } }) : [];
  const hit = code ? codes.find((c) => codeMatches(jobId, code, c.codeHash)) : undefined;

  if (!hit) {
    const attempts = job.codeAttempts + 1;
    const locked = attempts >= VENDORS.codes.maxAttempts;
    await prisma.serviceJob.update({ where: { id: jobId }, data: { codeAttempts: attempts, ...(locked ? { status: "LOCKED" } : {}) } });
    if (locked) await publishNotification({ userId: job.property.ownerId, kind: "service", title: "Visit locked for review", body: `Too many wrong visit codes were entered for ${job.property.title}. Newcondo will follow up.`, to: "/services", entityType: "serviceJob", entityId: jobId });
    throw badRequest(locked ? "Too many wrong codes — this job is locked for review" : `That code doesn't match. ${VENDORS.codes.maxAttempts - attempts} attempt(s) left.`);
  }

  await prisma.$transaction(async (tx) => {
    const claim = await tx.serviceVisitCode.updateMany({ where: { id: hit.id, usedAt: null }, data: { usedAt: now } });
    if (!claim.count) throw conflict("This code was just used");
    await tx.serviceJob.update({
      where: { id: jobId },
      data: { status: "COMPLETED", completedAt: now, verifiedAt: now, verifiedVia: input.includes(".") ? "QR" : "CODE", verifiedById: hit.generatedById },
    });
  });

  const label = VENDORS.services[job.serviceType as VendorServiceType]?.label ?? job.serviceType;
  await publishNotification({ userId: job.property.ownerId, kind: "service", title: `${label} completed`, body: `${job.vendor!.name} finished at ${job.property.title}. Photos are in Services.`, to: "/services", entityType: "serviceJob", entityId: jobId });
  if (hit.generatedById !== job.property.ownerId) await publishNotification({ userId: hit.generatedById, kind: "service", title: "Visit confirmed", body: `Thanks — the ${label.toLowerCase()} at ${job.property.title} is recorded.`, to: "/services", entityType: "serviceJob", entityId: jobId });
  if (job.property.owner.email) void sendBrandedEmail(job.property.owner.email, VendorEmailTemplates.visitCompleted({ name: job.property.owner.name ?? "there", property: job.property.title, service: label, vendor: job.vendor!.name, photos: job.photoKeys.length }));

  return { jobId, vendorId, releaseMode: job.vendor!.releaseMode, propertyId: job.propertyId };
}
