// backend/auth-service/src/jobs/processAccountDeletions.ts
// ============================================================
// The clock that makes the promise true. Without this job, "we delete within
// 30 days" is a sentence on a web page — and a sentence on a web page that
// isn't executed is the easiest claim in the world to prove against us.
//
// Runs daily, alongside cleanupStubAccounts. Three passes, in order:
//
//   1. REMIND   — 14, 7 and 1 day before erasure, email the person. Deletion
//                 should never be a surprise, and the reminder is also how an
//                 account-takeover victim finds out in time to cancel.
//   2. ERASE    — grace window expired (day 21) → anonymizeUser(). Identity gone.
//   3. PURGE    — 18 months after erasure → purgeAnonymizedUser().
//
// Bounded per run (take: 200) so a backlog can never hold a long transaction
// open, and each account is isolated in its own try/catch: one failure must not
// stop the other 199 from being erased on time.
// ============================================================
import { prisma } from "@newcondo/db";
import { ACCOUNT_DELETION, sendBrandedEmail } from "@newcondo/backend-shared";
import { accountDeletionReminderEmail } from "@newcondo/backend-shared";
import { anonymizeUser, purgeAnonymizedUser } from "../services/accountAnonymization.service";

export interface DeletionSweepResult {
  reminded: number;
  erased: number;
  purged: number;
  failed: number;
}

const DAY = 24 * 60 * 60 * 1000;

export async function processAccountDeletions(
  opts: { dryRun?: boolean } = {}
): Promise<DeletionSweepResult> {
  const now = new Date();
  let reminded = 0, erased = 0, purged = 0, failed = 0;

  /* ---------- 1. reminders ---------- */
  for (const daysBefore of ACCOUNT_DELETION.reminderDaysBefore) {
    const from = new Date(now.getTime() + daysBefore * DAY);
    const to = new Date(from.getTime() + DAY);
    const due = await prisma.accountDeletionRequest.findMany({
      where: { status: "PENDING", anonymizeAfter: { gte: from, lt: to } },
      select: {
        id: true, anonymizeAfter: true, roleAtRequest: true, snapshot: true,
        user: { select: { id: true, email: true, name: true, deletedAt: true } },
      },
      take: 200,
    });
    for (const r of due) {
      if (!r.user?.deletedAt) continue; // cancelled between passes
      try {
        if (!opts.dryRun) {
          // sendBrandedEmail is positional: (to, content).
          await sendBrandedEmail(
            r.user.email,
            accountDeletionReminderEmail({
              name: r.user.name ?? "there",
              daysLeft: daysBefore,
              erasureDate: r.anonymizeAfter,
              role: r.roleAtRequest,
              // Snapshot taken at request time — so the reminder describes the
              // same account state the first email did.
              counts: (r.snapshot as Record<string, number> | null) ?? undefined,
            })
          );
        }
        reminded++;
      } catch (e) {
        failed++;
        console.error(`[processAccountDeletions] reminder failed for ${r.id}`, e);
      }
    }
  }

  /* ---------- 2. erasure ---------- */
  const dueForErasure = await prisma.accountDeletionRequest.findMany({
    where: { status: "PENDING", anonymizeAfter: { lte: now } },
    select: { id: true, userId: true, user: { select: { deletedAt: true, anonymizedAt: true } } },
    take: 200,
  });
  for (const r of dueForErasure) {
    // Belt and braces: a row whose deletedAt was cleared was reactivated and the
    // request should already be CANCELLED. If the two ever disagree, the
    // ACCOUNT wins — never erase someone who appears to be back.
    if (!r.user?.deletedAt || r.user.anonymizedAt) {
      await prisma.accountDeletionRequest.update({
        where: { id: r.id },
        data: { status: r.user?.anonymizedAt ? "ANONYMIZED" : "CANCELLED", cancelledBy: "system-reconcile" },
      });
      continue;
    }
    try {
      await anonymizeUser(r.userId, { dryRun: opts.dryRun });
      erased++;
    } catch (e) {
      failed++;
      // Left PENDING on purpose: it retries tomorrow. A partially erased account
      // that silently stops retrying is the worst outcome of all.
      console.error(`[processAccountDeletions] erasure failed for ${r.userId}`, e);
    }
  }

  /* ---------- 3. final purge ---------- */
  const dueForPurge = await prisma.user.findMany({
    where: { anonymizedAt: { not: null }, purgedAt: null, purgeAfter: { lte: now } },
    select: { id: true },
    take: 200,
  });
  for (const u of dueForPurge) {
    try {
      const res = await purgeAnonymizedUser(u.id, { dryRun: opts.dryRun });
      if (res.purged) purged++;
    } catch (e) {
      failed++;
      console.error(`[processAccountDeletions] purge failed for ${u.id}`, e);
    }
  }

  console.log(
    `[processAccountDeletions] reminded ${reminded}, erased ${erased}, purged ${purged}, failed ${failed}` +
      (opts.dryRun ? " (dry run)" : "")
  );
  return { reminded, erased, purged, failed };
}

/* ============================================================
   SCHEDULING — combined backend, next to cleanupStubAccounts:

     import cron from "node-cron";
     import { processAccountDeletions } from "@newcondo/auth-service";

     // 03:40 daily, after the stub sweep.
     cron.schedule("40 3 * * *", () => {
       processAccountDeletions().catch((e) =>
         console.error("[cron] processAccountDeletions failed", e)
       );
     });

   Run once with { dryRun: true } and read the log before letting it erase.

   MONITORING: alert if `failed > 0` two runs in a row, or if any PENDING row
   has anonymizeAfter more than 3 days in the past. Erasure is due on day 21 and
   the published promise is 30 days, so a 3-day lag is an EARLY WARNING with ~6
   days of margin left, not yet a breach. Escalate hard at 6 days: past that the
   NDPA exposure is real.
   ============================================================ */
