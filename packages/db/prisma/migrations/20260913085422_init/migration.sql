-- DropForeignKey
ALTER TABLE "AgentInvite" DROP CONSTRAINT "AgentInvite_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "AgentInvite" ADD CONSTRAINT "AgentInvite_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
