// backend/payment-service/src/jobs/backfillLedger.ts
// ============================================================
// ONE-OFF, run once after the money-core migration and BEFORE the new code
// takes traffic:   npx ts-node src/jobs/backfillLedger.ts [--dry-run]
//
// Before the ledger, a wallet balance was a sum over Payment rows. This
// carries that history over as OPENING_BALANCE postings so nobody's balance
// moves at cut-over:
//   • per user: RELEASED credits (RENT_RELEASE, AGENT_COMMISSION,
//     PROPERTY_MARKING) − withdrawals (PENDING + SUCCESS)  → user:available
//   • every RENT payment still HELD                         → escrow:rent
//     (so releasing it later has the funds to split)
//   • every withdrawal still PENDING                        → transit:payouts
// Idempotent (keys `opening:*`), so a second run is a no-op.
// ============================================================
import { prisma } from "@newcondo/db";
import { ACC, postLedgerStandalone, toKobo } from "@newcondo/backend-shared";

const DRY = process.argv.includes("--dry-run");

async function main() {
  const credits = await prisma.payment.groupBy({
    by: ["userId"],
    where: { status: "RELEASED", paymentType: { in: ["RENT_RELEASE", "AGENT_COMMISSION", "PROPERTY_MARKING"] } },
    _sum: { amount: true },
  });
  const withdrawals = await prisma.payment.groupBy({
    by: ["userId"],
    where: { paymentType: "WITHDRAWAL", status: { in: ["PENDING", "SUCCESS"] } },
    _sum: { amount: true },
  });
  const wd = new Map(withdrawals.map((w) => [w.userId, Number(w._sum.amount ?? 0)]));

  let users = 0;
  for (const c of credits) {
    const bal = Number(c._sum.amount ?? 0) - (wd.get(c.userId) ?? 0);
    if (bal <= 0) continue;
    users++;
    console.log(`user ${c.userId}: ₦${bal.toLocaleString("en-NG")}`);
    if (!DRY) await postLedgerStandalone({
      idempotencyKey: `opening:user:${c.userId}`, type: "OPENING_BALANCE", sourceType: "ADMIN", sourceId: c.userId,
      memo: "Opening balance carried over from the pre-ledger wallet",
      legs: [{ account: ACC.world, amountKobo: -toKobo(bal) }, { account: ACC.userAvailable(c.userId), amountKobo: toKobo(bal) }],
    });
  }

  const held = await prisma.payment.aggregate({ where: { status: "HELD", paymentType: "RENT" }, _sum: { ownerAmount: true } });
  const heldNaira = Number(held._sum.ownerAmount ?? 0);
  if (heldNaira > 0 && !DRY) await postLedgerStandalone({
    idempotencyKey: "opening:escrow:rent", type: "OPENING_BALANCE", sourceType: "ADMIN", sourceId: "escrow",
    memo: "Rent in escrow at cut-over",
    legs: [{ account: ACC.world, amountKobo: -toKobo(heldNaira) }, { account: ACC.rentEscrow, amountKobo: toKobo(heldNaira) }],
  });

  const transit = await prisma.payment.aggregate({ where: { status: "PENDING", paymentType: "WITHDRAWAL" }, _sum: { amount: true } });
  const transitNaira = Number(transit._sum.amount ?? 0);
  if (transitNaira > 0 && !DRY) await postLedgerStandalone({
    idempotencyKey: "opening:transit", type: "OPENING_BALANCE", sourceType: "ADMIN", sourceId: "transit",
    memo: "Withdrawals in flight at cut-over",
    legs: [{ account: ACC.world, amountKobo: -toKobo(transitNaira) }, { account: ACC.payoutsInTransit, amountKobo: toKobo(transitNaira) }],
  });

  console.log(`${DRY ? "[dry-run] " : ""}opened ${users} wallets · escrow ₦${heldNaira.toLocaleString("en-NG")} · in transit ₦${transitNaira.toLocaleString("en-NG")}`);
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
