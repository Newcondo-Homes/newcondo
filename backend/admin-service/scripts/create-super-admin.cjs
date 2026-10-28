// backend/admin-service/scripts/create-super-admin.cjs
// ============================================================
// One-time bootstrap for the FIRST super admin (there is nobody to invite them).
//
//   Direct (dev — fastest):
//     pnpm --filter @newcondo/admin-service create-super-admin you@newcondo.homes "Your Name" "YourPassw0rd"
//     → creates User(role ADMIN) + StaffMember(SUPER_ADMIN); sign in at /login right away
//
//   Invite link (production — no password in shell history):
//     pnpm --filter @newcondo/admin-service create-super-admin you@newcondo.homes "Your Name" --invite
//     → prints a one-use 72h link to /accept-invite/<token> (needs combined-backend running)
//
// Plain CommonJS on purpose: runs with `node`, no ts-node / rootDir issues.
// DATABASE_URL is read from the environment, or from the first of these that exists:
//   backend/combined-backend/.env · repo-root .env · apps/admin/.env.local
// ============================================================
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function loadEnv() {
  if (process.env.DATABASE_URL) return;
  const candidates = ["../../combined-backend/.env", "../../../.env", "../../../apps/admin/.env.local", "../.env"].map((p) => path.resolve(__dirname, p));
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    if (process.env.DATABASE_URL) { console.log(`• Loaded env from ${path.relative(process.cwd(), file)}`); return; }
  }
}

async function main() {
  loadEnv();
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL isn’t set and no .env file with it was found. Run with DATABASE_URL=... or add it to backend/combined-backend/.env");

  const [emailRaw, name, third] = process.argv.slice(2);
  const invite = third === "--invite";
  const password = invite ? null : third;
  if (!emailRaw || !name || (!invite && !password)) {
    throw new Error('Usage:\n  create-super-admin <email> "<Full Name>" "<password>"\n  create-super-admin <email> "<Full Name>" --invite');
  }
  const email = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`“${emailRaw}” isn’t a valid email`);
  if (password && !(password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password))) {
    throw new Error("Password needs at least 10 characters, an uppercase letter, a lowercase letter and a number (same rule as /accept-invite)");
  }

  const { prisma } = require("@newcondo/db");
  try {
    const supers = await prisma.staffMember.count({ where: { adminRole: "SUPER_ADMIN" } });
    if (supers > 0) throw new Error("A super admin already exists — sign in and invite staff from Staff & access.");

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, staffMember: { select: { id: true } } } });
    if (existing && existing.role !== "ADMIN") throw new Error(`${email} is already a ${existing.role.toLowerCase()} account. Staff need a separate work email.`);

    if (invite) {
      const raw = crypto.randomBytes(32).toString("base64url");
      await prisma.staffInvite.updateMany({ where: { email, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
      await prisma.staffInvite.create({ data: { email, tokenHash: crypto.createHash("sha256").update(raw).digest("hex"), adminRole: "SUPER_ADMIN", invitedById: "bootstrap", expiresAt: new Date(Date.now() + 72 * 3600_000) } });
      const base = (process.env.ADMIN_APP_URL || "http://localhost:3003").replace(/\/$/, "");
      console.log(`\n✓ Invite created for ${email}. Open within 72 hours (one use):\n\n  ${base}/accept-invite/${raw}\n`);
      return;
    }

    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const user = existing
        ? await tx.user.update({ where: { id: existing.id }, data: { name, passwordHash, emailVerified: now, verificationStatus: "VERIFIED", verifiedAt: now, userType: "ADMIN" } })
        : await tx.user.create({ data: { email, name, role: "ADMIN", userType: "ADMIN", passwordHash, emailVerified: now, verificationStatus: "VERIFIED", verifiedAt: now } });
      const m = existing?.staffMember
        ? await tx.staffMember.update({ where: { id: existing.staffMember.id }, data: { adminRole: "SUPER_ADMIN", status: "ACTIVE", grantedScopes: [], revokedScopes: [], frozenAt: null } })
        : await tx.staffMember.create({ data: { userId: user.id, adminRole: "SUPER_ADMIN" } });
      await tx.adminAction.create({ data: { adminId: user.id, action: "STAFF_ACTIVATED", targetType: "StaffMember", targetId: m.id, description: `${name} bootstrapped as super admin` } });
    });
    const base = (process.env.ADMIN_APP_URL || "http://localhost:3003").replace(/\/$/, "");
    console.log(`\n✓ Super admin ready: ${email}\n  Sign in at ${base}/login with that email and password.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(`\n✗ ${e.message}\n`); process.exit(1); });
