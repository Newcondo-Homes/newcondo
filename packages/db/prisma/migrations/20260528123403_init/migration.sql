-- AddForeignKey
ALTER TABLE "OTPCode" ADD CONSTRAINT "OTPCode_identifier_fkey" FOREIGN KEY ("identifier") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;
