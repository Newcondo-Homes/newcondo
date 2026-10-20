/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Vendor` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "LedgerAccountKind" ADD VALUE 'SERVICE_FUND';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LedgerTxnType" ADD VALUE 'SERVICE_FUND_ACCRUED';
ALTER TYPE "LedgerTxnType" ADD VALUE 'SERVICE_FUND_RETURNED';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'VENDOR';

-- AlterTable
ALTER TABLE "ServiceJob" ADD COLUMN     "assignmentId" TEXT,
ADD COLUMN     "codeAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payoutBatchId" TEXT,
ADD COLUMN     "planType" "SubscriptionPlan",
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedById" TEXT,
ADD COLUMN     "verifiedVia" TEXT,
ADD COLUMN     "windowEnd" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vendor" ADD COLUMN     "bankVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "cacNumber" TEXT,
ADD COLUMN     "capacityPerDay" INTEGER NOT NULL DEFAULT 4,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'COMPANY',
ADD COLUMN     "maxClients" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "providerType" TEXT NOT NULL DEFAULT 'FUMIGATION_COMPANY',
ADD COLUMN     "releaseMode" TEXT NOT NULL DEFAULT 'INSTANT',
ADD COLUMN     "services" TEXT[],
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VendorServiceArea" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "radiusKm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorAssignment" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "planType" "SubscriptionPlan" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "activeKey" TEXT,
    "distanceKm" DOUBLE PRECISION,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pausedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "endReason" TEXT,

    CONSTRAINT "VendorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyServiceWindow" (
    "propertyId" TEXT NOT NULL,
    "days" INTEGER[],
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "updatedById" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyServiceWindow_pkey" PRIMARY KEY ("propertyId")
);

-- CreateTable
CREATE TABLE "ServiceVisitCode" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "generatedById" TEXT NOT NULL,
    "generatedRole" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceVisitCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceReminderCall" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "dayOffset" INTEGER NOT NULL,
    "contactRole" TEXT NOT NULL,
    "userId" TEXT,
    "phoneE164" TEXT NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'RINGING',
    "provider" TEXT NOT NULL,
    "providerCallId" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceReminderCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorPayoutBatch" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amountKobo" BIGINT NOT NULL,
    "jobCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "VendorPayoutBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorServiceArea_vendorId_idx" ON "VendorServiceArea"("vendorId");

-- CreateIndex
CREATE INDEX "VendorServiceArea_state_lga_idx" ON "VendorServiceArea"("state", "lga");

-- CreateIndex
CREATE UNIQUE INDEX "VendorAssignment_activeKey_key" ON "VendorAssignment"("activeKey");

-- CreateIndex
CREATE INDEX "VendorAssignment_vendorId_status_idx" ON "VendorAssignment"("vendorId", "status");

-- CreateIndex
CREATE INDEX "VendorAssignment_ownerId_serviceType_status_idx" ON "VendorAssignment"("ownerId", "serviceType", "status");

-- CreateIndex
CREATE INDEX "VendorAssignment_propertyId_idx" ON "VendorAssignment"("propertyId");

-- CreateIndex
CREATE INDEX "ServiceVisitCode_jobId_usedAt_idx" ON "ServiceVisitCode"("jobId", "usedAt");

-- CreateIndex
CREATE INDEX "ServiceVisitCode_generatedById_idx" ON "ServiceVisitCode"("generatedById");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceReminderCall_providerCallId_key" ON "ServiceReminderCall"("providerCallId");

-- CreateIndex
CREATE INDEX "ServiceReminderCall_jobId_dayOffset_idx" ON "ServiceReminderCall"("jobId", "dayOffset");

-- CreateIndex
CREATE UNIQUE INDEX "VendorPayoutBatch_reference_key" ON "VendorPayoutBatch"("reference");

-- CreateIndex
CREATE INDEX "VendorPayoutBatch_vendorId_createdAt_idx" ON "VendorPayoutBatch"("vendorId", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceJob_assignmentId_status_idx" ON "ServiceJob"("assignmentId", "status");

-- CreateIndex
CREATE INDEX "ServiceJob_vendorId_scheduledFor_idx" ON "ServiceJob"("vendorId", "scheduledFor");

-- CreateIndex
CREATE INDEX "ServiceJob_payoutBatchId_idx" ON "ServiceJob"("payoutBatchId");

-- CreateIndex
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");

-- CreateIndex
CREATE INDEX "Vendor_status_isActive_idx" ON "Vendor"("status", "isActive");

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "VendorAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceJob" ADD CONSTRAINT "ServiceJob_payoutBatchId_fkey" FOREIGN KEY ("payoutBatchId") REFERENCES "VendorPayoutBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorServiceArea" ADD CONSTRAINT "VendorServiceArea_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssignment" ADD CONSTRAINT "VendorAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAssignment" ADD CONSTRAINT "VendorAssignment_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyServiceWindow" ADD CONSTRAINT "PropertyServiceWindow_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVisitCode" ADD CONSTRAINT "ServiceVisitCode_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceVisitCode" ADD CONSTRAINT "ServiceVisitCode_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceReminderCall" ADD CONSTRAINT "ServiceReminderCall_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ServiceJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorPayoutBatch" ADD CONSTRAINT "VendorPayoutBatch_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
