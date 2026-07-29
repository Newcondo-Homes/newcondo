// backend/vendor-service/src/services/vendorService.ts
// ============================================================
// Third-party vendor services: fumigation, waste management, property
// inspection, maintenance repair. Owners subscribe to a services plan (visit
// frequency scales with the plan); jobs are dispatched by the admin/vendor
// portal; owners can request extra visits (repairs are quoted first).
//
// SCHEMA (ServiceJob in packages/db):
//   propertyId · vendorId? · requestedById · serviceType (String) ·
//   status (String: REQUESTED | QUOTE_REQUESTED | SCHEDULED |
//   RESCHEDULE_REQUESTED | ACTIVE | COMPLETED | ISSUE) · scheduledFor? ·
//   notes? · issueReason? · reportNote? · cost · photoKeys[] · completedAt?
//
// BUILD NOTES:
//  • Every export declares an EXPLICIT return type — Prisma 7's payload types
//    reference internal runtime paths that can't be named across package
//    boundaries (TS2742). DTOs also keep the HTTP contract stable.
//  • AppError in shared/types is an interface — throw the ServiceError helpers.
// ============================================================
import { prisma } from "@newcondo/db";
import { conflict, forbidden, notFound, publishNotification } from "@newcondo/backend-shared";

/* ---------- DTOs ---------- */
export interface ServicePlanDTO {
  id: string;
  name: string;
  pricePerQuarter: number;
  entitlements: unknown;
  renewsAt: Date | null;
}
export interface ServiceJobDTO {
  id: string;
  propertyId: string;
  propertyTitle: string;
  serviceType: string;
  status: string;
  scheduledFor: Date | null;
  vendorName: string | null;
  vendorRating: number | null;
  cost: number;
  notes: string | null;
  reportNote: string | null;
  issueReason: string | null;
  photoCount: number;
  completedAt: Date | null;
  createdAt: Date;
}
export interface ServicesOverview {
  plan: ServicePlanDTO | null;
  jobs: ServiceJobDTO[];
}

const JOB_SELECT = {
  id: true, propertyId: true, serviceType: true, status: true, scheduledFor: true,
  notes: true, reportNote: true, issueReason: true, cost: true, photoKeys: true,
  completedAt: true, createdAt: true,
  property: { select: { title: true } },
  vendor: { select: { name: true, rating: true } },
} as const;

function toJobDTO(j: {
  id: string; propertyId: string; serviceType: string; status: string;
  scheduledFor: Date | null; notes: string | null; reportNote: string | null;
  issueReason: string | null; cost: unknown; photoKeys: string[];
  completedAt: Date | null; createdAt: Date;
  property: { title: string };
  vendor: { name: string; rating: unknown } | null;
}): ServiceJobDTO {
  return {
    id: j.id,
    propertyId: j.propertyId,
    propertyTitle: j.property.title,
    serviceType: j.serviceType,
    status: j.status,
    scheduledFor: j.scheduledFor,
    vendorName: j.vendor?.name ?? null,
    vendorRating: j.vendor?.rating != null ? Number(j.vendor.rating) : null,
    cost: Number(j.cost ?? 0),
    notes: j.notes,
    reportNote: j.reportNote,
    issueReason: j.issueReason,
    photoCount: j.photoKeys.length,
    completedAt: j.completedAt,
    createdAt: j.createdAt,
  };
}

/* ---------- owner: plan + jobs (Services page) ---------- */
export async function getServicesOverview(ownerId: string): Promise<ServicesOverview> {
  const [sub, jobs] = await Promise.all([
    prisma.serviceSubscription.findFirst({
      where: { ownerId, status: "ACTIVE" },
      select: {
        renewsAt: true,
        plan: { select: { id: true, name: true, pricePerQuarter: true, entitlements: true } },
      },
    }),
    prisma.serviceJob.findMany({
      where: { property: { ownerId } },
      orderBy: [{ scheduledFor: "desc" }, { createdAt: "desc" }],
      take: 40,
      select: JOB_SELECT,
    }),
  ]);

  return {
    plan: sub?.plan
      ? {
          id: sub.plan.id,
          name: sub.plan.name,
          pricePerQuarter: Number(sub.plan.pricePerQuarter ?? 0),
          entitlements: sub.plan.entitlements,
          renewsAt: sub.renewsAt ?? null,
        }
      : null,
    jobs: jobs.map(toJobDTO),
  };
}

/* ---------- owner: request a service ---------- */
export async function requestService(opts: {
  ownerId: string; propertyId: string; serviceType: string; notes?: string;
}): Promise<ServiceJobDTO> {
  const p = await prisma.property.findUnique({
    where: { id: opts.propertyId },
    select: { id: true, title: true, ownerId: true },
  });
  if (!p) throw notFound("Property not found");
  if (p.ownerId !== opts.ownerId) throw forbidden("Not your property");

  // Repairs are quoted before dispatch; plan-covered services schedule directly.
  const isRepair = opts.serviceType.startsWith("REPAIR");
  const job = await prisma.serviceJob.create({
    data: {
      propertyId: p.id,
      serviceType: opts.serviceType,
      status: isRepair ? "QUOTE_REQUESTED" : "REQUESTED",
      notes: opts.notes ?? null,
      requestedById: opts.ownerId,
    },
    select: JOB_SELECT,
  });
  // Admin/vendor portal picks it up from here (assign vendor, schedule, quote).
  return toJobDTO(job);
}

/* ---------- owner: reschedule / report an issue ---------- */
export async function rescheduleJob(jobId: string, ownerId: string): Promise<ServiceJobDTO> {
  const job = await ownedJob(jobId, ownerId);
  if (job.status !== "SCHEDULED") throw conflict("Only scheduled visits can be rescheduled");
  const updated = await prisma.serviceJob.update({
    where: { id: jobId },
    data: { status: "RESCHEDULE_REQUESTED" },
    select: JOB_SELECT,
  });
  return toJobDTO(updated);
}

export async function reportJobIssue(jobId: string, ownerId: string, reason: string): Promise<ServiceJobDTO> {
  await ownedJob(jobId, ownerId);
  const updated = await prisma.serviceJob.update({
    where: { id: jobId },
    data: { status: "ISSUE", issueReason: reason },
    select: JOB_SELECT,
  });
  return toJobDTO(updated);
}

async function ownedJob(jobId: string, ownerId: string): Promise<{ id: string; status: string }> {
  const job = await prisma.serviceJob.findUnique({
    where: { id: jobId },
    select: { id: true, status: true, property: { select: { ownerId: true } } },
  });
  if (!job) throw notFound("Service job not found");
  if (job.property.ownerId !== ownerId) throw forbidden("Not your property");
  return { id: job.id, status: job.status };
}

/* ---------- vendor/admin: complete a visit (notifies the owner) ---------- */
export async function completeJob(
  jobId: string,
  reportNote: string,
  photoKeys: string[] = []
): Promise<ServiceJobDTO> {
  const job = await prisma.serviceJob.update({
    where: { id: jobId },
    data: { status: "COMPLETED", completedAt: new Date(), reportNote, photoKeys },
    select: { ...JOB_SELECT, property: { select: { title: true, ownerId: true } } },
  });

  await publishNotification({
    userId: job.property.ownerId,
    kind: "service",
    title: "Service visit completed",
    body: `${job.serviceType} at ${job.property.title} — report and photos are in your dashboard.`,
    to: "/services",
    entityType: "serviceJob",
    entityId: job.id,
  });
  return toJobDTO(job);
}
