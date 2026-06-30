-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('OWNER_ESSENTIAL', 'OWNER_ELITE', 'AGENT_ESSENTIAL', 'AGENT_PREMIUM', 'RENTER_FREE', 'RENTER_PREMIUM_PLUS', 'OWNER_ESSENTIAL_ANNUAL', 'OWNER_ELITE_ANNUAL', 'AGENT_ESSENTIAL_ANNUAL', 'AGENT_PREMIUM_ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'FREE_ACTIVE', 'ACTIVE', 'TRIAL', 'PAST_DUE', 'CANCELLED', 'EXPIRED', 'PAUSED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "SubscriptionEvent" AS ENUM ('CREATED', 'ACTIVATED', 'RENEWED', 'RENEWAL_FAILED', 'RENEWAL_RETRIED', 'UPGRADED', 'DOWNGRADED', 'CANCELLED', 'EXPIRED', 'REACTIVATED', 'PAUSED', 'RESUMED', 'SUSPENDED', 'TRIAL_STARTED', 'TRIAL_ENDED', 'VIRTUAL_ACCOUNT_CREATED', 'PLAN_CHANGED', 'FREE_PLAN_CONVERTED', 'FREE_ACCESS_GRANTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'VOID');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planType" "SubscriptionPlan" NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'MONTHLY',
    "userRole" "Role" NOT NULL,
    "amountNaira" DECIMAL(10,2) NOT NULL,
    "discountPercent" DECIMAL(5,2),
    "finalAmountNaira" DECIMAL(10,2) NOT NULL,
    "flwPlanId" TEXT,
    "flwSubscriptionId" TEXT,
    "flwCustomerToken" TEXT,
    "flwTransactionRef" TEXT,
    "flwCustomerId" TEXT,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "pausedAt" TIMESTAMP(3),
    "pausedUntil" TIMESTAMP(3),
    "propertyListingCap" INTEGER,
    "currentPropertyCount" INTEGER NOT NULL DEFAULT 0,
    "isFoundingAgent" BOOLEAN NOT NULL DEFAULT false,
    "foundingAgentNumber" INTEGER,
    "isFreeRenterPlan" BOOLEAN NOT NULL DEFAULT false,
    "renterPaidPlanUnlockedAt" TIMESTAMP(3),
    "isFoundingMember" BOOLEAN NOT NULL DEFAULT false,
    "foundingMemberNumber" INTEGER,
    "lockedRateNaira" DECIMAL(10,2),
    "canAccessMarkingJobs" BOOLEAN NOT NULL DEFAULT false,
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "nextRenewalAttempt" TIMESTAMP(3),
    "renewalFailureCount" INTEGER NOT NULL DEFAULT 0,
    "lastRenewalAttemptAt" TIMESTAMP(3),
    "virtualAccountCreated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" "SubscriptionEvent" NOT NULL,
    "fromStatus" "SubscriptionStatus",
    "toStatus" "SubscriptionStatus",
    "fromPlan" "SubscriptionPlan",
    "toPlan" "SubscriptionPlan",
    "flwTransactionRef" TEXT,
    "amountCharged" DECIMAL(10,2),
    "paymentStatus" "PaymentStatus",
    "notes" TEXT,
    "triggeredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionInvoice" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "amountNaira" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "flwTransactionRef" TEXT,
    "flwTransactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "nextRetryAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlutterwavePlan" (
    "id" TEXT NOT NULL,
    "planType" "SubscriptionPlan" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "flwPlanId" TEXT NOT NULL,
    "flwPlanCode" TEXT,
    "amountNaira" DECIMAL(10,2) NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "interval" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlutterwavePlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_flwSubscriptionId_key" ON "Subscription"("flwSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_planType_idx" ON "Subscription"("planType");

-- CreateIndex
CREATE INDEX "Subscription_userRole_idx" ON "Subscription"("userRole");

-- CreateIndex
CREATE INDEX "Subscription_currentPeriodEnd_idx" ON "Subscription"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "Subscription_flwSubscriptionId_idx" ON "Subscription"("flwSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_isFoundingAgent_idx" ON "Subscription"("isFoundingAgent");

-- CreateIndex
CREATE INDEX "Subscription_isFoundingMember_idx" ON "Subscription"("isFoundingMember");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_subscriptionId_idx" ON "SubscriptionHistory"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_userId_idx" ON "SubscriptionHistory"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_eventType_idx" ON "SubscriptionHistory"("eventType");

-- CreateIndex
CREATE INDEX "SubscriptionHistory_createdAt_idx" ON "SubscriptionHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionInvoice_invoiceNumber_key" ON "SubscriptionInvoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionInvoice_flwTransactionRef_key" ON "SubscriptionInvoice"("flwTransactionRef");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionInvoice_flwTransactionId_key" ON "SubscriptionInvoice"("flwTransactionId");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_subscriptionId_idx" ON "SubscriptionInvoice"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_userId_idx" ON "SubscriptionInvoice"("userId");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_status_idx" ON "SubscriptionInvoice"("status");

-- CreateIndex
CREATE INDEX "SubscriptionInvoice_createdAt_idx" ON "SubscriptionInvoice"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FlutterwavePlan_planType_key" ON "FlutterwavePlan"("planType");

-- CreateIndex
CREATE UNIQUE INDEX "FlutterwavePlan_flwPlanId_key" ON "FlutterwavePlan"("flwPlanId");

-- CreateIndex
CREATE INDEX "FlutterwavePlan_planType_idx" ON "FlutterwavePlan"("planType");

-- CreateIndex
CREATE INDEX "FlutterwavePlan_flwPlanId_idx" ON "FlutterwavePlan"("flwPlanId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
