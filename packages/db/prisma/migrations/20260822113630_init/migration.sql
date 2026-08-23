/*
  Warnings:

  - A unique constraint covering the columns `[userId,documentType,documentSide,pageNumber,propertyId]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Document_userId_documentType_documentSide_pageNumber_key";

-- CreateTable
CREATE TABLE "PendingContactChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingContactChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PendingContactChange_userId_key" ON "PendingContactChange"("userId");

-- CreateIndex
CREATE INDEX "PendingContactChange_expiresAt_idx" ON "PendingContactChange"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Document_userId_documentType_documentSide_pageNumber_proper_key" ON "Document"("userId", "documentType", "documentSide", "pageNumber", "propertyId");

-- AddForeignKey
ALTER TABLE "PendingContactChange" ADD CONSTRAINT "PendingContactChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
