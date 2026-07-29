-- CreateEnum
CREATE TYPE "MarkingMethod" AS ENUM ('SELF', 'KNOWN_PERSON', 'BROADCAST', 'NEWCONDO');

-- AlterEnum
ALTER TYPE "DisputeReason" ADD VALUE 'SERVICE_NOT_DELIVERED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MarkingJobStatus" ADD VALUE 'AWAITING_CONFIRMATION';
ALTER TYPE "MarkingJobStatus" ADD VALUE 'DISPUTED';

-- AlterEnum
ALTER TYPE "OTPType" ADD VALUE 'BANK_ACCOUNT_CHANGE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PaymentType" ADD VALUE 'RENT_RELEASE';
ALTER TYPE "PaymentType" ADD VALUE 'WITHDRAWAL';
ALTER TYPE "PaymentType" ADD VALUE 'SERVICE_FEE';

-- AlterEnum
ALTER TYPE "UnitStatus" ADD VALUE 'UNDER_CONSTRUCTION';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "commissionSettledAt" TIMESTAMP(3),
ADD COLUMN     "meta" JSONB,
ADD COLUMN     "receiptKey" TEXT,
ADD COLUMN     "subAgentId" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "boundaryMaskImageKey" TEXT;

-- AlterTable
ALTER TABLE "PropertyMarkingJob" ADD COLUMN     "confirmDeadline" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "disputeReason" TEXT,
ADD COLUMN     "maskImageKey" TEXT,
ADD COLUMN     "method" "MarkingMethod" NOT NULL DEFAULT 'BROADCAST',
ADD COLUMN     "snapshotImageKey" TEXT;

-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "invitedById" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoPayoutMode" TEXT NOT NULL DEFAULT 'OFF',
ADD COLUMN     "bvn" TEXT;

-- CreateTable
CREATE TABLE "MarkingQueueEntry" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "slotStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "abandonedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarkingQueueEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformRevenue" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "code" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "TenantInvite" (
    "tokenHash" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "inviterId" TEXT NOT NULL,
    "renterId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantInvite_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "AgentInvite" (
    "tokenHash" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "agentEmail" TEXT,
    "agentId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentInvite_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateTable
CREATE TABLE "OwnerAgentLink" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerAgentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pricePerQuarter" DECIMAL(10,2) NOT NULL,
    "entitlements" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceSubscription" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "renewsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceJob" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "vendorId" TEXT,
    "requestedById" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "scheduledFor" TIMESTAMP(3),
    "notes" TEXT,
    "issueReason" TEXT,
    "reportNote" TEXT,
    "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "photoKeys" TEXT[],
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarkingQueueEntry_jobId_position_idx" ON "MarkingQueueEntry"("jobId", "position");

-- CreateIndex
CREATE INDEX "MarkingQueueEntry_agentId_idx" ON "MarkingQueueEntry"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "MarkingQueueEntry_jobId_agentId_key" ON "MarkingQueueEntry"("jobId", "agentId");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformRevenue_paymentId_key" ON "PlatformRevenue"("paymentId");

-- CreateIndex
CREATE INDEX "PlatformRevenue_source_createdAt_idx" ON "PlatformRevenue"("source", "createdAt");

-- CreateIndex
CREATE INDEX "BankAccount_userId_idx" ON "BankAccount"("userId");

-- CreateIndex
CREATE INDEX "BankAccount_isDefault_idx" ON "BankAccount"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_userId_accountNumber_key" ON "BankAccount"("userId", "accountNumber");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "ShareLink_creatorId_idx" ON "ShareLink"("creatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_propertyId_creatorId_kind_key" ON "ShareLink"("propertyId", "creatorId", "kind");

-- CreateIndex
CREATE INDEX "TenantInvite_propertyId_idx" ON "TenantInvite"("propertyId");

-- CreateIndex
CREATE INDEX "TenantInvite_inviterId_idx" ON "TenantInvite"("inviterId");

-- CreateIndex
CREATE INDEX "TenantInvite_expiresAt_idx" ON "TenantInvite"("expiresAt");

-- CreateIndex
CREATE INDEX "AgentInvite_ownerId_idx" ON "AgentInvite"("ownerId");

-- CreateIndex
CREATE INDEX "OwnerAgentLink_agentId_status_idx" ON "OwnerAgentLink"("agentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerAgentLink_ownerId_agentId_key" ON "OwnerAgentLink"("ownerId", "agentId");

-- CreateIndex
CREATE INDEX "Vendor_category_isActive_idx" ON "Vendor"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ServicePlan_name_key" ON "ServicePlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSubscription_ownerId_key" ON "ServiceSubscription"("ownerId");

-- CreateIndex
CREATE INDEX "ServiceSubscription_status_idx" ON "ServiceSubscription"("status");

-- CreateIndex
CREATE INDEX "ServiceJob_propertyId_status_idx" ON "ServiceJob"("propertyId", "status");

-- CreateIndex
CREATE INDEX "ServiceJob_vendorId_idx" ON "ServiceJob"("vendorId");

-- CreateIndex
CREATE INDEX "ServiceJob_scheduledFor_idx" ON "ServiceJob"("scheduledFor");

-- CreateIndex
CREATE INDEX "Payment_subAgentId_idx" ON "Payment"("subAgentId");

-- CreateIndex
CREATE INDEX "Rental_invitedById_idx" ON "Rental"("invitedById");

-- AddForeignKey
ALTER TABLE "MarkingQueueEntry" ADD CONSTRAINT "MarkingQueueEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "PropertyMarkingJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkingQueueEntry" ADD CONSTRAINT "MarkingQueueEntry_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subAgentId_fkey" FOREIGN KEY ("subAgentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformRevenue" ADD CONSTRAINT "PlatformRevenue_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankAccount" ADD CONSTRAINT "BankAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PropertyUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentInvite" ADD CONSTRAINT "AgentInvite_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerAgentLink" ADD CONSTRAINT "OwnerAgentLink_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerAgentLink" ADD CONSTRAINT "OwnerAgentLink_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSubscription" ADD CONSTRAINT "ServiceSubscription_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceSubscription" ADD CONSTRAINT "ServiceSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ServicePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
