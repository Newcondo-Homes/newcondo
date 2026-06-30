// ============================================================================
// FILE: backend/scripts/create-flw-plans.ts
// PURPOSE: Run ONCE to create payment plans in Flutterwave and store their
//          IDs in your FlutterwavePlan table.
// RUN:  npx ts-node backend/scripts/create-flw-plans.ts
// ============================================================================


import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { prisma, SubscriptionPlan, BillingCycle } from "@newcondo/db";

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;

if (!FLUTTERWAVE_SECRET_KEY) {
  console.error("❌ FLUTTERWAVE_SECRET_KEY is not set in environment");
  process.exit(1);
}

// Renters are FREE right now — only create plans for owners and agents.
// Add renter plans here when paid billing launches.
const PLANS_TO_CREATE: Array<{
  planType: SubscriptionPlan;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  interval: string;
}> = [
  {
    planType: SubscriptionPlan.OWNER_ESSENTIAL,
    name: "NewCondo Owner Essential",
    amount: 7500,
    billingCycle: BillingCycle.MONTHLY,
    interval: "monthly",
  },
  {
    planType: SubscriptionPlan.OWNER_ELITE,
    name: "NewCondo Owner Elite",
    amount: 18500,
    billingCycle: BillingCycle.MONTHLY,
    interval: "monthly",
  },
  {
    planType: SubscriptionPlan.OWNER_ESSENTIAL_ANNUAL,
    name: "NewCondo Owner Essential Annual",
    amount: 75000, // 10 months (2 months free)
    billingCycle: BillingCycle.ANNUAL,
    interval: "yearly",
  },
  {
    planType: SubscriptionPlan.OWNER_ELITE_ANNUAL,
    name: "NewCondo Owner Elite Annual",
    amount: 185000,
    billingCycle: BillingCycle.ANNUAL,
    interval: "yearly",
  },
  {
    planType: SubscriptionPlan.AGENT_ESSENTIAL,
    name: "NewCondo Agent Essential",
    amount: 2000,
    billingCycle: BillingCycle.MONTHLY,
    interval: "monthly",
  },
  {
    planType: SubscriptionPlan.AGENT_PREMIUM,
    name: "NewCondo Agent Premium",
    amount: 3500,
    billingCycle: BillingCycle.MONTHLY,
    interval: "monthly",
  },
  {
    planType: SubscriptionPlan.AGENT_ESSENTIAL_ANNUAL,
    name: "NewCondo Agent Essential Annual",
    amount: 20000,
    billingCycle: BillingCycle.ANNUAL,
    interval: "yearly",
  },
  {
    planType: SubscriptionPlan.AGENT_PREMIUM_ANNUAL,
    name: "NewCondo Agent Premium Annual",
    amount: 35000,
    billingCycle: BillingCycle.ANNUAL,
    interval: "yearly",
  },
];

async function createPlans() {
  console.log("🚀 Creating Flutterwave payment plans...\n");

  for (const plan of PLANS_TO_CREATE) {
    try {
      // Idempotent — skip if already created
      const existing = await prisma.flutterwavePlan.findUnique({
        where: { planType: plan.planType },
      });

      if (existing) {
        console.log(`⏭  ${plan.name} — already exists (FLW ID: ${existing.flwPlanId})`);
        continue;
      }

      const response = await axios.post(
        "https://api.flutterwave.com/v3/payment-plans",
        {
          amount: plan.amount,
          name: plan.name,
          interval: plan.interval,
          duration: 0, // 0 = recurring indefinitely
          currency: "NGN",
        },
        {
          headers: {
            Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const flwPlan = response.data.data;

      await prisma.flutterwavePlan.create({
        data: {
          planType: plan.planType,
          name: plan.name,
          flwPlanId: String(flwPlan.id),
          flwPlanCode: flwPlan.plan_token ?? null,
          amountNaira: plan.amount,
          billingCycle: plan.billingCycle,
          interval: plan.interval,
          isActive: true,
        },
      });

      console.log(`✅  ${plan.name} — created (FLW ID: ${flwPlan.id})`);
    } catch (err: any) {
      console.error(
        `❌  ${plan.name} — failed:`,
        err.response?.data ?? err.message
      );
    }
  }

  console.log("\n✅ Done.");
  await prisma.$disconnect();
}

createPlans();