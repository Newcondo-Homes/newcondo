import { prisma, SubscriptionPlan, SubscriptionStatus, BillingCycle, Role, SubscriptionEvent } from "@newcondo/db";
import axios from "axios";
import type { Subscription } from "@newcondo/db";
import { sendBrandedEmail, EmailTemplates } from "@newcondo/backend-shared";

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
const APP_URL = process.env.APP_URL!; // e.g. https://newcondo.homes

// ─── Plan config — single source of truth ────────────────────────────────────
// Maps each plan to its constraints and pricing
export const PLAN_CONFIG: Record<
  SubscriptionPlan,
  {
    userRole: Role;
    amountNaira: number;
    billingCycle: BillingCycle;
    propertyListingCap: number | null;
    canAccessMarkingJobs: boolean;
    isFreeRenterPlan: boolean;
    commissionRate: number; // as decimal e.g. 0.15
  }
> = {
  [SubscriptionPlan.OWNER_ESSENTIAL]: {
    userRole: Role.OWNER,
    amountNaira: 7500,
    billingCycle: BillingCycle.MONTHLY,
    propertyListingCap: 2,
    canAccessMarkingJobs: false,
    isFreeRenterPlan: false,
    commissionRate: 0.20,
  },
  [SubscriptionPlan.OWNER_ELITE]: {
    userRole: Role.OWNER,
    amountNaira: 18500,
    billingCycle: BillingCycle.MONTHLY,
    propertyListingCap: null,
    canAccessMarkingJobs: false,
    isFreeRenterPlan: false,
    commissionRate: 0.15,
  },
  [SubscriptionPlan.OWNER_ESSENTIAL_ANNUAL]: {
    userRole: Role.OWNER,
    amountNaira: 75000,
    billingCycle: BillingCycle.ANNUAL,
    propertyListingCap: 2,
    canAccessMarkingJobs: false,
    isFreeRenterPlan: false,
    commissionRate: 0.20,
  },
  [SubscriptionPlan.OWNER_ELITE_ANNUAL]: {
    userRole: Role.OWNER,
    amountNaira: 185000,
    billingCycle: BillingCycle.ANNUAL,
    propertyListingCap: null,
    canAccessMarkingJobs: false,
    isFreeRenterPlan: false,
    commissionRate: 0.15,
  },
  [SubscriptionPlan.AGENT_ESSENTIAL]: {
    userRole: Role.AGENT,
    amountNaira: 2000,
    billingCycle: BillingCycle.MONTHLY,
    propertyListingCap: 5,
    canAccessMarkingJobs: false,
    isFreeRenterPlan: false,
    commissionRate: 0.20,
  },
  [SubscriptionPlan.AGENT_PREMIUM]: {
    userRole: Role.AGENT,
    amountNaira: 3500,
    billingCycle: BillingCycle.MONTHLY,
    propertyListingCap: null,
    canAccessMarkingJobs: true,
    isFreeRenterPlan: false,
    commissionRate: 0.20,
  },
  [SubscriptionPlan.AGENT_ESSENTIAL_ANNUAL]: {
    userRole: Role.AGENT,
    amountNaira: 20000,
    billingCycle: BillingCycle.ANNUAL,
    propertyListingCap: 5,
    canAccessMarkingJobs: false,
    isFreeRenterPlan: false,
    commissionRate: 0.20,
  },
  [SubscriptionPlan.AGENT_PREMIUM_ANNUAL]: {
    userRole: Role.AGENT,
    amountNaira: 35000,
    billingCycle: BillingCycle.ANNUAL,
    propertyListingCap: null,
    canAccessMarkingJobs: true,
    isFreeRenterPlan: false,
    commissionRate: 0.20,
  },
  [SubscriptionPlan.RENTER_FREE]: {
    userRole: Role.RENTER,
    amountNaira: 0,
    billingCycle: BillingCycle.MONTHLY,
    propertyListingCap: null,
    canAccessMarkingJobs: false,
    isFreeRenterPlan: true,
    commissionRate: 0,
  },
  [SubscriptionPlan.RENTER_PREMIUM_PLUS]: {
    userRole: Role.RENTER,
    amountNaira: 0, // Free right now — renterPaidPlanUnlockedAt gates this
    billingCycle: BillingCycle.MONTHLY,
    propertyListingCap: null,
    canAccessMarkingJobs: false, // Activates when paid billing launches
    isFreeRenterPlan: true,
    commissionRate: 0,
  },
};

// ─── Get period end date from start ──────────────────────────────────────────
function getPeriodEnd(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start);
  if (cycle === BillingCycle.MONTHLY) {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}

// ─── Count founding cohort members ───────────────────────────────────────────
async function getNextFoundingNumber(field: "foundingAgentNumber" | "foundingMemberNumber") {
  // Count existing founding members to get the next number
  const count = await prisma.subscription.count({
    where: field === "foundingAgentNumber"
      ? { isFoundingAgent: true }
      : { isFoundingMember: true },
  });
  return count + 1; // e.g. if 47 exist, this person is #48
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. FREE RENTER SIGNUP — called automatically when a new RENTER registers
// ─────────────────────────────────────────────────────────────────────────────
export async function createFreeRenterSubscription(userId: string): Promise<Subscription> {
  // Check if subscription already exists (idempotent)
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing) return existing;

  // Check founding cohort — is this renter within the first 300?
  const foundingCount = await prisma.subscription.count({
    where: { isFoundingMember: true },
  });
  const isFoundingMember = foundingCount < 300;
  const planType = isFoundingMember
    ? SubscriptionPlan.RENTER_PREMIUM_PLUS
    : SubscriptionPlan.RENTER_FREE;

  const foundingMemberNumber = isFoundingMember
    ? await getNextFoundingNumber("foundingMemberNumber")
    : null;

  const now = new Date();

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planType,
      billingCycle: BillingCycle.MONTHLY,
      userRole: Role.RENTER,
      amountNaira: 0,
      finalAmountNaira: 0,
      status: SubscriptionStatus.FREE_ACTIVE,
      isFreeRenterPlan: true,
      currentPeriodStart: now,
      currentPeriodEnd: null, // Free plans never expire
      isFoundingMember,
      foundingMemberNumber,
      lockedRateNaira: isFoundingMember ? 3500 : null,
      canAccessMarkingJobs: false,
      autoRenew: false, // No auto-renewal for free plans
    },
  });

  // Log event
  await prisma.subscriptionHistory.create({
    data: {
      subscriptionId: subscription.id,
      userId,
      eventType: SubscriptionEvent.FREE_ACCESS_GRANTED,
      toStatus: SubscriptionStatus.FREE_ACTIVE,
      toPlan: planType,
      triggeredBy: "system",
      notes: isFoundingMember
        ? `Founding member #${foundingMemberNumber} — Premium Plus locked rate ₦3,500`
        : "Free plan assigned on registration",
    },
  });

 
  const user = await prisma.user.findUnique({
    where: { id: subscription.userId },
    select: { email: true, name: true, role: true },
  });
  if (user?.email) {
    await sendBrandedEmail(
      user.email,
      EmailTemplates.welcome({
        name: user.name ?? "there",
        // ADMIN never reaches this path, but the template's union is narrow —
        // narrow it here rather than casting the check away.
        role: (user.role === "ADMIN" ? "OWNER" : user.role) as "OWNER" | "AGENT" | "RENTER",
      })
    );
  }
  
  // If founding member on Premium Plus — create virtual account
  if (isFoundingMember) {
    await triggerVirtualAccountCreation(userId, subscription.id);
  }

  return subscription;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. INITIATE PAID SUBSCRIPTION — owners and agents only for now
//    Returns a Flutterwave payment link to open in the Inline modal
// ─────────────────────────────────────────────────────────────────────────────
export async function initiateSubscription(
  userId: string,
  planType: SubscriptionPlan
) {
  const config = PLAN_CONFIG[planType];

  // Guard: renters can't initiate paid subscriptions yet
  if (config.isFreeRenterPlan) {
    throw new Error("Renter paid billing is not yet active.");
  }

  // Get user
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true },
  });

  // Role must match plan
  if (user.role !== config.userRole) {
    throw new Error(`Plan ${planType} is not available for ${user.role} accounts.`);
  }

  // Get the Flutterwave plan
  const flwPlan = await prisma.flutterwavePlan.findUniqueOrThrow({
    where: { planType },
  });

  // Check founding agent cohort
  const foundingAgentCount = await prisma.subscription.count({
    where: { isFoundingAgent: true },
  });
  const isFoundingAgent =
    user.role === Role.AGENT &&
    planType === SubscriptionPlan.AGENT_PREMIUM &&
    foundingAgentCount < 100;

  const foundingAgentNumber = isFoundingAgent
    ? await getNextFoundingNumber("foundingAgentNumber")
    : null;

  // Upsert subscription to PENDING — cancel any previous pending attempt
  const existing = await prisma.subscription.findUnique({ where: { userId } });

  const now = new Date();
  const txRef = `NC-SUB-${userId}-${Date.now()}`;

  let subscription;
  if (existing && existing.status === SubscriptionStatus.PENDING) {
    // Update the existing pending record with the new attempt
    subscription = await prisma.subscription.update({
      where: { userId },
      data: {
        planType,
        billingCycle: config.billingCycle,
        userRole: config.userRole,
        amountNaira: config.amountNaira,
        finalAmountNaira: config.amountNaira,
        propertyListingCap: config.propertyListingCap,
        canAccessMarkingJobs: config.canAccessMarkingJobs,
        flwPlanId: flwPlan.flwPlanId,
        isFoundingAgent,
        foundingAgentNumber,
        flwTransactionRef: txRef,
      },
    });
  } else if (!existing) {
    subscription = await prisma.subscription.create({
      data: {
        userId,
        planType,
        billingCycle: config.billingCycle,
        userRole: config.userRole,
        amountNaira: config.amountNaira,
        finalAmountNaira: config.amountNaira,
        status: SubscriptionStatus.PENDING,
        isFreeRenterPlan: false,
        propertyListingCap: config.propertyListingCap,
        canAccessMarkingJobs: config.canAccessMarkingJobs,
        flwPlanId: flwPlan.flwPlanId,
        isFoundingAgent,
        foundingAgentNumber,
        currentPeriodStart: now,
        currentPeriodEnd: getPeriodEnd(now, config.billingCycle),
        autoRenew: true,
        flwTransactionRef: txRef,
      },
    });
  } else {
    // Existing subscription that's ACTIVE — this is an upgrade/downgrade
    // For now treat as a new initiation (extend this logic for upgrade flows)
    subscription = existing;
  }

  // Build Flutterwave payment payload
  // We use the payment plan ID so Flutterwave handles recurring billing
  const flwPayload = {
    tx_ref: txRef,
    amount: config.amountNaira,
    currency: "NGN",
    payment_options: "card",
    payment_plan: flwPlan.flwPlanId, // This is what enables recurring billing
    customer: {
      email: user.email,
      name: user.name || user.email,
      phonenumber: user.phone || "",
    },
    meta: {
      userId,
      subscriptionId: subscription.id,
      planType,
    },
    customizations: {
      title: "NewCondo Subscription",
      description: `${flwPlan.name}`,
      logo: `${APP_URL}/images/logos/newcondo-logo.png`,
    },
    redirect_url: `${APP_URL}/dashboard/subscription/callback`,
  };

  return {
    txRef,
    subscriptionId: subscription.id,
    flwPayload, // Returned to frontend to pass into Inline modal
    planName: flwPlan.name,
    amountNaira: config.amountNaira,
    isFoundingAgent,
    foundingAgentNumber,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ACTIVATE SUBSCRIPTION — called by webhook after successful payment
// ─────────────────────────────────────────────────────────────────────────────
export interface SavedCardMeta {
  last4?: string;
  brand?: string;
  expiry?: string;
}

export async function activateSubscription(
  txRef: string,
  flwTransactionId: string,
  flwSubscriptionId: string,
  flwCustomerToken: string,
  flwCustomerId: string,
  card?: SavedCardMeta,
): Promise<Subscription> {
  const subscription = await prisma.subscription.findFirst({
    where: { flwTransactionRef: txRef },
  });

  if (!subscription) {
    throw new Error(`No subscription found for tx_ref: ${txRef}`);
  }

  if (subscription.status === SubscriptionStatus.ACTIVE) {
    // Already activated (duplicate webhook) — ignore safely
    return subscription;
  }

  const now = new Date();
  const periodEnd = getPeriodEnd(now, subscription.billingCycle);

  const updated = await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      flwSubscriptionId,
      flwCustomerToken,
      flwCustomerId,
      flwTransactionRef: txRef,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextRenewalAttempt: periodEnd,
      ...(card?.last4 ? { cardLast4: card.last4 } : {}),
      ...(card?.brand ? { cardBrand: card.brand } : {}),
      ...(card?.expiry ? { cardExpiry: card.expiry } : {}),
    },
  });

  // Log activation
  await prisma.subscriptionHistory.create({
    data: {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      eventType: SubscriptionEvent.ACTIVATED,
      fromStatus: SubscriptionStatus.PENDING,
      toStatus: SubscriptionStatus.ACTIVE,
      flwTransactionRef: txRef,
      amountCharged: subscription.finalAmountNaira,
      triggeredBy: "system",
      notes: `Flutterwave subscription activated. ID: ${flwSubscriptionId}`,
    },
  });

  // Create invoice record
  const invoiceNumber = `NC-INV-${Date.now()}`;
  await prisma.subscriptionInvoice.create({
    data: {
      subscriptionId: subscription.id,
      userId: subscription.userId,
      invoiceNumber,
      periodStart: now,
      periodEnd,
      amountNaira: subscription.finalAmountNaira,
      status: "PAID",
      flwTransactionRef: txRef,
      flwTransactionId,
      paidAt: now,
    },
  });

  // Update User.isPremium
  await prisma.user.update({
    where: { id: subscription.userId },
    data: {
      isPremium: true,
      premiumExpiresAt: periodEnd,
    },
  });


  // Fetched rather than passed in so this works from both the first-charge
  // path and the webhook path without changing either signature.
  const user = await prisma.user.findUnique({
    where: { id: subscription.userId },
    select: { email: true, name: true, role: true },
  });
  if (user?.email) {
    await sendBrandedEmail(
      user.email,
      EmailTemplates.welcome({
        name: user.name ?? "there",
        // ADMIN never reaches this path, but the template's union is narrow —
        // narrow it here rather than casting the check away.
        role: (user.role === "ADMIN" ? "OWNER" : user.role) as "OWNER" | "AGENT" | "RENTER",
      })
    );
  }

  // Trigger virtual account if needed
  if (!subscription.virtualAccountCreated) {
    await triggerVirtualAccountCreation(subscription.userId, subscription.id);
  }

  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. VIRTUAL ACCOUNT TRIGGER
// ─────────────────────────────────────────────────────────────────────────────
async function triggerVirtualAccountCreation(userId: string, subscriptionId: string) {
  // Check if virtual account already exists
  const existingVA = await prisma.virtualAccount.findFirst({ where: { userId } });
  if (existingVA) return;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, email: true },
  });

  try {
    // Call Flutterwave to create a virtual account
    const response = await axios.post(
      "https://api.flutterwave.com/v3/virtual-account-numbers",
      {
        email: user.email,
        is_permanent: true,
        bvn: "00000000000", // NOTE: In production, you'll collect real BVN
        tx_ref: `NC-VA-${userId}-${Date.now()}`,
        phonenumber: "08000000000", // Replace with user.phone in production
        firstname: user.name?.split(" ")[0] || "NewCondo",
        lastname: user.name?.split(" ")[1] || "User",
        narration: `NewCondo - ${user.name}`,
      },
      { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
    );

    const va = response.data.data;

    await prisma.virtualAccount.create({
      data: {
        userId,
        accountNumber: va.account_number,
        accountName: va.account_name,
        bankCode: va.bank_name,
        flutterwaveAccountId: va.order_ref,
        balance: 0,
        isActive: true,
      },
    });

    // Mark VA as created on subscription
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { virtualAccountCreated: true },
    });

    // Log event
    await prisma.subscriptionHistory.create({
      data: {
        subscriptionId,
        userId,
        eventType: SubscriptionEvent.VIRTUAL_ACCOUNT_CREATED,
        triggeredBy: "system",
        notes: `Virtual account created: ${va.account_number}`,
      },
    });
  } catch (err: any) {
    console.error("Virtual account creation failed:", err.response?.data || err.message);
    // Non-fatal — log but don't throw. Can be retried.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. VERIFY FLUTTERWAVE PAYMENT — called by webhook handler to verify tx
// ─────────────────────────────────────────────────────────────────────────────
export async function verifyFlutterwaveTransaction(transactionId: string) {
  const response = await axios.get(
    `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
    { headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}` } }
  );
  return response.data.data;
}