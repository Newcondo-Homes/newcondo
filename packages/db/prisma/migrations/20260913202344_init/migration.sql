-- CreateEnum
CREATE TYPE "AccountDeletionStatus" AS ENUM ('PENDING', 'CANCELLED', 'ANONYMIZED', 'PURGED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AccountDeletionSource" AS ENUM ('IN_APP', 'EMAIL', 'META_CALLBACK', 'ADMIN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminActionType" ADD VALUE 'ACCOUNT_DELETION_BLOCKED';
ALTER TYPE "AdminActionType" ADD VALUE 'ACCOUNT_ANONYMIZED';

-- AlterEnum
ALTER TYPE "SubscriptionEvent" ADD VALUE 'ACCOUNT_DELETED';

-- DropForeignKey
ALTER TABLE "AgentReferral" DROP CONSTRAINT "AgentReferral_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "MarkingQueueEntry" DROP CONSTRAINT "MarkingQueueEntry_agentId_fkey";

-- DropForeignKey
ALTER TABLE "OwnerAgentLink" DROP CONSTRAINT "OwnerAgentLink_agentId_fkey";

-- DropForeignKey
ALTER TABLE "OwnerAgentLink" DROP CONSTRAINT "OwnerAgentLink_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionRequest" DROP CONSTRAINT "PromotionRequest_agentId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionRequest" DROP CONSTRAINT "PromotionRequest_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "PromotionRequest" DROP CONSTRAINT "PromotionRequest_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "PropertyDuplicate" DROP CONSTRAINT "PropertyDuplicate_originalPropertyId_fkey";

-- DropForeignKey
ALTER TABLE "ShareLink" DROP CONSTRAINT "ShareLink_creatorId_fkey";

-- DropForeignKey
ALTER TABLE "SubscriptionInvoice" DROP CONSTRAINT "SubscriptionInvoice_userId_fkey";

-- DropForeignKey
ALTER TABLE "TenantInvite" DROP CONSTRAINT "TenantInvite_inviterId_fkey";

-- AlterTable
ALTER TABLE "SubscriptionInvoice" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "anonymizedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "purgeAfter" TIMESTAMP(3),
ADD COLUMN     "purgedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AccountDeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleAtRequest" "Role" NOT NULL,
    "status" "AccountDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "source" "AccountDeletionSource" NOT NULL DEFAULT 'IN_APP',
    "confirmationCode" TEXT NOT NULL,
    "reason" TEXT,
    "reasonNote" TEXT,
    "snapshot" JSONB,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anonymizeAfter" TIMESTAMP(3) NOT NULL,
    "anonymizedAt" TIMESTAMP(3),
    "purgeAfter" TIMESTAMP(3),
    "purgedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelledBy" TEXT,
    "documentsDeleted" INTEGER NOT NULL DEFAULT 0,
    "s3ObjectsDeleted" INTEGER NOT NULL DEFAULT 0,
    "photosDeleted" INTEGER NOT NULL DEFAULT 0,
    "propertiesClosed" INTEGER NOT NULL DEFAULT 0,
    "blockedReason" TEXT,
    "requestIp" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AccountDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountDeletionRequest_confirmationCode_key" ON "AccountDeletionRequest"("confirmationCode");

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_userId_idx" ON "AccountDeletionRequest"("userId");

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_status_idx" ON "AccountDeletionRequest"("status");

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_anonymizeAfter_idx" ON "AccountDeletionRequest"("anonymizeAfter");

-- CreateIndex
CREATE INDEX "AccountDeletionRequest_purgeAfter_idx" ON "AccountDeletionRequest"("purgeAfter");

-- CreateIndex
CREATE INDEX "AgentInvite_agentId_idx" ON "AgentInvite"("agentId");

-- CreateIndex
CREATE INDEX "DisputeComment_authorId_idx" ON "DisputeComment"("authorId");

-- CreateIndex
CREATE INDEX "DisputeEvidence_uploadedBy_idx" ON "DisputeEvidence"("uploadedBy");

-- CreateIndex
CREATE INDEX "Payment_subAgentId_commissionSettledAt_idx" ON "Payment"("subAgentId", "commissionSettledAt");

-- CreateIndex
CREATE INDEX "ServiceJob_requestedById_idx" ON "ServiceJob"("requestedById");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "User_anonymizedAt_idx" ON "User"("anonymizedAt");

-- CreateIndex
CREATE INDEX "User_purgeAfter_idx" ON "User"("purgeAfter");

-- CreateIndex
CREATE INDEX "User_role_deletedAt_idx" ON "User"("role", "deletedAt");

-- AddForeignKey
ALTER TABLE "AccountDeletionRequest" ADD CONSTRAINT "AccountDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyDuplicate" ADD CONSTRAINT "PropertyDuplicate_originalPropertyId_fkey" FOREIGN KEY ("originalPropertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarkingQueueEntry" ADD CONSTRAINT "MarkingQueueEntry_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerAgentLink" ADD CONSTRAINT "OwnerAgentLink_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerAgentLink" ADD CONSTRAINT "OwnerAgentLink_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReferral" ADD CONSTRAINT "AgentReferral_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionInvoice" ADD CONSTRAINT "SubscriptionInvoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
