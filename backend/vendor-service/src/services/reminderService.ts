// backend/vendor-service/src/services/reminderService.ts
// ============================================================
// Reminder rings before FUMIGATION and INSPECTION visits (never waste):
// two days before and on the morning of the visit (VENDORS.reminders).
// Each round rings ONE person at a time in contactOrder — a tenant first
// (they're at the property), then the listing agent, then the owner — and
// stops at the first pickup. Tenants rotate so the same one isn't rung every
// visit. The answered call is hung up at once (shared callReminder.ts).
// ============================================================
import { prisma } from "@newcondo/db";
import { VENDORS, getCallReminderProvider, toNigerianE164, HANG_UP_XML, publishNotification, type ReminderContactRole } from "@newcondo/backend-shared";
import { addDays, lagosParts, startOfLagosDay } from "../utils/time";

const hm = (s: string) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };

interface Contact { role: ReminderContactRole; userId: string; phone: string }

async function contactsFor(job: { propertyId: string; id: string }, visitIndex: number): Promise<Contact[]> {
  const p = await prisma.property.findUnique({
    where: { id: job.propertyId },
    select: { owner: { select: { id: true, phone: true } }, agent: { select: { id: true, phone: true } },
      rentals: { where: { status: "ACTIVE" }, orderBy: { createdAt: "asc" }, select: { renter: { select: { id: true, phone: true } } } } },
  });
  if (!p) return [];
  const tenants = p.rentals.map((r) => r.renter);
  const rotated = tenants.length ? [...tenants.slice(visitIndex % tenants.length), ...tenants.slice(0, visitIndex % tenants.length)] : [];
  const byRole: Record<ReminderContactRole, { id: string; phone: string | null }[]> = { TENANT: rotated, LISTING_AGENT: p.agent ? [p.agent] : [], OWNER: [p.owner] };
  const out: Contact[] = [];
  for (const role of VENDORS.reminders.contactOrder) for (const u of byRole[role]) {
    const e164 = toNigerianE164(u.phone);
    if (e164 && !out.some((c) => c.phone === e164)) out.push({ role, userId: u.id, phone: e164 });
  }
  return out;
}

export async function runReminderCalls(now = new Date()): Promise<{ rung: number }> {
  const local = lagosParts(now).minute;
  if (local >= VENDORS.hours.endMinute) return { rung: 0 };
  const provider = getCallReminderProvider();
  const staleBefore = new Date(now.getTime() - VENDORS.reminders.retryMinutes * 60_000);
  await prisma.serviceReminderCall.updateMany({ where: { status: "RINGING", createdAt: { lt: staleBefore } }, data: { status: "NO_ANSWER" } });
  let rung = 0;

  for (const offset of VENDORS.reminders.daysBefore) {
    if (local < hm(offset === 0 ? VENDORS.reminders.callAt.sameDay : VENDORS.reminders.callAt.daysBefore)) continue;
    const day = startOfLagosDay(addDays(now, offset));
    const jobs = await prisma.serviceJob.findMany({
      where: { status: "SCHEDULED", serviceType: { in: VENDORS.reminders.services }, scheduledFor: { gte: day, lt: addDays(day, 1) } },
      select: { id: true, propertyId: true, reminderCalls: { where: { dayOffset: offset }, select: { userId: true, status: true, createdAt: true } } },
      take: 300,
    });
    for (const job of jobs) {
      const calls = job.reminderCalls;
      if (calls.some((c) => c.status === "ANSWERED" || c.status === "RINGING")) continue;
      const done = await prisma.serviceJob.count({ where: { propertyId: job.propertyId, status: "COMPLETED" } });
      const contacts = await contactsFor(job, done);
      const next = contacts.find((c) => calls.filter((x) => x.userId === c.userId).length < VENDORS.reminders.attemptsPerContact);
      if (!next) {
        if (calls.length && offset === 0) await notifyNobody(job.id);
        continue;
      }
      try {
        const placed = await provider.placeCall(next.phone);
        await prisma.serviceReminderCall.create({
          data: { jobId: job.id, dayOffset: offset, contactRole: next.role, userId: next.userId, phoneE164: next.phone, attempt: calls.filter((x) => x.userId === next.userId).length + 1,
            provider: placed.provider, providerCallId: placed.providerCallId, status: placed.provider === "log" ? "ANSWERED" : "RINGING", answeredAt: placed.provider === "log" ? now : null },
        });
        rung++;
      } catch (e) {
        await prisma.serviceReminderCall.create({ data: { jobId: job.id, dayOffset: offset, contactRole: next.role, userId: next.userId, phoneE164: next.phone, provider: provider.name, status: "FAILED" } });
        console.error(`[reminder] ${job.id}:`, (e as Error).message);
      }
    }
  }
  return { rung };
}

async function notifyNobody(jobId: string) {
  const j = await prisma.serviceJob.findUnique({ where: { id: jobId }, select: { vendor: { select: { userId: true } }, property: { select: { title: true } } } });
  if (j?.vendor?.userId) await publishNotification({ userId: j.vendor.userId, kind: "service", title: "No one picked up the reminder", body: `${j.property.title} — call the owner before you travel.`, to: `/jobs?open=${jobId}`, entityType: "serviceJob", entityId: jobId });
}

/** Africa's Talking voice callback. isActive=1 → answered: record and hang up. */
export async function handleVoiceCallback(body: Record<string, string>): Promise<string> {
  const sessionId = body.sessionId;
  if (!sessionId) return HANG_UP_XML;
  if (body.isActive === "1") {
    await prisma.serviceReminderCall.updateMany({ where: { providerCallId: sessionId, status: "RINGING" }, data: { status: "ANSWERED", answeredAt: new Date() } });
  } else {
    await prisma.serviceReminderCall.updateMany({ where: { providerCallId: sessionId, status: "RINGING" }, data: { status: "NO_ANSWER" } });
  }
  return HANG_UP_XML;
}
