// backend/auth-service/src/jobs/cleanupStubAccounts.ts
// ============================================================
// Sweep abandoned registrations.
//
// Registering before the OTP means every abandoned form leaves a real User row:
// unverified, unsubscribed, no properties. checkEmailExists already treats
// those as ghosts (returns exists: false) so the address is never blocked from
// a genuine future signup — but the rows themselves must be swept, or they
// accumulate forever.
//
// WHAT IS DELETED — all four must hold:
//   • emailVerified is null        → never proved the address
//   • no subscription row          → never reached checkout
//   • no linked OAuth account      → password signup only; an OAuth row means a
//                                    real provider identity we must not destroy
//   • older than ACCOUNT_STUBS.expiryDays
//
// WHAT IS DELIBERATELY SPARED: anyone who owns a property, is a listing agent,
// has a rental, or has any payment history. Those are impossible for a true
// stub, but the guards stay because deleting a real user by accident is
// unrecoverable, while leaving a stub costs one row.
// ============================================================
import { prisma } from "@newcondo/db";
import { ACCOUNT_STUBS } from "@newcondo/backend-shared";

export interface CleanupResult {
  scanned: number;
  deleted: number;
  skipped: number;
}

export async function cleanupStubAccounts(
  opts: { dryRun?: boolean } = {}
): Promise<CleanupResult> {
  const cutoff = new Date(Date.now() - ACCOUNT_STUBS.expiryDays * 24 * 60 * 60 * 1000);

  const candidates = await prisma.user.findMany({
    where: {
      emailVerified: null,
      createdAt: { lt: cutoff },
      subscription: null,
      accounts: { none: {} },
      role: { not: "ADMIN" },
    },
    select: {
      id: true,
      email: true,
      _count: {
        select: {
          properties: true,
          agentListings: true,
          rentals: true,
          payments: true,
        },
      },
    },
    take: 500, // bounded per run so a large backlog can't hold a transaction open
  });

  let deleted = 0;
  let skipped = 0;

  for (const u of candidates) {
    const c = u._count;
    // Belt and braces: a stub cannot have any of these, so if one does, it is
    // not a stub and something about our assumptions is wrong. Skip and log.
    if (c.properties || c.agentListings || c.rentals || c.payments) {
      skipped++;
      console.warn(`[cleanupStubAccounts] skipped ${u.id} — has attached records`, c);
      continue;
    }
    if (opts.dryRun) { deleted++; continue; }

    await prisma.$transaction([
      // The OTP row is keyed by the EMAIL STRING, not a userId FK, so it is not
      // cascaded by deleting the user and has to go explicitly.
      prisma.oTPCode.deleteMany({ where: { identifier: u.email } }),
      prisma.eventLog.deleteMany({ where: { userId: u.id } }),
      prisma.user.delete({ where: { id: u.id } }),
    ]);
    deleted++;
  }

  console.log(
    `[cleanupStubAccounts] scanned ${candidates.length}, deleted ${deleted}, skipped ${skipped}` +
    (opts.dryRun ? " (dry run)" : "")
  );
  return { scanned: candidates.length, deleted, skipped };
}

/* ============================================================
   SCHEDULING

   Alongside the subscription-renewal cron (node-cron in the combined backend):

     import cron from "node-cron";
     import { cleanupStubAccounts } from "@newcondo/auth-service";

     // 03:20 daily — off-peak, after the renewal job.
     cron.schedule("20 3 * * *", () => {
       cleanupStubAccounts().catch((e) =>
         console.error("[cron] cleanupStubAccounts failed", e)
       );
     });

   Run it with { dryRun: true } once first and read the log before letting it
   delete anything. Also worth an admin-only route for manual runs:

     router.post("/admin/cleanup-stubs", authMiddleware, requireRole(["ADMIN"]),
       async (req, res, next) => {
         try { res.json({ success: true, data: await cleanupStubAccounts({ dryRun: !!req.body?.dryRun }) }); }
         catch (e) { next(e); }
       });

   VERIFY THE RELATION NAMES against your schema before first run —
   `properties`, `agentProperties`, `rentals` and `payments` are the names on
   User in schema.merged.prisma; if any differ in your generated client, the
   _count select will fail loudly rather than silently skipping the guard.
   ============================================================ */
