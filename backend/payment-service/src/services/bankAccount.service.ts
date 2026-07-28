// backend/payment-service/src/services/bankAccount.service.ts
// ============================================================
// User payout BANK ACCOUNTS (distinct from VirtualAccount).
// VirtualAccounts are auto-created by Newcondo (one per user + one per
// property, keyed by VirtualAccount.propertyId). BankAccounts are where
// withdrawals/auto-payout land — user-managed, one default.
//
// Sensitive ops (add, change default) require a fresh OTP delivered by the
// branded email template. Account numbers are resolved against Flutterwave
// (name enquiry) before saving, so money only ever goes to an account in the
// user's own name.
// ============================================================
import axios from "axios";
import { randomInt } from "crypto";
import { prisma } from "@newcondo/db";
import {
  badRequest, conflict, forbidden, notFound, tooMany, unauthorized, unprocessable,
  flutterwaveConfig, redis, sendBrandedEmail, EmailTemplates,
} from "@newcondo/backend-shared";

const FLW_BASE = flutterwaveConfig.FLUTTERWAVE_BASE_URL || "https://api.flutterwave.com/v3";
const flwAuth = { Authorization: `Bearer ${flutterwaveConfig.FLUTTERWAVE_SECRET_KEY}` };

/* ---------- OTP gate ---------- */
const otpKey = (userId: string) => `otp:bank:${userId}`;

export async function requestBankOtp(userId: string, email: string): Promise<void> {
  const code = String(randomInt(100000, 1000000));
  await redis.setex(otpKey(userId), 600, JSON.stringify({ code, tries: 0 }));
  await sendBrandedEmail(email, EmailTemplates.otp({
    code, purpose: "confirm a change to your payout bank account", expiresMinutes: 10,
  }));
}

export async function verifyBankOtp(userId: string, code: string): Promise<void> {
  const raw = await redis.get(otpKey(userId));
  if (!raw) throw unauthorized("Request a new code — this one expired");
  const state = JSON.parse(raw) as { code: string; tries: number };
  if (state.tries >= 5) { await redis.del(otpKey(userId)); throw tooMany("Too many attempts — request a new code"); }
  if (state.code !== code) {
    await redis.setex(otpKey(userId), 600, JSON.stringify({ ...state, tries: state.tries + 1 }));
    throw unauthorized("That code is not correct");
  }
  await redis.del(otpKey(userId)); // single-use
}

/* ---------- Flutterwave name enquiry ---------- */
async function resolveAccount(accountNumber: string, bankCode: string): Promise<string> {
  const res = await axios.post(
    `${FLW_BASE}/accounts/resolve`,
    { account_number: accountNumber, account_bank: bankCode },
    { headers: flwAuth, timeout: 15_000 }
  );
  if (res.data?.status !== "success") throw unprocessable("Could not verify this bank account");
  return res.data.data.account_name as string;
}

/* ---------- CRUD ---------- */
export async function listBankAccounts(userId: string) {
  return prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

export async function addBankAccount(
  userId: string,
  input: { bankName: string; bankCode: string; accountNumber: string }
) {
  if (!/^\d{10}$/.test(input.accountNumber)) throw badRequest("Account number must be 10 digits");
  const accountName = await resolveAccount(input.accountNumber, input.bankCode);
  const count = await prisma.bankAccount.count({ where: { userId } });
  return prisma.bankAccount.create({
    data: { userId, ...input, accountName, isDefault: count === 0 }, // first account becomes default
  });
}

async function owned(accountId: string, userId: string) {
  const acct = await prisma.bankAccount.findUnique({ where: { id: accountId } });
  if (!acct) throw notFound("Bank account not found");
  if (acct.userId !== userId) throw forbidden("Not your bank account");
  return acct;
}

export async function setDefaultBankAccount(accountId: string, userId: string) {
  await owned(accountId, userId);
  const [, updated] = await prisma.$transaction([
    prisma.bankAccount.updateMany({ where: { userId }, data: { isDefault: false } }),
    prisma.bankAccount.update({ where: { id: accountId }, data: { isDefault: true } }),
  ]);
  return updated;
}

export async function deleteBankAccount(accountId: string, userId: string): Promise<void> {
  const acct = await owned(accountId, userId);
  if (acct.isDefault) {
    const others = await prisma.bankAccount.count({ where: { userId, id: { not: accountId } } });
    if (others > 0) throw conflict("Pick another default account before deleting this one");
  }
  await prisma.bankAccount.delete({ where: { id: accountId } });
}
