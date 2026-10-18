/* ============================================================
   lib/api/money.ts — MONEY CORE + Referrals v2 client.
   Every call goes to the ONE combined-backend surface (/api/v1) through
   lib/api/client.ts, which attaches the session JWT. Ownership, role and
   amount checks all live server-side; nothing here is trusted for money.

     /payments/billing/*        payment-service propertyPlan.service.ts
     /payments/wallet/ledger    payment-service wallet.service.ts (ledger)
     /payments/wallet/funding-account   account provider (POOLED ↔ PER_USER_VA)
     /referrals/me|programs|…   backend/shared/src/referrals (engine)
   Dummy payloads at the bottom are the offline fallbacks the dashboard
   hooks show if an endpoint is unreachable — same pattern as lib/dashboard/data.
   ============================================================ */
import apiClient from "@/lib/api/client";

const unwrap = <T,>(res: { data?: T }) => { if (res.data === undefined) throw new Error("Empty response"); return res.data; };

/* ---------------- wallet (ledger) ---------------- */
export type AccountMode = "POOLED" | "PER_USER_VA";

export interface WalletV2 {
  available: number;
  pending: number;
  locked: number;
  autoPayout: "OFF" | "INSTANT" | "WEEKLY" | "MONTHLY";
  bank: string | null;
  mode: AccountMode;
  title: string;
  note: string;
}

export interface LedgerLine {
  id: string;
  at: string;
  type: string;
  memo: string | null;
  amount: number;
  bucket: "available" | "pending";
  paymentId: string | null;
}
export interface Paged<T> { total: number; page: number; pageSize: number; totalPages: number; lines?: T[]; rows?: T[] }

export interface FundingAccount {
  mode: AccountMode;
  accountNumber: string;
  accountName: string;
  bankName: string;
  reference: string | null;
  /** exact amount to send for a specific payment (incl. processing fee) */
  amountNaira: number | null;
  note: string;
  perTransactionMaxNaira: number;
}

export const getWalletStatement = (page = 1) =>
  apiClient.get<Paged<LedgerLine>>(`/payments/wallet/ledger?page=${page}`).then(unwrap);
export const getFundingAccount = (reference?: string) =>
  apiClient.get<FundingAccount>(`/payments/wallet/funding-account${reference ? `?reference=${encodeURIComponent(reference)}` : ""}`).then(unwrap);

/* ---------------- per-property plans ---------------- */
export type Tier = "OWNER_ESSENTIAL" | "OWNER_PLUS" | "OWNER_PREMIUM";

export interface PlanLine {
  propertyId: string;
  title: string;
  planType: string;
  name: string;
  amountNaira: number;
  status: "ACTIVE" | "PENDING_PAYMENT" | "CANCELLED";
  included: boolean;
  cancelAtPeriodEnd: boolean;
  nextPlan: { planType: string; name: string } | null;
}
export interface BillingSummary {
  status: string;
  cycle: "MONTHLY" | "ANNUAL";
  periodEnd: string | null;
  reservedSeat: { planType: string; name: string } | null;
  savedCard: { last4: string | null; brand: string | null } | null;
  nextBillNaira: number;
  lines: PlanLine[];
  withoutPlan: { propertyId: string; title: string }[];
}
export interface PropertyPlanState {
  propertyId: string;
  periodEnd: string | null;
  canUseSeat: boolean;
  offPlan: boolean;
  line: (Omit<PlanLine, "propertyId" | "title">) | null;
}
export interface PlanQuote {
  planType: string;
  name: string;
  unitNaira: number;
  dueNowNaira: number;
  /** Flutterwave cost passed to the owner, whole naira (rounded up) */
  processingFeeNaira: number;
  processingFeeLabel: string;
  /** what the card is charged now = dueNow + processing fee */
  totalDueNaira: number;
  nextBillNaira: number;
  periodEnd: string | null;
  cycle: string;
  savedCard: { last4: string | null; brand: string | null } | null;
  usesOnboardingSeat: boolean;
}
export type StartPlanResult =
  | { status: "ACTIVE"; chargedNaira: number }
  | { status: "PENDING_PAYMENT"; chargedNaira: 0; checkout: Record<string, unknown>; savedCardFailure?: string };

export const getBillingSummary = () => apiClient.get<BillingSummary>("/payments/billing/summary").then(unwrap);
export const getPropertyPlan = (propertyId: string) => apiClient.get<PropertyPlanState>(`/payments/billing/properties/${propertyId}`).then(unwrap);
export const quotePropertyPlan = (propertyId: string, tier: Tier) =>
  apiClient.get<PlanQuote>(`/payments/billing/properties/${propertyId}/quote?tier=${tier}`).then(unwrap);
/** Charges the saved card when there is one; otherwise returns an Inline
    checkout payload (open it with useFlutterwaveInline). The NC-PSUB-*
    webhook activates the plan either way. */
export const startPropertyPlan = (propertyId: string, tier: Tier) =>
  apiClient.post<StartPlanResult>(`/payments/billing/properties/${propertyId}/plan`, { tier }).then(unwrap);
export const discontinuePropertyPlan = (propertyId: string) =>
  apiClient.post<{ endsAt: string | null; nextBillNaira: number }>(`/payments/billing/properties/${propertyId}/discontinue`).then(unwrap);
export const resumePropertyPlan = (propertyId: string) =>
  apiClient.post<{ nextBillNaira: number }>(`/payments/billing/properties/${propertyId}/resume`).then(unwrap);
export const changePropertyTier = (propertyId: string, tier: Tier) =>
  apiClient.post<{ effectiveFrom: string | null; nextBillNaira: number }>(`/payments/billing/properties/${propertyId}/tier`, { tier }).then(unwrap);

/* ---------------- referrals v2 ---------------- */
export interface ReferralOverview {
  code: string;
  link: string;
  stats: { clicks: number; signups: number; activated: number; pending: number; underReview: number };
  credit: {
    available: number;
    scheduled: { amount: number; availableAt: string }[];
    expiringSoon: { amount: number; expiresAt: string }[];
    lifetimeEarned: number;
  };
  capUsage: { ruleId: string; title: string; used: number; cap: number }[];
  milestones: { ruleId: string; title: string; target: number; current: number; state: "locked" | "pending" | "unlocked" | "used" | "closed"; ledgerId?: string; expiresAt?: string }[];
  overrides?: { count: number; total: number };
}
export interface ReferralPrograms {
  enabled: boolean;
  programs: { ruleId: string; title: string; blurb: string; reward: string; kind: "credit" | "override" | "milestone"; endsAt?: string; spots?: { claimed: number; total: number }; milestone?: { target: number } }[];
  howItWorks: string[];
  hints: string[];
}

export const getReferralOverview = () => apiClient.get<ReferralOverview>("/referrals/me").then(unwrap);
export const getReferralPrograms = () => apiClient.get<ReferralPrograms>("/referrals/programs").then(unwrap);
export const redeemServiceCredit = (ledgerId: string, propertyId: string, preferredWindow?: string) =>
  apiClient.post<{ serviceRef: string }>(`/referrals/service-credits/${ledgerId}/redeem`, { propertyId, preferredWindow }).then(unwrap);
export const applyReferralCode = (code: string) => apiClient.post("/referrals/code/apply", { code }).then(unwrap);

/* ---------------- offline fallbacks ---------------- */
export const DUMMY_WALLET_V2: WalletV2 = {
  available: 412_500, pending: 1_000, locked: 960_000, autoPayout: "OFF", bank: "GTBank ••4821",
  mode: "POOLED", title: "Newcondo wallet",
  note: "Your balance is held in Newcondo's central account and tracked to the kobo in your wallet. Funds unlock after each confirmation window and go to your bank on request.",
};
export const DUMMY_FUNDING: FundingAccount = {
  mode: "POOLED", accountNumber: "9709271874", accountName: "NEWCONDO LTD OPERATIONS FLW", bankName: "Flutterwave MFB (Formerly OK MFB)",
  reference: null, amountNaira: null, note: "Paying by bank transfer? Send the exact amount shown (it includes Flutterwave's processing fee) to Newcondo's central account and put your payment reference in the narration — that's how we match it to you.",
  perTransactionMaxNaira: 7_000_000,
};
export const DUMMY_STATEMENT: Paged<LedgerLine> = {
  total: 3, page: 1, pageSize: 20, totalPages: 1,
  lines: [
    { id: "l1", at: "2026-10-06T10:12:00Z", type: "RENT_RELEASED", memo: "Escrow release — 2-bed flat, New Owerri", amount: 960_000, bucket: "available", paymentId: "p1" },
    { id: "l2", at: "2026-10-02T15:40:00Z", type: "WITHDRAWAL_INITIATED", memo: "Withdrawal to GTBank ••4821", amount: -550_000, bucket: "available", paymentId: "p2" },
    { id: "l3", at: "2026-09-29T09:05:00Z", type: "MARKING_HOLD", memo: "Marking completed — payout held until the owner confirms", amount: 1_000, bucket: "pending", paymentId: null },
  ],
};
export const DUMMY_BILLING: BillingSummary = {
  status: "ACTIVE", cycle: "MONTHLY", periodEnd: "2026-10-28T00:00:00Z", reservedSeat: null,
  savedCard: { last4: "4242", brand: "Visa" }, nextBillNaira: 23_000,
  lines: [
    { propertyId: "p1", title: "2-bed flat, New Owerri", planType: "OWNER_PLUS", name: "Plus", amountNaira: 12_500, status: "ACTIVE", included: true, cancelAtPeriodEnd: false, nextPlan: null },
    { propertyId: "p2", title: "Duplex, GRA Phase 2", planType: "OWNER_ESSENTIAL", name: "Essential", amountNaira: 10_500, status: "ACTIVE", included: false, cancelAtPeriodEnd: false, nextPlan: null },
  ],
  withoutPlan: [{ propertyId: "p3", title: "Mini flat, Woji" }],
};
export const DUMMY_REFERRAL_OVERVIEW: ReferralOverview = {
  code: "ADA-7K2Q", link: "newcondo.homes/r/ADA-7K2Q",
  stats: { clicks: 14, signups: 4, activated: 2, pending: 2, underReview: 0 },
  credit: { available: 2_332, scheduled: [{ amount: 1_166, availableAt: "2026-10-12T09:00:00Z" }], expiringSoon: [], lifetimeEarned: 3_498 },
  capUsage: [{ ruleId: "owner-base", title: "Refer a landlord", used: 3_498, cap: 100_000 }],
  milestones: [
    { ruleId: "milestone-1-waste", title: "Free month of waste management", target: 1, current: 2, state: "unlocked", ledgerId: "rl1" },
    { ruleId: "milestone-3-fumigation", title: "Free exterior fumigation", target: 3, current: 2, state: "locked" },
    { ruleId: "milestone-5-inspection", title: "Free inspection visit", target: 5, current: 2, state: "locked" },
  ],
};
export const DUMMY_REFERRAL_PROGRAMS: ReferralPrograms = {
  enabled: true,
  programs: [
    { ruleId: "owner-base", title: "Refer a landlord", blurb: "Earn subscription credit when they subscribe — the better their plan, the more you both earn.", reward: "50% of Newcondo's margin on each of their first 3 payments, shared equally between you and them, as subscription credit. ≈ ₦1,166–₦2,062 each.", kind: "credit" },
    { ruleId: "agent-base", title: "Refer an agent", blurb: "Earn subscription credit when they join and subscribe.", reward: "50% of Newcondo's margin on each of their first 3 payments, shared equally between you and them, as subscription credit. ≈ ₦450–₦787 each.", kind: "credit" },
    { ruleId: "milestone-3-fumigation", title: "Free exterior fumigation", blurb: "Unlocked when your 3rd referred landlord is active.", reward: "Free exterior fumigation on one of your properties.", kind: "milestone", milestone: { target: 3 } },
  ],
  howItWorks: ["Invite with your link or code", "Your friend subscribes or pays", "You both get credit"],
  hints: ["You earn when your friend's first payment clears, not at signup."],
};
