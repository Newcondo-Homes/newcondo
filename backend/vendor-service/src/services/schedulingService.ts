// backend/vendor-service/src/services/schedulingService.ts
// ============================================================
// Visit planner. One rule decides every date:
//
//   next visit = the later of
//     • the plan's rhythm   — last visit + 365/visitsPerYear days
//                             (first visit: line start + firstVisitLeadDays)
//     • the money           — the day the property's service fund will hold
//                             the visit cost after every visit already booked
//                             or awaiting payout is set aside
//   snapped to the owner's availability (always inside Mon–Thu & Sat,
//   09:00–17:00) and to a day where the vendor is under capacityPerDay.
//
// Monthly payers therefore get visits as their payments fund them; annual
// payers get evenly spaced visits. An UPGRADE raises the accrual and the
// visit count — unfrozen bookings made under the old plan are cancelled and
// rebooked, which brings the next visit forward. A DOWNGRADE lowers both;
// a dropped service follows VENDORS.scheduling.downgradeLeftover.
// Bookings inside freezeHours are never moved automatically.
// ============================================================
import { prisma } from "@newcondo/db";
import {
  VENDORS, visitCostNaira, visitIntervalDays, monthlyAccrualNaira, normaliseWindow, minuteLabel,
  fundBalanceKobo, returnFundToRevenue, toKobo, publishNotification, sendBrandedEmail, VendorEmailTemplates,
  forbidden, notFound, badRequest, type VendorServiceType, type SubscriptionPlanCode,
} from "@newcondo/backend-shared";
import { addDays, lagosParts, lagosInstant, nextAllowedDay, sameLagosDay, startOfLagosDay, lagosDayKey } from "../utils/time";
import type { OwnerVisitDTO } from "../types";

const OPEN = ["SCHEDULED", "RESCHEDULE_REQUESTED", "ACTIVE"];
const DAY = 86_400_000;

export async function windowFor(propertyId: string) {
  const w = await prisma.propertyServiceWindow.findUnique({ where: { propertyId }, select: { days: true, startMinute: true, endMinute: true } });
  return normaliseWindow(w ?? { days: VENDORS.hours.allowedDays, startMinute: VENDORS.hours.startMinute, endMinute: VENDORS.hours.endMinute });
}

/** Kobo already promised from a fund: open bookings + verified-but-unpaid jobs. */
async function committedKobo(propertyId: string, service: string): Promise<bigint> {
  const rows = await prisma.serviceJob.findMany({
    where: { propertyId, serviceType: service, OR: [{ status: { in: OPEN } }, { status: "COMPLETED", paidOutAt: null }] },
    select: { cost: true },
  });
  return rows.reduce((s, r) => s + toKobo(Number(r.cost)), 0n);
}

/** Earliest day the fund covers one more visit, or null if it never will. */
async function fundedFrom(propertyId: string, service: VendorServiceType, plan: SubscriptionPlanCode, now: Date): Promise<Date | null> {
  const free = (await fundBalanceKobo(propertyId, service)) - (await committedKobo(propertyId, service));
  const cost = toKobo(visitCostNaira(service));
  if (free >= cost) return now;
  const perMonth = toKobo(monthlyAccrualNaira(plan, service));
  if (perMonth <= 0n) return null;
  const monthsNeeded = Number((cost - free + perMonth - 1n) / perMonth);
  const line = await prisma.propertySubscription.findUnique({ where: { propertyId }, select: { subscription: { select: { currentPeriodEnd: true } } } });
  const nextRenewal = line?.subscription.currentPeriodEnd ?? now;
  // Accrual lands when each renewal is paid; add a day for the payment to clear.
  return new Date(Math.max(now.getTime(), nextRenewal.getTime()) + (monthsNeeded - 1) * 30 * DAY + DAY);
}

async function findSlot(vendorId: string, service: VendorServiceType, from: Date, win: { days: number[]; startMinute: number; endMinute: number }) {
  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { capacityPerDay: true } });
  const slot = VENDORS.hours.slotMinutes[service];
  let day = nextAllowedDay(from, win.days);
  for (let i = 0; i < VENDORS.scheduling.maxSearchDays; i++) {
    const booked = await prisma.serviceJob.count({ where: { vendorId, status: { in: [...OPEN, "COMPLETED"] }, scheduledFor: { gte: day, lt: addDays(day, 1) } } });
    const start = win.startMinute + booked * slot;
    if (booked < (vendor?.capacityPerDay ?? 4) && start + slot <= win.endMinute) {
      const p = lagosParts(day);
      return { start: lagosInstant(p.y, p.m, p.d, start), end: lagosInstant(p.y, p.m, p.d, Math.min(win.endMinute, start + slot)) };
    }
    day = nextAllowedDay(addDays(day, 1), win.days);
  }
  return null;
}

export interface PlanResult { booked: number; cancelled: number }

/** Idempotent — safe to run on every reconcile tick. */
export async function planProperty(propertyId: string, now = new Date()): Promise<PlanResult> {
  const res: PlanResult = { booked: 0, cancelled: 0 };
  const prop = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true, title: true, address: true, ownerId: true, owner: { select: { name: true, email: true } }, subscriptionLine: { select: { startedAt: true } },
      vendorAssignments: { where: { status: { in: ["ACTIVE", "ENDED"] } }, select: { id: true, status: true, serviceType: true, planType: true, vendorId: true, endedAt: true, endReason: true, vendor: { select: { name: true, userId: true } } } } },
  });
  if (!prop) throw notFound("Property not found");
  const win = await windowFor(propertyId);
  const freezeUntil = new Date(now.getTime() + VENDORS.scheduling.freezeHours * 3600_000);

  for (const a of prop.vendorAssignments) {
    const service = a.serviceType as VendorServiceType;
    const plan = a.planType as SubscriptionPlanCode;

    if (a.status === "ENDED") { res.cancelled += await settleEnded(a.id, propertyId, service, freezeUntil); continue; }

    // Bookings made under an older plan and not yet frozen are rebooked.
    const stale = await prisma.serviceJob.updateMany({
      where: { assignmentId: a.id, status: { in: ["SCHEDULED", "RESCHEDULE_REQUESTED"] }, scheduledFor: { gt: freezeUntil }, NOT: { planType: plan } },
      data: { status: "CANCELLED", notes: "Replanned after a plan change" },
    });
    res.cancelled += stale.count;

    const open = await prisma.serviceJob.findFirst({ where: { assignmentId: a.id, status: { in: OPEN } }, select: { id: true } });
    if (open) continue; // one booked visit per service at a time

    const last = await prisma.serviceJob.findFirst({ where: { propertyId, serviceType: service, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { completedAt: true } });
    const rhythm = last?.completedAt
      ? addDays(last.completedAt, visitIntervalDays(plan, service))
      : addDays(prop.subscriptionLine?.startedAt ?? now, VENDORS.scheduling.firstVisitLeadDays);
    const funded = await fundedFrom(propertyId, service, plan, now);
    if (!funded) continue;
    const target = new Date(Math.max(rhythm.getTime(), funded.getTime(), addDays(startOfLagosDay(now), 1).getTime()));
    if (target.getTime() > now.getTime() + VENDORS.scheduling.bookAheadDays * DAY) continue; // projected, not booked yet

    const slot = await findSlot(a.vendorId, service, target, win);
    if (!slot) continue;
    const job = await prisma.serviceJob.create({
      data: { propertyId, vendorId: a.vendorId, assignmentId: a.id, requestedById: prop.ownerId, serviceType: service, status: "SCHEDULED", scheduledFor: slot.start, windowEnd: slot.end, cost: visitCostNaira(service), planType: plan },
      select: { id: true },
    });
    res.booked++;
    const label = VENDORS.services[service].label;
    const when = `${lagosDayKey(slot.start)} · ${minuteLabel(lagosParts(slot.start).minute)} – ${minuteLabel(lagosParts(slot.end).minute)}`;
    await publishNotification({ userId: prop.ownerId, kind: "service", title: `${label} booked`, body: `${prop.title} · ${when} · ${a.vendor.name}`, to: "/services", entityType: "serviceJob", entityId: job.id });
    if (a.vendor.userId) await publishNotification({ userId: a.vendor.userId, kind: "service", title: "Visit booked", body: `${label} · ${prop.title} · ${when}`, to: `/jobs?open=${job.id}`, entityType: "serviceJob", entityId: job.id });
    if (prop.owner.email) void sendBrandedEmail(prop.owner.email, VendorEmailTemplates.visitBooked({ name: prop.owner.name ?? "there", property: prop.title, service: label, date: lagosDayKey(slot.start), window: when.split(" · ")[1], vendor: a.vendor.name }));
  }
  return res;
}

/** Downgrade / dropped service: honour funded unfrozen visits (policy), cancel
 *  the rest, and once nothing is open, return the leftover to revenue. */
async function settleEnded(assignmentId: string, propertyId: string, service: VendorServiceType, freezeUntil: Date): Promise<number> {
  let cancelled = 0;
  const unfrozen = await prisma.serviceJob.findMany({ where: { assignmentId, status: { in: ["SCHEDULED", "RESCHEDULE_REQUESTED"] }, scheduledFor: { gt: freezeUntil } }, select: { id: true } });
  const honour = VENDORS.scheduling.downgradeLeftover === "HONOR_IF_FUNDED"
    && (await fundBalanceKobo(propertyId, service)) >= (await committedKobo(propertyId, service));
  if (unfrozen.length && !honour) {
    cancelled = (await prisma.serviceJob.updateMany({ where: { id: { in: unfrozen.map((j) => j.id) } }, data: { status: "CANCELLED", notes: "Service removed by a plan change" } })).count;
  }
  const stillOpen = await prisma.serviceJob.count({ where: { assignmentId, OR: [{ status: { in: OPEN } }, { status: "COMPLETED", paidOutAt: null }] } });
  if (!stillOpen) await prisma.$transaction((tx) => returnFundToRevenue(tx, propertyId, service, "Service dropped from plan — leftover returned", assignmentId));
  return cancelled;
}

/** Cancel unfrozen bookings and plan again (window change, vendor can't make it). */
export async function replanProperty(propertyId: string, reason: string, now = new Date()): Promise<PlanResult> {
  const freezeUntil = new Date(now.getTime() + VENDORS.scheduling.freezeHours * 3600_000);
  const c = await prisma.serviceJob.updateMany({ where: { propertyId, status: { in: ["SCHEDULED", "RESCHEDULE_REQUESTED"] }, scheduledFor: { gt: freezeUntil } }, data: { status: "CANCELLED", notes: reason } });
  const r = await planProperty(propertyId, now);
  return { booked: r.booked, cancelled: r.cancelled + c.count };
}

/** Owner / listing agent sets availability for one property. */
export async function setServiceWindow(propertyId: string, userId: string, input: { days: number[]; startMinute: number; endMinute: number }) {
  const p = await prisma.property.findUnique({ where: { id: propertyId }, select: { ownerId: true, agentId: true } });
  if (!p) throw notFound("Property not found");
  if (p.ownerId !== userId && p.agentId !== userId) throw forbidden("Only the owner or listing agent can change visit availability");
  const w = normaliseWindow(input);
  if (!w.days.length) throw badRequest("Pick at least one service day");
  await prisma.propertyServiceWindow.upsert({ where: { propertyId }, create: { propertyId, ...w, updatedById: userId }, update: { ...w, updatedById: userId } });
  const plan = await replanProperty(propertyId, "Owner changed availability");
  const vendors = await prisma.vendorAssignment.findMany({ where: { propertyId, status: "ACTIVE" }, select: { vendor: { select: { userId: true } }, property: { select: { title: true } } } });
  for (const v of vendors) if (v.vendor.userId) await publishNotification({ userId: v.vendor.userId, kind: "service", title: "Visit window changed", body: `${v.property.title}: ${w.days.length} day(s), ${minuteLabel(w.startMinute)} – ${minuteLabel(w.endMinute)}`, to: "/schedule" });
  return { window: w, ...plan };
}

/** Vendor "Can't make it" — frozen bookings move too, the owner is told. */
export async function vendorReschedule(jobId: string, vendorId: string, reason: string) {
  const job = await prisma.serviceJob.findUnique({ where: { id: jobId }, select: { id: true, vendorId: true, status: true, propertyId: true, serviceType: true, property: { select: { ownerId: true, title: true } } } });
  if (!job || job.vendorId !== vendorId) throw notFound("Job not found");
  if (!["SCHEDULED", "RESCHEDULE_REQUESTED"].includes(job.status)) throw badRequest("Only booked visits can be moved");
  await prisma.serviceJob.update({ where: { id: jobId }, data: { status: "CANCELLED", notes: `Vendor rescheduled: ${reason}`.slice(0, 500) } });
  const r = await planProperty(job.propertyId);
  await publishNotification({ userId: job.property.ownerId, kind: "service", title: "Visit moved", body: `Your provider can't make the ${job.serviceType.toLowerCase().replace("_", " ")} at ${job.property.title}. A new date has been booked.`, to: "/services", entityType: "serviceJob", entityId: jobId });
  return r;
}

/** Cron: booked visits whose day ended without a verified code. */
export async function markMissedVisits(now = new Date()): Promise<number> {
  const due = await prisma.serviceJob.findMany({ where: { status: { in: ["SCHEDULED", "ACTIVE"] }, windowEnd: { lt: startOfLagosDay(now) } }, select: { id: true, propertyId: true, property: { select: { ownerId: true, title: true } } } });
  for (const j of due) {
    await prisma.serviceJob.update({ where: { id: j.id }, data: { status: "MISSED" } });
    await publishNotification({ userId: j.property.ownerId, kind: "service", title: "Visit not confirmed", body: `No visit code was confirmed for ${j.property.title}. We're booking a new date.`, to: "/services", entityType: "serviceJob", entityId: j.id });
    await planProperty(j.propertyId, now);
  }
  return due.length;
}

/** Owner / listing agent / active tenant: visits across their properties. */
export async function listVisitsFor(userId: string, now = new Date()): Promise<OwnerVisitDTO[]> {
  const jobs = await prisma.serviceJob.findMany({
    where: {
      status: { in: [...OPEN, "COMPLETED", "MISSED"] }, scheduledFor: { gte: addDays(now, -60) }, assignmentId: { not: null },
      property: { OR: [{ ownerId: userId }, { agentId: userId }, { rentals: { some: { renterId: userId, status: "ACTIVE" } } }] },
    },
    orderBy: { scheduledFor: "asc" }, take: 60,
    select: { id: true, propertyId: true, serviceType: true, status: true, scheduledFor: true, windowEnd: true, vendor: { select: { name: true } }, property: { select: { title: true } },
      codes: { where: { usedAt: null, expiresAt: { gt: now } }, select: { id: true } } },
  });
  return jobs.map((j) => ({
    jobId: j.id, propertyId: j.propertyId, property: j.property.title, service: j.serviceType as VendorServiceType, status: j.status,
    scheduledFor: j.scheduledFor?.toISOString() ?? null, windowEnd: j.windowEnd?.toISOString() ?? null, vendor: j.vendor?.name ?? null,
    canGenerateCode: ["SCHEDULED", "ACTIVE"].includes(j.status) && !!j.scheduledFor && sameLagosDay(j.scheduledFor, now),
    codeActive: j.codes.length > 0,
  }));
}

/** Cron: plan every property with an active assignment. */
export async function planAll(limit = 1000): Promise<{ booked: number; cancelled: number }> {
  const props = await prisma.vendorAssignment.findMany({ where: { status: { in: ["ACTIVE", "ENDED"] }, OR: [{ status: "ACTIVE" }, { endedAt: { gt: addDays(new Date(), -400) } }] }, distinct: ["propertyId"], select: { propertyId: true }, take: limit });
  let booked = 0, cancelled = 0;
  for (const p of props) { try { const r = await planProperty(p.propertyId); booked += r.booked; cancelled += r.cancelled; } catch (e) { console.error(`[vendor-plan] ${p.propertyId}:`, (e as Error).message); } }
  return { booked, cancelled };
}

/* ++ ADMIN — rebook one visit. The scheduler, not staff, picks the date: it
   respects the property's service window, Fri/Sun blackout, vendor capacity
   and — critically — only books dates the property's paid plan months have
   funded, so NewCondo never pays a vendor out of margin. */
export async function adminRebookVisit(jobId: string, reason: string): Promise<PlanResult> {
  const job = await prisma.serviceJob.findUnique({ where: { id: jobId }, select: { id: true, status: true, propertyId: true, serviceType: true, verifiedAt: true, vendorId: true, property: { select: { ownerId: true, title: true } }, vendor: { select: { userId: true } } } });
  if (!job) throw notFound("Visit not found");
  if (job.verifiedAt || job.status === "COMPLETED") throw badRequest("This visit was already carried out (code verified) — it can’t be rebooked");
  if (!["SCHEDULED", "RESCHEDULE_REQUESTED", "MISSED", "ISSUE", "PAUSED"].includes(job.status)) throw badRequest("Only booked, missed or disputed visits can be rebooked");
  await prisma.serviceJob.update({ where: { id: jobId }, data: { status: "CANCELLED", notes: `Rebooked by NewCondo: ${reason}`.slice(0, 500) } });
  const r = await planProperty(job.propertyId);
  await publishNotification({ userId: job.property.ownerId, kind: "service", title: "Visit rebooked", body: `The ${job.serviceType.toLowerCase().replace(/_/g, " ")} at ${job.property.title} has a new date in Services.`, to: "/services", entityType: "serviceJob", entityId: jobId });
  if (job.vendor?.userId) await publishNotification({ userId: job.vendor.userId, kind: "service", title: "Visit moved by NewCondo", body: `${job.property.title} — check your schedule for the new date.`, to: "/jobs", entityType: "serviceJob", entityId: jobId });
  return r;
}
