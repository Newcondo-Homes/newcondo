// backend/vendor-service/src/services/matchingService.ts
// ============================================================
// Property ↔ vendor matching.
//
// ensureAssignments(propertyId) is idempotent and is the ONLY writer of
// VendorAssignment. It runs (a) from the 5-minute reconcile cron for every
// property with an ACTIVE plan line, and (b) immediately after a plan line
// activates or changes. Per service the plan covers:
//
//   1. Plan not active (line, account subscription, suspension, off-plan)
//      → PAUSE the assignment and its future visits. Nothing is serviced or
//        paid while a property isn't on an active subscription.
//   2. Service dropped by a downgrade → END the assignment (the scheduler
//      applies VENDORS.scheduling.downgradeLeftover to the last visit).
//   3. No vendor yet → pick one:
//        • keep the owner with the vendor already serving their other
//          properties in range (an owner never has two vendors per service,
//          so vendors in one area never share a client);
//        • otherwise the lowest score among VERIFIED vendors whose service
//          area covers the property and who are under maxClients:
//            score = w.load·(load/max) + w.distance·(km/maxRadius) + w.rating·(1 − rating/5)
//          Load dominates, so new properties spread evenly between vendors.
//   Concurrency: a per-vendor advisory lock re-checks capacity inside the
//   transaction, and VendorAssignment.activeKey (UNIQUE) makes a second
//   vendor for the same property+service impossible.
// ============================================================
import { prisma } from "@newcondo/db";
import {
  VENDORS, servicesForPlan, publishNotification, sendBrandedEmail, VendorEmailTemplates, badRequest, notFound, conflict,
  type VendorServiceType, type SubscriptionPlanCode,
} from "@newcondo/backend-shared";
import { haversineKm, parseLatLng, type LatLng } from "../utils/geo";

const LIVE_SUB = ["ACTIVE", "TRIAL"];

export interface EnsureResult { propertyId: string; assigned: VendorServiceType[]; unmatched: VendorServiceType[]; paused: boolean; planChanged: boolean }

const activeKey = (propertyId: string, s: string) => `${propertyId}:${s}`;

async function loadProperty(propertyId: string) {
  return prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true, title: true, city: true, gpsCoordinates: true, ownerId: true, suspendedBySubscription: true, offPlanAt: true,
      owner: { select: { deletedAt: true, name: true, email: true } },
      subscriptionLine: { select: { planType: true, status: true, subscription: { select: { status: true } } } },
      vendorAssignments: { where: { status: { in: ["ACTIVE", "PAUSED"] } }, select: { id: true, serviceType: true, status: true, planType: true, vendorId: true } },
    },
  });
}
type Prop = NonNullable<Awaited<ReturnType<typeof loadProperty>>>;

export function isServiceable(p: Prop): boolean {
  const line = p.subscriptionLine;
  return !!line && line.status === "ACTIVE" && LIVE_SUB.includes(line.subscription.status) && !p.suspendedBySubscription && !p.offPlanAt && !p.owner.deletedAt;
}

export async function ensureAssignments(propertyId: string): Promise<EnsureResult> {
  const p = await loadProperty(propertyId);
  const res: EnsureResult = { propertyId, assigned: [], unmatched: [], paused: false, planChanged: false };
  if (!p) return res;

  if (!isServiceable(p)) {
    await pauseProperty(p);
    res.paused = true;
    return res;
  }
  const plan = p.subscriptionLine!.planType as SubscriptionPlanCode;
  const required = servicesForPlan(plan);

  for (const a of p.vendorAssignments) {
    if (!required.includes(a.serviceType as VendorServiceType)) {
      await prisma.vendorAssignment.update({ where: { id: a.id }, data: { status: "ENDED", activeKey: null, endedAt: new Date(), endReason: "SERVICE_NOT_IN_PLAN" } });
      continue;
    }
    if (a.status === "PAUSED" || a.planType !== plan) {
      if (a.planType !== plan) res.planChanged = true;
      await prisma.vendorAssignment.update({ where: { id: a.id }, data: { status: "ACTIVE", pausedAt: null, planType: plan } });
      if (a.status === "PAUSED") await prisma.serviceJob.updateMany({ where: { assignmentId: a.id, status: "PAUSED" }, data: { status: "CANCELLED" } }); // replanned fresh
    }
  }

  const loc = parseLatLng(p.gpsCoordinates);
  for (const service of required) {
    if (p.vendorAssignments.some((a) => a.serviceType === service && required.includes(service))) continue;
    if (!loc) { res.unmatched.push(service); continue; }
    const vendorId = await pickVendor(p.ownerId, service, loc, p.id);
    if (!vendorId) { res.unmatched.push(service); continue; }
    const ok = await createAssignment({ vendorId: vendorId.id, distanceKm: vendorId.km, propertyId: p.id, ownerId: p.ownerId, service, plan });
    if (ok) { res.assigned.push(service); void announce(vendorId.id, p, service); } else res.unmatched.push(service);
  }
  return res;
}

async function pauseProperty(p: Prop) {
  const live = p.vendorAssignments.filter((a) => a.status === "ACTIVE");
  if (!live.length) return;
  await prisma.$transaction([
    prisma.vendorAssignment.updateMany({ where: { id: { in: live.map((a) => a.id) } }, data: { status: "PAUSED", pausedAt: new Date() } }),
    prisma.serviceJob.updateMany({ where: { assignmentId: { in: live.map((a) => a.id) }, status: { in: ["SCHEDULED", "RESCHEDULE_REQUESTED"] } }, data: { status: "PAUSED" } }),
  ]);
  const vendors = await prisma.vendor.findMany({ where: { id: { in: [...new Set(live.map((a) => a.vendorId))] } }, select: { userId: true, name: true, email: true } });
  for (const v of vendors) {
    if (v.userId) await publishNotification({ userId: v.userId, kind: "service", title: "Client paused", body: `${p.title} — the owner's plan is not active. Don't visit until it resumes.`, to: "/clients", entityType: "property", entityId: p.id });
    if (v.email) void sendBrandedEmail(v.email, VendorEmailTemplates.clientPaused({ name: v.name, property: p.title }));
  }
}

interface Pick { id: string; km: number }

async function pickVendor(ownerId: string, service: VendorServiceType, loc: LatLng, propertyId?: string): Promise<Pick | null> {
  // ++ ADMIN — a vendor staff removed from this property is never auto-matched back to it.
  const banned = propertyId
    ? (await prisma.vendorAssignment.findMany({ where: { propertyId, serviceType: service, endReason: "ADMIN_REMOVED" }, select: { vendorId: true } })).map((r) => r.vendorId)
    : [];
  const vendors = await prisma.vendor.findMany({
    where: { status: "VERIFIED", isActive: true, services: { has: service }, ...(banned.length ? { id: { notIn: banned } } : {}) },
    select: { id: true, rating: true, maxClients: true, areas: { select: { lat: true, lng: true, radiusKm: true } } },
  });
  const inRange = vendors
    .map((v) => ({ v, km: Math.min(...v.areas.map((a) => { const d = haversineKm(loc, a); return d <= Math.min(a.radiusKm, VENDORS.matching.maxRadiusKm) ? d : Infinity; })) }))
    .filter((x) => Number.isFinite(x.km));
  if (!inRange.length) return null;

  const loads = await prisma.vendorAssignment.groupBy({
    by: ["vendorId"], where: { vendorId: { in: inRange.map((x) => x.v.id) }, status: { in: ["ACTIVE", "PAUSED"] } }, _count: { _all: true },
  });
  const load = new Map(loads.map((l) => [l.vendorId, l._count._all]));
  const open = inRange.filter((x) => (load.get(x.v.id) ?? 0) < x.v.maxClients);
  if (!open.length) return null;

  if (VENDORS.matching.keepOwnerWithOneVendor) {
    const mine = await prisma.vendorAssignment.findFirst({ where: { ownerId, serviceType: service, status: { in: ["ACTIVE", "PAUSED"] }, vendorId: { in: open.map((x) => x.v.id) } }, select: { vendorId: true } });
    if (mine) return { id: mine.vendorId, km: open.find((x) => x.v.id === mine.vendorId)!.km };
  }
  const w = VENDORS.matching.weights;
  const best = open
    .map((x) => ({ x, s: w.load * ((load.get(x.v.id) ?? 0) / Math.max(1, x.v.maxClients)) + w.distance * (x.km / VENDORS.matching.maxRadiusKm) + w.rating * (1 - Math.min(5, x.v.rating) / 5) }))
    .sort((a, b) => a.s - b.s)[0].x;
  return { id: best.v.id, km: best.km };
}

async function createAssignment(o: { vendorId: string; distanceKm: number; propertyId: string; ownerId: string; service: VendorServiceType; plan: SubscriptionPlanCode }): Promise<boolean> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${o.vendorId}))`;
      const [vendor, count] = await Promise.all([
        tx.vendor.findUnique({ where: { id: o.vendorId }, select: { maxClients: true } }),
        tx.vendorAssignment.count({ where: { vendorId: o.vendorId, status: { in: ["ACTIVE", "PAUSED"] } } }),
      ]);
      if (!vendor || count >= vendor.maxClients) return false;
      await tx.vendorAssignment.create({
        data: { propertyId: o.propertyId, ownerId: o.ownerId, vendorId: o.vendorId, serviceType: o.service, planType: o.plan, activeKey: activeKey(o.propertyId, o.service), distanceKm: Math.round(o.distanceKm * 10) / 10 },
      });
      return true;
    });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") return false; // another run already assigned it
    throw e;
  }
}

async function announce(vendorId: string, p: Prop, service: VendorServiceType) {
  const v = await prisma.vendor.findUnique({ where: { id: vendorId }, select: { userId: true, name: true, email: true } });
  const label = VENDORS.services[service].label;
  if (v?.userId) await publishNotification({ userId: v.userId, kind: "service", title: "New client assigned", body: `${p.title}, ${p.city} — ${label}`, to: "/clients", entityType: "property", entityId: p.id });
  if (v?.email) void sendBrandedEmail(v.email, VendorEmailTemplates.clientAssigned({ name: v.name, property: p.title, area: p.city, services: label, firstVisit: "shown in your schedule once booked" }));
  await publishNotification({ userId: p.ownerId, kind: "service", title: `${label} provider assigned`, body: `${v?.name ?? "A verified provider"} will service ${p.title}. Visit dates appear in Services.`, to: "/services", entityType: "property", entityId: p.id });
}

/** Cron: every property that has (or had) an active line. */
export async function reconcileAssignments(limit = 500): Promise<{ checked: number; assigned: number; unmatched: number }> {
  const rows = await prisma.property.findMany({
    where: { OR: [{ subscriptionLine: { status: "ACTIVE" } }, { vendorAssignments: { some: { status: { in: ["ACTIVE", "PAUSED"] } } } }] },
    select: { id: true }, take: limit, orderBy: { updatedAt: "desc" },
  });
  let assigned = 0, unmatched = 0;
  for (const r of rows) {
    try { const out = await ensureAssignments(r.id); assigned += out.assigned.length; unmatched += out.unmatched.length; }
    catch (e) { console.error(`[vendor-match] ${r.id}:`, (e as Error).message); }
  }
  return { checked: rows.length, assigned, unmatched };
}

/* ============================================================
   ++ ADMIN — staff overrides. Still the only writers of VendorAssignment
   besides ensureAssignments, and they keep its invariants:
     • one ACTIVE/PAUSED assignment per property+service (activeKey UNIQUE)
     • capacity re-checked under the per-vendor advisory lock
     • only services the property's plan actually pays for
     • an ended assignment ALWAYS clears activeKey, or the property could
       never be matched again (P2002 forever)
   ============================================================ */
export async function adminAssignVendor(propertyId: string, vendorId: string): Promise<{ services: VendorServiceType[]; moved: string[] }> {
  const [p, vendor] = await Promise.all([
    loadProperty(propertyId),
    prisma.vendor.findUnique({ where: { id: vendorId }, select: { id: true, status: true, isActive: true, services: true, maxClients: true } }),
  ]);
  if (!p) throw notFound("Property not found");
  if (!vendor || vendor.status !== "VERIFIED" || !vendor.isActive) throw badRequest("Only verified, active vendors can be assigned");
  if (!isServiceable(p)) throw badRequest("This property’s plan isn’t active — nothing can be serviced or paid");
  const plan = p.subscriptionLine!.planType as SubscriptionPlanCode;
  const services = servicesForPlan(plan).filter((s) => vendor.services.includes(s));
  if (!services.length) throw badRequest("This vendor doesn’t offer any service the property’s plan covers");
  const moved: string[] = [];
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${vendorId}))`;
    const count = await tx.vendorAssignment.count({ where: { vendorId, status: { in: ["ACTIVE", "PAUSED"] } } });
    const already = p.vendorAssignments.filter((a) => a.vendorId === vendorId && services.includes(a.serviceType as VendorServiceType)).length;
    if (count + services.length - already > vendor.maxClients) throw conflict("This vendor is at capacity");
    for (const service of services) {
      const cur = p.vendorAssignments.find((a) => a.serviceType === service);
      if (cur?.vendorId === vendorId) continue;
      if (cur) {
        await tx.vendorAssignment.update({ where: { id: cur.id }, data: { status: "ENDED", activeKey: null, endedAt: new Date(), endReason: "ADMIN_REASSIGNED" } });
        moved.push(cur.vendorId);
      }
      await tx.vendorAssignment.create({ data: { propertyId, ownerId: p.ownerId, vendorId, serviceType: service, planType: plan, activeKey: activeKey(propertyId, service) } });
    }
  });
  for (const s of services) void announce(vendorId, p, s);
  return { services, moved: [...new Set(moved)] };
}

/** End one vendor's assignments on a property and re-match it to someone else nearby. */
export async function adminRemoveVendor(propertyId: string, vendorId: string): Promise<EnsureResult> {
  const r = await prisma.vendorAssignment.updateMany({ where: { propertyId, vendorId, status: { in: ["ACTIVE", "PAUSED"] } }, data: { status: "ENDED", activeKey: null, endedAt: new Date(), endReason: "ADMIN_REMOVED" } });
  if (!r.count) throw badRequest("This vendor isn’t servicing that property");
  return ensureAssignments(propertyId);
}

/** Vendor suspended: end every assignment (freeing activeKey) and re-match each property. */
export async function endVendorAssignments(vendorId: string, reason = "VENDOR_SUSPENDED"): Promise<{ properties: string[] }> {
  const rows = await prisma.vendorAssignment.findMany({ where: { vendorId, status: { in: ["ACTIVE", "PAUSED"] } }, select: { propertyId: true } });
  await prisma.vendorAssignment.updateMany({ where: { vendorId, status: { in: ["ACTIVE", "PAUSED"] } }, data: { status: "ENDED", activeKey: null, endedAt: new Date(), endReason: reason } });
  const properties = [...new Set(rows.map((r) => r.propertyId))];
  for (const pid of properties) await ensureAssignments(pid).catch((e) => console.error("re-match failed", pid, e));
  return { properties };
}
