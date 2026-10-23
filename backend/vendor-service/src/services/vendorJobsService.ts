// backend/vendor-service/src/services/vendorJobsService.ts
// Vendor dashboard reads + job photos. Every query is scoped by vendorId from
// requireVendor — a vendor can never read another vendor's jobs or clients.
import { randomBytes } from "crypto";
import { prisma } from "@newcondo/db";
import { VENDORS, payoutBreakdown, presignUpload, toKobo, badRequest, notFound, type VendorServiceType } from "@newcondo/backend-shared";
import { addDays, lagosParts, lagosInstant, sameLagosDay, startOfLagosDay } from "../utils/time";
import { windowFor } from "./schedulingService";
import type { VendorClientDTO, VendorJobDTO, VendorOverviewDTO } from "../types";

const maskPhone = (p: string | null | undefined) => (p && p.length > 6 ? `${p.slice(0, 4)} *** ${p.slice(-4)}` : null);

const JOB_SELECT = {
  id: true, serviceType: true, status: true, propertyId: true, scheduledFor: true, windowEnd: true, cost: true, photoKeys: true, notes: true,
  planType: true, verifiedAt: true, verifiedVia: true, payoutRef: true, payoutBatchId: true, paidOutAt: true,
  property: { select: { title: true, address: true, city: true, owner: { select: { name: true, phone: true } }, agent: { select: { name: true } },
    rentals: { where: { status: "ACTIVE" as const }, select: { renter: { select: { name: true, phone: true } } } } } },
  reminderCalls: { orderBy: { createdAt: "asc" as const }, select: { dayOffset: true, contactRole: true, status: true, createdAt: true } },
};
type JobRow = Awaited<ReturnType<typeof loadJobs>>[number];
const loadJobs = (where: object, take = 50, skip = 0) => prisma.serviceJob.findMany({ where, select: JOB_SELECT, orderBy: { scheduledFor: "asc" }, take, skip });

function toDTO(j: JobRow): VendorJobDTO {
  const cost = Number(j.cost);
  const rentals = j.property.rentals;
  return {
    id: j.id, ref: `SJ-${j.id.slice(-4).toUpperCase()}`, service: j.serviceType as VendorServiceType, status: j.status,
    propertyId: j.propertyId, property: j.property.title, address: `${j.property.address}, ${j.property.city}`,
    scheduledFor: j.scheduledFor?.toISOString() ?? null, windowEnd: j.windowEnd?.toISOString() ?? null,
    owner: { name: j.property.owner.name ?? "Owner", phoneMasked: maskPhone(j.property.owner.phone) },
    occupant: rentals.length === 1 ? { label: rentals[0].renter.name ?? "Tenant", phoneMasked: maskPhone(rentals[0].renter.phone) } : { label: rentals.length ? `${rentals.length} tenants` : "No tenant on record", phoneMasked: null },
    agent: j.property.agent?.name ?? null, planType: j.planType,
    cost, receive: cost > 0 ? payoutBreakdown(cost).receiveNaira : 0, photoCount: j.photoKeys.length,
    minPhotos: VENDORS.services[j.serviceType as VendorServiceType]?.minPhotos ?? 1,
    verifiedAt: j.verifiedAt?.toISOString() ?? null, verifiedVia: j.verifiedVia,
    payout: j.paidOutAt ? "PAID" : j.payoutRef ? "PROCESSING" : j.payoutBatchId ? "PROCESSING" : j.status === "COMPLETED" ? "BATCHED" : "NONE",
    paidOutAt: j.paidOutAt?.toISOString() ?? null, notes: j.notes,
    reminders: j.reminderCalls.map((r) => ({ dayOffset: r.dayOffset, contactRole: r.contactRole, status: r.status, at: r.createdAt.toISOString() })),
  };
}

export async function getOverview(vendorId: string, now = new Date()): Promise<VendorOverviewDTO> {
  const day = startOfLagosDay(now);
  const p = lagosParts(now);
  const monthStart = lagosInstant(p.y, p.m, 1, 0);
  const [today, upcoming, pending, paid] = await Promise.all([
    loadJobs({ vendorId, scheduledFor: { gte: day, lt: addDays(day, 1) }, status: { notIn: ["CANCELLED", "PAUSED"] } }),
    prisma.serviceJob.count({ where: { vendorId, status: "SCHEDULED", scheduledFor: { gte: addDays(day, 1), lt: addDays(day, 8) } } }),
    prisma.serviceJob.findMany({ where: { vendorId, status: "COMPLETED", paidOutAt: null }, select: { cost: true } }),
    prisma.serviceJob.findMany({ where: { vendorId, paidOutAt: { gte: monthStart } }, select: { cost: true } }),
  ]);
  const sum = (rows: { cost: unknown }[]) => rows.reduce((s, r) => s + toKobo(payoutBreakdown(Number(r.cost)).receiveNaira), 0n).toString();
  return {
    today: today.map(toDTO),
    counts: { todayTotal: today.length, todayLeft: today.filter((j) => ["SCHEDULED", "ACTIVE"].includes(j.status)).length, upcoming7d: upcoming, pendingPaymentKobo: sum(pending), paidThisMonthKobo: sum(paid), pendingJobs: pending.length },
  };
}

export type JobsTab = "todo" | "pending" | "paid" | "all";
export async function listJobs(vendorId: string, tab: JobsTab, page = 1): Promise<{ jobs: VendorJobDTO[]; page: number; hasMore: boolean }> {
  const where = {
    todo: { vendorId, status: { in: ["SCHEDULED", "ACTIVE", "RESCHEDULE_REQUESTED"] } },
    pending: { vendorId, status: "COMPLETED", paidOutAt: null },
    paid: { vendorId, paidOutAt: { not: null } },
    all: { vendorId, status: { notIn: ["CANCELLED"] } },
  }[tab];
  const size = 25;
  const rows = await loadJobs(where, size + 1, (page - 1) * size);
  return { jobs: rows.slice(0, size).map(toDTO), page, hasMore: rows.length > size };
}

export async function getJob(vendorId: string, jobId: string): Promise<VendorJobDTO> {
  const [j] = await loadJobs({ id: jobId, vendorId }, 1);
  if (!j) throw notFound("Job not found");
  return toDTO(j);
}

export async function listClients(vendorId: string): Promise<VendorClientDTO[]> {
  const rows = await prisma.vendorAssignment.findMany({
    where: { vendorId, status: { in: ["ACTIVE", "PAUSED"] } }, orderBy: { assignedAt: "desc" },
    select: { id: true, propertyId: true, serviceType: true, status: true, planType: true, assignedAt: true,
      property: { select: { title: true, city: true, owner: { select: { name: true } } } },
      jobs: { where: { status: { in: ["SCHEDULED", "ACTIVE"] } }, orderBy: { scheduledFor: "asc" }, take: 1, select: { scheduledFor: true } } },
  });
  const byProp = new Map<string, VendorClientDTO>();
  for (const r of rows) {
    const cur = byProp.get(r.propertyId);
    const next = r.jobs[0]?.scheduledFor?.toISOString() ?? null;
    if (cur) {
      cur.services.push(r.serviceType as VendorServiceType);
      if (next && (!cur.nextVisit || next < cur.nextVisit)) cur.nextVisit = next;
      if (r.status === "PAUSED") cur.status = "PAUSED";
      continue;
    }
    byProp.set(r.propertyId, {
      assignmentId: r.id, propertyId: r.propertyId, property: r.property.title, area: r.property.city, owner: r.property.owner.name ?? "Owner",
      planType: r.planType, services: [r.serviceType as VendorServiceType], status: r.status, since: r.assignedAt.toISOString(),
      window: await windowFor(r.propertyId), nextVisit: next,
    });
  }
  return [...byProp.values()];
}

export async function payoutHistory(vendorId: string, page = 1) {
  const size = 25;
  const rows = await loadJobs({ vendorId, status: "COMPLETED" }, size + 1, (page - 1) * size);
  const batches = await prisma.vendorPayoutBatch.findMany({ where: { vendorId }, orderBy: { createdAt: "desc" }, take: 10, select: { reference: true, amountKobo: true, jobCount: true, status: true, createdAt: true } });
  return { jobs: rows.slice(0, size).map(toDTO), hasMore: rows.length > size, batches: batches.map((b) => ({ ...b, amountKobo: b.amountKobo.toString() })) };
}

/* ---------- photos (S3 presigned PUT; key layout service-reports/{propertyId}/{jobId}/…) ---------- */
const MAX_PHOTOS = 20;

export async function presignJobPhotos(vendorId: string, jobId: string, files: { contentType: string; size: number }[]) {
  const job = await prisma.serviceJob.findUnique({ where: { id: jobId }, select: { vendorId: true, propertyId: true, photoKeys: true, status: true, scheduledFor: true } });
  if (!job || job.vendorId !== vendorId) throw notFound("Job not found");
  if (!["SCHEDULED", "ACTIVE"].includes(job.status) || !job.scheduledFor || !sameLagosDay(job.scheduledFor, new Date())) throw badRequest("Photos are added on the visit day");
  if (job.photoKeys.length + files.length > MAX_PHOTOS) throw badRequest(`Up to ${MAX_PHOTOS} photos per visit`);
  return Promise.all(files.map((f) => presignUpload({
    ns: "service-reports", ownerId: vendorId, contentType: f.contentType, contentLength: f.size,
    key: `service-reports/${job.propertyId}/${jobId}/${Date.now()}-${randomBytes(6).toString("hex")}.${f.contentType.split("/")[1] ?? "jpg"}`,
  })));
}

export async function attachJobPhotos(vendorId: string, jobId: string, keys: string[]) {
  const job = await prisma.serviceJob.findUnique({ where: { id: jobId }, select: { vendorId: true, propertyId: true, photoKeys: true, status: true } });
  if (!job || job.vendorId !== vendorId) throw notFound("Job not found");
  const prefix = `service-reports/${job.propertyId}/${jobId}/`;
  if (keys.some((k) => !k.startsWith(prefix))) throw badRequest("Invalid photo key");
  const photoKeys = [...new Set([...job.photoKeys, ...keys])].slice(0, MAX_PHOTOS);
  await prisma.serviceJob.update({ where: { id: jobId }, data: { photoKeys, ...(job.status === "SCHEDULED" ? { status: "ACTIVE" } : {}) } });
  return { photoCount: photoKeys.length };
}
