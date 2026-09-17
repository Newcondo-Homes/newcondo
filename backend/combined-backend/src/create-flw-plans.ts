// backend/combined-backend/src/create-flw-plans.ts
// ============================================================================
// PURPOSE: Sync Flutterwave payment plans + the FlutterwavePlan table to the
//          single source of truth in
//          backend/shared/src/constants/subscriptionPlans.ts
//
// RUN:  pnpm --filter @newcondo/combined-backend create-flutterwave-plan
//       (or during development: pnpm --filter @newcondo/combined-backend exec
//        tsx src/create-flw-plans.ts)
//
// FLAGS:
//   --dry-run   show what would happen, touch nothing
//   --prune     also cancel Flutterwave plans this script previously created
//               whose price has changed (default: leaves the old plan active
//               so subscribers mid-cycle keep billing — see below)
//
// WHY IT IS A SYNC, NOT A CREATE:
//   A Flutterwave payment plan's amount is IMMUTABLE. Changing a price means
//   creating a new plan and repointing FlutterwavePlan.flwPlanId at it. Rows
//   already on the old plan keep their own flwPlanId on Subscription, so
//   existing subscribers are unaffected until they re-subscribe.
//
// SAFE TO RE-RUN: unchanged plans are skipped.
// ============================================================================

// import dotenv from "dotenv";
// dotenv.config();

// import axios from "axios";
// import { prisma, SubscriptionPlan, BillingCycle } from "@newcondo/db";
// import { sellablePlans, formatNaira } from "@newcondo/backend-shared";

// const FLW_SECRET = process.env.FLUTTERWAVE_SECRET_KEY!;
// const FLW_BASE = process.env.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";
// const DRY = process.argv.includes("--dry-run");
// const PRUNE = process.argv.includes("--prune");

// if (!FLW_SECRET) {
//   console.error("❌ FLUTTERWAVE_SECRET_KEY is not set in environment");
//   process.exit(1);
// }

// const flw = axios.create({
//   baseURL: FLW_BASE,
//   headers: { Authorization: `Bearer ${FLW_SECRET}`, "Content-Type": "application/json" },
//   timeout: 30_000,
// });

// const isLiveKey = FLW_SECRET.includes("FLWSECK-") && !FLW_SECRET.includes("TEST");

// async function createFlwPlan(name: string, amount: number, interval: string) {
//   const res = await flw.post("/payment-plans", {
//     amount,
//     name,
//     interval,
//     duration: 0, // 0 = recurring indefinitely
//     currency: "NGN",
//   });
//   if (res.data?.status !== "success") {
//     throw new Error(res.data?.message ?? "Flutterwave rejected the plan");
//   }
//   return res.data.data as { id: number; plan_token?: string };
// }

// async function cancelFlwPlan(flwPlanId: string) {
//   // Deactivates the plan so nothing new can subscribe to it. Does NOT cancel
//   // existing subscriptions — cancel those from the dashboard or
//   // PUT /v3/subscriptions/{id}/cancel.
//   await flw.put(`/payment-plans/${flwPlanId}/cancel`, {});
// }

// async function sync() {
//   const specs = sellablePlans();
//   console.log(
//     `\n🔄 Syncing ${specs.length} plans to Flutterwave ` +
//     `[${isLiveKey ? "LIVE" : "TEST"} key]${DRY ? " — DRY RUN" : ""}\n`
//   );

//   let created = 0, repriced = 0, skipped = 0, failed = 0;

//   for (const spec of specs) {
//     const planType = spec.code as SubscriptionPlan;
//     const label = `${spec.flwName} (${formatNaira(spec.amountNaira)}/${spec.flwInterval})`;

//     try {
//       const existing = await prisma.flutterwavePlan.findUnique({ where: { planType } });

//       // 1. Already correct — nothing to do.
//       if (existing && Number(existing.amountNaira) === spec.amountNaira) {
//         console.log(`⏭  ${label} — in sync (FLW ID ${existing.flwPlanId})`);
//         skipped++;
//         continue;
//       }

//       // 2. Price changed — the old FLW plan can't be edited, so mint a new one.
//       if (existing) {
//         console.log(
//           `💱 ${label} — price changed from ${formatNaira(Number(existing.amountNaira))} ` +
//           `(old FLW ID ${existing.flwPlanId})`
//         );
//         if (DRY) { repriced++; continue; }

//         const fresh = await createFlwPlan(spec.flwName, spec.amountNaira, spec.flwInterval);
//         await prisma.flutterwavePlan.update({
//           where: { planType },
//           data: {
//             name: spec.flwName,
//             flwPlanId: String(fresh.id),
//             flwPlanCode: fresh.plan_token ?? null,
//             amountNaira: spec.amountNaira,
//             billingCycle: BillingCycle[spec.cycle],
//             interval: spec.flwInterval,
//             isActive: true,
//           },
//         });

//         if (PRUNE) {
//           await cancelFlwPlan(existing.flwPlanId);
//           console.log(`   🧹 cancelled old FLW plan ${existing.flwPlanId}`);
//         } else {
//           console.log(
//             `   ⚠️  old FLW plan ${existing.flwPlanId} left ACTIVE so mid-cycle ` +
//             `subscribers keep billing — re-run with --prune to cancel it`
//           );
//         }
//         console.log(`   ✅ now on FLW ID ${fresh.id}`);
//         repriced++;
//         continue;
//       }

//       // 3. Brand new plan.
//       if (DRY) { console.log(`➕ ${label} — would create`); created++; continue; }

//       const fresh = await createFlwPlan(spec.flwName, spec.amountNaira, spec.flwInterval);
//       await prisma.flutterwavePlan.create({
//         data: {
//           planType,
//           name: spec.flwName,
//           description: spec.tagline,
//           flwPlanId: String(fresh.id),
//           flwPlanCode: fresh.plan_token ?? null,
//           amountNaira: spec.amountNaira,
//           billingCycle: BillingCycle[spec.cycle],
//           interval: spec.flwInterval,
//           isActive: true,
//         },
//       });
//       console.log(`✅ ${label} — created (FLW ID ${fresh.id})`);
//       created++;
//     } catch (err: unknown) {
//       const e = err as { response?: { data?: unknown }; message?: string };
//       console.error(`❌ ${label} — failed:`, e.response?.data ?? e.message);
//       failed++;
//     }
//   }

//   // Rows for plans no longer sellable (e.g. a tier you retired) — flag, don't
//   // delete: Subscription.planId has onDelete: Restrict for a reason.
//   const sellableCodes = new Set(specs.map((s) => s.code as string));
//   const orphans = await prisma.flutterwavePlan.findMany({ where: { isActive: true } });
//   for (const row of orphans) {
//     if (!sellableCodes.has(row.planType)) {
//       console.log(
//         `⚠️  ${row.planType} is ACTIVE in the DB but no longer sellable in ` +
//         `SUBSCRIPTION_PLANS — set isActive: false manually when its subscribers are gone`
//       );
//     }
//   }

//   console.log(
//     `\n${DRY ? "DRY RUN — " : ""}Done. created ${created} · repriced ${repriced} · ` +
//     `in sync ${skipped} · failed ${failed}\n`
//   );
//   await prisma.$disconnect();
//   if (failed) process.exit(1);
// }

// sync();

throw new Error(
  "create-flw-plans.ts is retired: NewCondo no longer uses Flutterwave payment plans. " +
    "Pricing lives in @newcondo/backend-shared/constants (subscriptionPlans.ts) and is billed " +
    "via tokenized recurring charges. See subscription-plans/BILLING-MODEL.md."
);