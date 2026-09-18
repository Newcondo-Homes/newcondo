-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "suspendedBySubscription" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "gracePeriodEndsAt" TIMESTAMP(3),
ADD COLUMN     "listingsSuspendedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Property_suspendedBySubscription_idx" ON "Property"("suspendedBySubscription");
