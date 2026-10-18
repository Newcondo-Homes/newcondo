// backend/payment-service/src/jobs/provisionVirtualAccounts.ts
// ============================================================
// Run ONCE after switching MONEY.accountMode (or NC_ACCOUNT_MODE) to
// "PER_USER_VA":   npx ts-node src/jobs/provisionVirtualAccounts.ts
//
// Mints a Flutterwave NUBAN for every wallet-eligible user who doesn't have
// one: active owners/agents, founding/premium renters, and any renter with a
// BVN on file. Users without a BVN are listed — they keep working through the
// central account until they add one. Balances are NOT touched: they already
// live in the ledger. Safe to re-run.
// ============================================================
import { prisma } from "@newcondo/db";
import { getAccountProvider, currentAccountMode } from "@newcondo/backend-shared";

async function main() {
  if (currentAccountMode() !== "PER_USER_VA") {
    console.error("Account mode is POOLED — set MONEY.accountMode or NC_ACCOUNT_MODE=PER_USER_VA first.");
    process.exit(1);
  }
  const subs = await prisma.subscription.findMany({
    where: { virtualAccountCreated: false, status: { in: ["ACTIVE", "FREE_ACTIVE"] } },
    select: { id: true, userId: true },
  });
  const provider = getAccountProvider();
  let created = 0;
  const needBvn: string[] = [];
  for (const s of subs) {
    try {
      const r = await provider.provisionWallet(s.userId);
      if (r.virtualAccountCreated) {
        created++;
        await prisma.subscription.update({ where: { id: s.id }, data: { virtualAccountCreated: true } });
      } else if (!r.accountNumber) needBvn.push(s.userId);
    } catch (e) {
      console.error(`user ${s.userId}:`, (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 250)); // stay well inside Flutterwave rate limits
  }
  console.log(`created ${created} virtual accounts · ${needBvn.length} users need a BVN first`);
  if (needBvn.length) console.log(needBvn.join("\n"));
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
