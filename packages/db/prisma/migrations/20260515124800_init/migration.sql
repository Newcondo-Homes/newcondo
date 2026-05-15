/*
  Warnings:

  - Added the required column `updatedAt` to the `Referral` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PropertyStructure" AS ENUM ('SINGLE_UNIT', 'MULTI_FAMILY');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'INVESTIGATING', 'RESOLVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DisputeReason" AS ENUM ('PROPERTY_NOT_AS_DESCRIBED', 'PROPERTY_NOT_AVAILABLE', 'UNAUTHORIZED_CHARGES', 'FRAUDULENT_LISTING', 'SAFETY_CONCERNS', 'PRICING_DISCREPANCY', 'OTHER');

-- CreateEnum
CREATE TYPE "PreferredResolution" AS ENUM ('REFUND', 'PARTIAL_REFUND', 'PROPERTY_FIX');

-- CreateEnum
CREATE TYPE "DisputeResolutionOutcome" AS ENUM ('FULL_REFUND', 'PARTIAL_REFUND', 'NO_REFUND', 'PROPERTY_FIX_REQUIRED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PropertyPromotionType" AS ENUM ('PUBLIC', 'PERMISSION_BASED', 'RESTRICTED', 'REQUEST_BASED');

-- CreateEnum
CREATE TYPE "PromotionRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('OWNER_TO_OWNER', 'OWNER_TO_AGENT', 'OWNER_TO_RENTER', 'AGENT_TO_OWNER', 'AGENT_TO_AGENT', 'AGENT_TO_RENTER', 'RENTER_TO_RENTER');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'QUALIFIED', 'REWARDED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('SERVICE_CREDIT', 'SUBSCRIPTION_DISCOUNT', 'RENT_CREDIT', 'COMMISSION_CREDIT', 'MAINTENANCE_VOUCHER', 'CASH_REWARD');

-- CreateEnum
CREATE TYPE "RewardStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "availableUnits" INTEGER,
ADD COLUMN     "buildingFeatures" TEXT[],
ADD COLUMN     "structure" "PropertyStructure" NOT NULL DEFAULT 'SINGLE_UNIT',
ADD COLUMN     "totalUnits" INTEGER,
ALTER COLUMN "price" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "clickCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "qualificationMet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qualifiedAt" TIMESTAMP(3),
ADD COLUMN     "referralType" "ReferralType",
ADD COLUMN     "referredReward" DECIMAL(10,2),
ADD COLUMN     "referredRewardPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referredRewardPaidAt" TIMESTAMP(3),
ADD COLUMN     "referrerReward" DECIMAL(10,2),
ADD COLUMN     "referrerRewardPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "referrerRewardPaidAt" TIMESTAMP(3),
ADD COLUMN     "rewardType" "RewardType" DEFAULT 'SERVICE_CREDIT',
ADD COLUMN     "shareChannel" TEXT,
ADD COLUMN     "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Rental" ADD COLUMN     "unitId" TEXT;

-- CreateTable
CREATE TABLE "PropertyUnit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "floor" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "area" TEXT,
    "features" TEXT[],
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "status" "UnitStatus" NOT NULL DEFAULT 'AVAILABLE',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "availableFrom" TIMESTAMP(3),
    "isPaymentLocked" BOOLEAN NOT NULL DEFAULT false,
    "paymentLockExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentAttemptLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "unitId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "failureReason" TEXT,
    "lockAcquired" BOOLEAN NOT NULL DEFAULT false,
    "lockDuration" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentAttemptLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyUnitImage" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyUnitImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentReferral" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referralLink" TEXT NOT NULL,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    "totalEarnings" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentReferralClick" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrerUrl" TEXT,
    "country" TEXT,
    "city" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentReferralClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentReferralConversion" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentReferralConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralClick" (
    "id" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "referrerId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrerUrl" TEXT,
    "landingPage" TEXT,
    "country" TEXT,
    "city" TEXT,
    "convertedToSignup" BOOLEAN NOT NULL DEFAULT false,
    "convertedUserId" TEXT,
    "convertedAt" TIMESTAMP(3),
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralClick_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralId" TEXT,
    "rewardType" "RewardType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "RewardStatus" NOT NULL DEFAULT 'PENDING',
    "isRedeemed" BOOLEAN NOT NULL DEFAULT false,
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isPaidOut" BOOLEAN NOT NULL DEFAULT false,
    "paidOutAt" TIMESTAMP(3),
    "payoutReference" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralConversion" (
    "id" TEXT NOT NULL,
    "referralId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "commission" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "message" TEXT,
    "status" "PromotionRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "respondedAt" TIMESTAMP(3),
    "respondedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyPromotionSettings" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "promotionType" "PropertyPromotionType" NOT NULL DEFAULT 'RESTRICTED',
    "allowPublicSharing" BOOLEAN NOT NULL DEFAULT false,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "autoApproveAgents" BOOLEAN NOT NULL DEFAULT false,
    "maxSubAgents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyPromotionSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "renterId" TEXT NOT NULL,
    "reason" "DisputeReason" NOT NULL,
    "description" TEXT NOT NULL,
    "preferredResolution" "PreferredResolution" NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'PENDING',
    "resolutionOutcome" "DisputeResolutionOutcome",
    "resolutionNotes" TEXT,
    "refundAmount" DECIMAL(10,2),
    "resolvedAt" TIMESTAMP(3),
    "assignedAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeComment" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" "Role" NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DisputeEvidence" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DisputeEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyUnit_propertyId_idx" ON "PropertyUnit"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyUnit_status_idx" ON "PropertyUnit"("status");

-- CreateIndex
CREATE INDEX "PropertyUnit_isAvailable_idx" ON "PropertyUnit"("isAvailable");

-- CreateIndex
CREATE INDEX "PropertyUnit_price_idx" ON "PropertyUnit"("price");

-- CreateIndex
CREATE INDEX "PropertyUnit_bedrooms_idx" ON "PropertyUnit"("bedrooms");

-- CreateIndex
CREATE INDEX "PropertyUnit_floor_idx" ON "PropertyUnit"("floor");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyUnit_propertyId_unitNumber_key" ON "PropertyUnit"("propertyId", "unitNumber");

-- CreateIndex
CREATE INDEX "PaymentAttemptLog_userId_idx" ON "PaymentAttemptLog"("userId");

-- CreateIndex
CREATE INDEX "PaymentAttemptLog_propertyId_idx" ON "PaymentAttemptLog"("propertyId");

-- CreateIndex
CREATE INDEX "PaymentAttemptLog_status_idx" ON "PaymentAttemptLog"("status");

-- CreateIndex
CREATE INDEX "PaymentAttemptLog_createdAt_idx" ON "PaymentAttemptLog"("createdAt");

-- CreateIndex
CREATE INDEX "PropertyUnitImage_unitId_idx" ON "PropertyUnitImage"("unitId");

-- CreateIndex
CREATE INDEX "PropertyUnitImage_isPrimary_idx" ON "PropertyUnitImage"("isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "AgentReferral_referralCode_key" ON "AgentReferral"("referralCode");

-- CreateIndex
CREATE INDEX "AgentReferral_agentId_idx" ON "AgentReferral"("agentId");

-- CreateIndex
CREATE INDEX "AgentReferral_propertyId_idx" ON "AgentReferral"("propertyId");

-- CreateIndex
CREATE INDEX "AgentReferral_referralCode_idx" ON "AgentReferral"("referralCode");

-- CreateIndex
CREATE INDEX "AgentReferral_isActive_idx" ON "AgentReferral"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "AgentReferral_agentId_propertyId_key" ON "AgentReferral"("agentId", "propertyId");

-- CreateIndex
CREATE INDEX "AgentReferralClick_referralId_idx" ON "AgentReferralClick"("referralId");

-- CreateIndex
CREATE INDEX "AgentReferralClick_createdAt_idx" ON "AgentReferralClick"("createdAt");

-- CreateIndex
CREATE INDEX "AgentReferralClick_ipAddress_idx" ON "AgentReferralClick"("ipAddress");

-- CreateIndex
CREATE UNIQUE INDEX "AgentReferralConversion_paymentId_key" ON "AgentReferralConversion"("paymentId");

-- CreateIndex
CREATE INDEX "AgentReferralConversion_referralId_idx" ON "AgentReferralConversion"("referralId");

-- CreateIndex
CREATE INDEX "AgentReferralConversion_paymentId_idx" ON "AgentReferralConversion"("paymentId");

-- CreateIndex
CREATE INDEX "AgentReferralConversion_createdAt_idx" ON "AgentReferralConversion"("createdAt");

-- CreateIndex
CREATE INDEX "AgentReferralConversion_isPaid_idx" ON "AgentReferralConversion"("isPaid");

-- CreateIndex
CREATE INDEX "ReferralClick_referralCode_idx" ON "ReferralClick"("referralCode");

-- CreateIndex
CREATE INDEX "ReferralClick_referrerId_idx" ON "ReferralClick"("referrerId");

-- CreateIndex
CREATE INDEX "ReferralClick_convertedUserId_idx" ON "ReferralClick"("convertedUserId");

-- CreateIndex
CREATE INDEX "ReferralClick_createdAt_idx" ON "ReferralClick"("createdAt");

-- CreateIndex
CREATE INDEX "ReferralClick_sessionId_idx" ON "ReferralClick"("sessionId");

-- CreateIndex
CREATE INDEX "ReferralClick_ipAddress_idx" ON "ReferralClick"("ipAddress");

-- CreateIndex
CREATE INDEX "ReferralReward_userId_idx" ON "ReferralReward"("userId");

-- CreateIndex
CREATE INDEX "ReferralReward_referralId_idx" ON "ReferralReward"("referralId");

-- CreateIndex
CREATE INDEX "ReferralReward_status_idx" ON "ReferralReward"("status");

-- CreateIndex
CREATE INDEX "ReferralReward_isRedeemed_idx" ON "ReferralReward"("isRedeemed");

-- CreateIndex
CREATE INDEX "ReferralReward_isPaidOut_idx" ON "ReferralReward"("isPaidOut");

-- CreateIndex
CREATE INDEX "ReferralReward_expiresAt_idx" ON "ReferralReward"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralConversion_paymentId_key" ON "ReferralConversion"("paymentId");

-- CreateIndex
CREATE INDEX "ReferralConversion_referralId_idx" ON "ReferralConversion"("referralId");

-- CreateIndex
CREATE INDEX "ReferralConversion_paymentId_idx" ON "ReferralConversion"("paymentId");

-- CreateIndex
CREATE INDEX "ReferralConversion_createdAt_idx" ON "ReferralConversion"("createdAt");

-- CreateIndex
CREATE INDEX "PromotionRequest_agentId_idx" ON "PromotionRequest"("agentId");

-- CreateIndex
CREATE INDEX "PromotionRequest_propertyId_idx" ON "PromotionRequest"("propertyId");

-- CreateIndex
CREATE INDEX "PromotionRequest_ownerId_idx" ON "PromotionRequest"("ownerId");

-- CreateIndex
CREATE INDEX "PromotionRequest_status_idx" ON "PromotionRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionRequest_agentId_propertyId_key" ON "PromotionRequest"("agentId", "propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyPromotionSettings_propertyId_key" ON "PropertyPromotionSettings"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyPromotionSettings_propertyId_idx" ON "PropertyPromotionSettings"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyPromotionSettings_promotionType_idx" ON "PropertyPromotionSettings"("promotionType");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_paymentId_key" ON "Dispute"("paymentId");

-- CreateIndex
CREATE INDEX "Dispute_rentalId_idx" ON "Dispute"("rentalId");

-- CreateIndex
CREATE INDEX "Dispute_paymentId_idx" ON "Dispute"("paymentId");

-- CreateIndex
CREATE INDEX "Dispute_renterId_idx" ON "Dispute"("renterId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "DisputeComment_disputeId_idx" ON "DisputeComment"("disputeId");

-- CreateIndex
CREATE INDEX "DisputeEvidence_disputeId_idx" ON "DisputeEvidence"("disputeId");

-- CreateIndex
CREATE INDEX "Property_structure_idx" ON "Property"("structure");

-- CreateIndex
CREATE INDEX "Property_totalUnits_idx" ON "Property"("totalUnits");

-- CreateIndex
CREATE INDEX "Property_availableUnits_idx" ON "Property"("availableUnits");

-- CreateIndex
CREATE INDEX "Referral_status_idx" ON "Referral"("status");

-- CreateIndex
CREATE INDEX "Referral_qualificationMet_idx" ON "Referral"("qualificationMet");

-- CreateIndex
CREATE INDEX "Referral_referralType_idx" ON "Referral"("referralType");

-- CreateIndex
CREATE INDEX "Rental_unitId_idx" ON "Rental"("unitId");

-- CreateIndex
CREATE INDEX "User_referralCode_idx" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "PropertyUnit" ADD CONSTRAINT "PropertyUnit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttemptLog" ADD CONSTRAINT "PaymentAttemptLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttemptLog" ADD CONSTRAINT "PaymentAttemptLog_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAttemptLog" ADD CONSTRAINT "PaymentAttemptLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PropertyUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyUnitImage" ADD CONSTRAINT "PropertyUnitImage_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PropertyUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rental" ADD CONSTRAINT "Rental_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "PropertyUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReferral" ADD CONSTRAINT "AgentReferral_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReferral" ADD CONSTRAINT "AgentReferral_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReferralClick" ADD CONSTRAINT "AgentReferralClick_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "AgentReferral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReferralConversion" ADD CONSTRAINT "AgentReferralConversion_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "AgentReferral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReferralConversion" ADD CONSTRAINT "AgentReferralConversion_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClick" ADD CONSTRAINT "ReferralClick_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "AgentReferral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralReward" ADD CONSTRAINT "ReferralReward_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "Referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralConversion" ADD CONSTRAINT "ReferralConversion_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "AgentReferral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralConversion" ADD CONSTRAINT "ReferralConversion_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRequest" ADD CONSTRAINT "PromotionRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyPromotionSettings" ADD CONSTRAINT "PropertyPromotionSettings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_rentalId_fkey" FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeComment" ADD CONSTRAINT "DisputeComment_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeComment" ADD CONSTRAINT "DisputeComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DisputeEvidence" ADD CONSTRAINT "DisputeEvidence_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
