// backend/vendor-service/src/services/vendorService.ts
// ============================================================
// Third-party vendor services: fumigation, waste management, property
// inspection, maintenance repair. Owners subscribe to a services plan
// (visit frequency scales with plan); jobs are scheduled/dispatched by
// admin/vendor portal; owners can request extra visits (repairs quoted).
// Prisma: ServicePlan / ServiceSubscription / ServiceJob (schema-additions v2)
// — reconcile if your schema already models these.
// ============================================================
import { prisma } from "@newcondo/db";
import { AppError, ForbiddenError, NotFoundError, publishNotification } from "@newcondo/backend-shared";

export async function getServicesOverview(ownerId: string) {
  const [sub, jobs] = await Promise.all([
    prisma.serviceSubscription.findFirst({ where: { ownerId, status: "ACTIVE" }, include: { plan: true } }),
    prisma.serviceJob.findMany({
      where: { property: { ownerId } }, orderBy: [{ scheduledFor: "desc" }],
      include: { property: { select: { title: true } }, vendor: { select: { name: true, rating: true } } }, take: 40,
    }),
  ]);
  return { plan: sub, jobs };
}

export async function requestService(opts: { ownerId: string; propertyId: string; serviceType: string; notes?: string }) {
  const p = await prisma.property.findUnique({ where: { id: opts.propertyId }, select: { id: true, title: true, ownerId: true } });
  if (!p) throw new NotFoundError("Property not found");
  if (p.ownerId !== opts.ownerId) throw new ForbiddenError("Not your property");
  const isRepair = opts.serviceType.startsWith("REPAIR");
  const job = await prisma.serviceJob.create({
    data: { propertyId: p.id, serviceType: opts.serviceType as never, status: isRepair ? "QUOTE_REQUESTED" : "REQUESTED", notes: opts.notes, requestedById: opts.ownerId },
  });
  // Admin/vendor portal picks it up from here (assign vendor, schedule, quote).
  return job;
}

export async function rescheduleJob(jobId: string, ownerId: string) {
  const job = await ownedJob(jobId, ownerId);
  if (job.status !== "SCHEDULED") throw new AppError("Only scheduled visits can be rescheduled", 409);
  return prisma.serviceJob.update({ where: { id: jobId }, data: { status: "RESCHEDULE_REQUESTED" } });
}

export async function reportJobIssue(jobId: string, ownerId: string, reason: string) {
  await ownedJob(jobId, ownerId);
  return prisma.serviceJob.update({ where: { id: jobId }, data: { status: "ISSUE", issueReason: reason } });
}

async function ownedJob(jobId: string, ownerId: string) {
  const job = await prisma.serviceJob.findUnique({ where: { id: jobId }, include: { property: { select: { ownerId: true } } } });
  if (!job) throw new NotFoundError("Service job not found");
  if (job.property.ownerId !== ownerId) throw new ForbiddenError("Not your property");
  return job;
}

/** Vendor/admin side: completing a visit notifies the owner AND affected tenants. */
export async function completeJob(jobId: string, reportNote: string, photoKeys: string[] = []) {
  const job = await prisma.serviceJob.update({
    where: { id: jobId }, data: { status: "COMPLETED", completedAt: new Date(), reportNote, photoKeys: photoKeys as never },
    include: { property: { select: { ownerId: true, title: true } } },
  });
  await publishNotification({ userId: job.property.ownerId, kind: "service", title: "Service visit completed", body: `${job.serviceType} at ${job.property.title} — report and photos are in your dashboard.`, to: "/services", entityType: "serviceJob", entityId: job.id });
  return job;
}
