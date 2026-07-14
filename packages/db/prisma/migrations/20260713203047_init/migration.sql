-- DropForeignKey
ALTER TABLE "SubscriptionHistory" DROP CONSTRAINT "SubscriptionHistory_userId_fkey";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "s3Key" TEXT;

-- AddForeignKey
ALTER TABLE "SubscriptionHistory" ADD CONSTRAINT "SubscriptionHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
