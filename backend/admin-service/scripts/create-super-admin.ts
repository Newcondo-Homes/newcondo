// backend/admin-service/scripts/create-super-admin.ts
// One-time bootstrap: there is no invite for the first super admin.
//   pnpm --filter @newcondo/admin-service exec ts-node scripts/create-super-admin.ts cto@newcondo.homes "Nnamaka Dike"
// Prints a one-use invite link (72h) instead of taking a password on the command line.
import { prisma } from "@newcondo/db";
import { randomBytes, createHash } from "crypto";

async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email || !name) throw new Error("Usage: create-super-admin <email> <name>");
  if (await prisma.staffMember.count({ where: { adminRole: "SUPER_ADMIN" } })) throw new Error("A super admin already exists — invite staff from the dashboard.");
  const raw = randomBytes(32).toString("base64url");
  await prisma.staffInvite.create({ data: { email: email.toLowerCase(), tokenHash: createHash("sha256").update(raw).digest("hex"), adminRole: "SUPER_ADMIN", invitedById: "bootstrap", expiresAt: new Date(Date.now() + 72 * 3600_000) } });
  console.log(`Open within 72h: ${(process.env.ADMIN_APP_URL ?? "http://localhost:3003")}/accept-invite/${raw}`);
}
main().finally(() => prisma.$disconnect());
