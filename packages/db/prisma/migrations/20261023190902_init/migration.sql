-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'OPERATIONS', 'VERIFICATION', 'FINANCE', 'SUPPORT');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'FROZEN');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AdminActionType" ADD VALUE 'STAFF_INVITED';
ALTER TYPE "AdminActionType" ADD VALUE 'STAFF_INVITE_REVOKED';
ALTER TYPE "AdminActionType" ADD VALUE 'STAFF_ACTIVATED';
ALTER TYPE "AdminActionType" ADD VALUE 'STAFF_FROZEN';
ALTER TYPE "AdminActionType" ADD VALUE 'STAFF_UNFROZEN';
ALTER TYPE "AdminActionType" ADD VALUE 'STAFF_SCOPES_CHANGED';
ALTER TYPE "AdminActionType" ADD VALUE 'IMPERSONATION_STARTED';
ALTER TYPE "AdminActionType" ADD VALUE 'IMPERSONATION_ENDED';
ALTER TYPE "AdminActionType" ADD VALUE 'IMPERSONATED_ACTION';
ALTER TYPE "AdminActionType" ADD VALUE 'USER_UPDATED';
ALTER TYPE "AdminActionType" ADD VALUE 'USER_SUSPENDED';
ALTER TYPE "AdminActionType" ADD VALUE 'USER_RESTORED';
ALTER TYPE "AdminActionType" ADD VALUE 'SESSIONS_REVOKED';
ALTER TYPE "AdminActionType" ADD VALUE 'VERIFICATION_REVOKED';
ALTER TYPE "AdminActionType" ADD VALUE 'LISTING_HIDDEN';
ALTER TYPE "AdminActionType" ADD VALUE 'LISTING_PUBLISHED';
ALTER TYPE "AdminActionType" ADD VALUE 'MARKING_ASSIGNED';
ALTER TYPE "AdminActionType" ADD VALUE 'MARKING_QUEUE_ROTATED';
ALTER TYPE "AdminActionType" ADD VALUE 'MARKING_REMARK_ALLOWED';
ALTER TYPE "AdminActionType" ADD VALUE 'MARKING_DISPUTE_RESOLVED';
ALTER TYPE "AdminActionType" ADD VALUE 'VENDOR_APPROVED';
ALTER TYPE "AdminActionType" ADD VALUE 'VENDOR_SUSPENDED';
ALTER TYPE "AdminActionType" ADD VALUE 'VENDOR_PROPERTY_ASSIGNED';
ALTER TYPE "AdminActionType" ADD VALUE 'VENDOR_PROPERTY_REMOVED';
ALTER TYPE "AdminActionType" ADD VALUE 'VISIT_REBOOKED';
ALTER TYPE "AdminActionType" ADD VALUE 'VISIT_ISSUE_RESOLVED';
ALTER TYPE "AdminActionType" ADD VALUE 'RENT_RELEASED';
ALTER TYPE "AdminActionType" ADD VALUE 'DISPUTE_RESOLVED';
ALTER TYPE "AdminActionType" ADD VALUE 'REFERRAL_HOLD_CLEARED';
ALTER TYPE "AdminActionType" ADD VALUE 'REFERRAL_VOIDED';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "adminHiddenAt" TIMESTAMP(3),
ADD COLUMN     "adminHiddenBy" TEXT,
ADD COLUMN     "adminHiddenReason" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isFieldMarker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sessionsRevokedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedReason" TEXT;

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "adminRole" "AdminRole" NOT NULL,
    "grantedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "revokedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "invitedById" TEXT,
    "frozenAt" TIMESTAMP(3),
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "adminRole" "AdminRole" NOT NULL,
    "grantedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "revokedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImpersonationSession" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "ipHash" TEXT,

    CONSTRAINT "ImpersonationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deviceKey" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "city" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeDays" INTEGER NOT NULL DEFAULT 1,
    "lastDay" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "UserDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffMember_userId_key" ON "StaffMember"("userId");

-- CreateIndex
CREATE INDEX "StaffMember_status_idx" ON "StaffMember"("status");

-- CreateIndex
CREATE INDEX "StaffMember_adminRole_idx" ON "StaffMember"("adminRole");

-- CreateIndex
CREATE UNIQUE INDEX "StaffInvite_tokenHash_key" ON "StaffInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "StaffInvite_email_idx" ON "StaffInvite"("email");

-- CreateIndex
CREATE INDEX "StaffInvite_expiresAt_idx" ON "StaffInvite"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ImpersonationSession_tokenHash_key" ON "ImpersonationSession"("tokenHash");

-- CreateIndex
CREATE INDEX "ImpersonationSession_staffId_endedAt_idx" ON "ImpersonationSession"("staffId", "endedAt");

-- CreateIndex
CREATE INDEX "ImpersonationSession_targetUserId_idx" ON "ImpersonationSession"("targetUserId");

-- CreateIndex
CREATE INDEX "UserDevice_userId_lastSeenAt_idx" ON "UserDevice"("userId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserDevice_userId_deviceKey_key" ON "UserDevice"("userId", "deviceKey");

-- CreateIndex
CREATE INDEX "Property_adminHiddenAt_idx" ON "Property"("adminHiddenAt");

-- CreateIndex
CREATE INDEX "User_suspendedAt_idx" ON "User"("suspendedAt");

-- AddForeignKey
ALTER TABLE "StaffMember" ADD CONSTRAINT "StaffMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "StaffMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImpersonationSession" ADD CONSTRAINT "ImpersonationSession_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDevice" ADD CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
