/*
  Warnings:

  - You are about to drop the `PendingContactChange` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PendingContactChange" DROP CONSTRAINT "PendingContactChange_userId_fkey";

-- DropTable
DROP TABLE "PendingContactChange";
