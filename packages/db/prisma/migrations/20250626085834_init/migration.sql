/*
  Warnings:

  - A unique constraint covering the columns `[identifier,type]` on the table `OTPCode` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "identifier_type";

-- CreateIndex
CREATE UNIQUE INDEX "OTPCode_identifier_type_key" ON "OTPCode"("identifier", "type");
