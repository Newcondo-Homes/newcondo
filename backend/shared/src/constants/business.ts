// backend/shared/src/constants/business.ts
// ============================================================
// SINGLE SOURCE OF TRUTH for every business number/list that can change:
// prices, fees, commission rates, time windows, active coverage areas,
// referral rewards, plans. Backend services AND the Next.js frontend import
// from here (frontend via `@newcondo/backend-shared/constants` — see
// apps/platform/lib/constants/business.ts re-export shim).
// Change a value here → it changes everywhere.
// Export from shared/src/index.ts:  export * from "./constants/business";
// ============================================================

/* ---------- company ---------- */
export const COMPANY = {
  name: "Newcondo",
  wordmark: "newcondo",
  domain: "newcondo.homes",
  supportEmail: "support@newcondo.homes",
  country: "Nigeria",
  currency: "NGN",
  currencySymbol: "₦",
} as const;

/* ---------- coverage: active areas (logistics roll-out is area by area).
   Referral/affiliate links, marking broadcasts and listings only operate in
   these areas. Add a row to launch an area. ---------- */
export interface ActiveArea { state: string; city: string; areas: string[]; launched: string; }
export const ACTIVE_AREAS: ActiveArea[] = [
  { state: "Rivers", city: "Port Harcourt", areas: ["GRA Phase 2", "D-Line", "Trans Amadi", "Rumuola", "Woji", "Rumuokoro", "Aba Road"], launched: "Feb 2026" },
  { state: "Imo", city: "Owerri", areas: ["New Owerri", "Ikenegbu", "Aladinma", "Orji"], launched: "Mar 2026" },
  { state: "Enugu", city: "Enugu", areas: ["Independence Layout", "GRA", "Trans-Ekulu"], launched: "May 2026" },
  { state: "Lagos", city: "Lekki", areas: ["Lekki Phase 1", "Ikate"], launched: "Jul 2026" },
];
export const isAreaActive = (state: string, city?: string) =>
  ACTIVE_AREAS.some((a) => a.state === state && (!city || a.city.toLowerCase() === city.toLowerCase()));

/* ---------- marking service ---------- */
export const MARKING = {
  fees: { SELF: 0, KNOWN_PERSON: 0, BROADCAST: 20_000, NEWCONDO: 25_000 }, // ₦, owner pays
  markerPayout: 5_000,        // ₦ per completed broadcast job (25% of broadcast fee)
  payoutHoldOnComplete: 1_000, // ₦ held on completion; balance on owner confirmation
  slotHours: 3,                // FCFS queue slot per marker
  ownerConfirmHours: 72,       // owner window to confirm a marking
  broadcastRadiusKm: 10,       // agent proximity for job broadcasts
  inviteLinkExpiryDays: 14,    // known-person marking link validity
} as const;

/* ---------- payments, escrow & commission ---------- */
export const PAYMENTS = {
  platformCommissionRate: 0.20,      // standard owner commission on rent
  eliteCommissionRate: 0.15,         // Elite-plan owners
  agentShareOfCommission: 0.50,      // listing agent's share of the commission
  subAgentSplitOfAgentShare: 0.50,   // sub-agent's cut when a tracked link converts
  renterServiceFeeRate: 0.02,        // renter-side fee on top of rent
  escrowWindowHours: 24,             // renter confirmation window
  checkoutLockMinutes: 15,           // flat/unit lock during checkout
  withdrawalFee: 0,                  // ₦ — withdrawals are free
} as const;

/* ---------- subscription plans (₦/month) ---------- */
export const PLANS = {
  owner: { essential: { name: "Essential", price: 7_500 }, elite: { name: "Elite", price: 18_500 } },
  agent: { premium: { name: "Premium", price: 3_500 } },
  renter: { free: { name: "Free", price: 0 }, premium: { name: "Premium", price: 1_500 } },
} as const;

/* ---------- referrals (pay-on-success, dual-sided) ---------- */
export const REFERRALS = {
  rewardByInviteeRole: { OWNER: 10_000, AGENT: 5_000, RENTER: 2_000 }, // ₦ to the referrer
  inviteeWelcomeShare: 0.5,   // invitee gets 50% of the referrer reward as credits
  leaderboardTopN: 4,         // shown on the referral page before expanding
  leaderboardPageSize: 10,    // rows per page in the expanded leaderboard
} as const;

/* ---------- tenant invites ---------- */
export const TENANTS = { inviteExpiryDays: 14 } as const;

/* ---------- vendor services ---------- */
export const SERVICES = {
  plans: {
    basic: { name: "Basic", pricePerQuarter: 18_000, fumigationPerYear: 1, wastePickup: "Bi-weekly", inspectionsPerYear: 1 },
    shield: { name: "Shield", pricePerQuarter: 45_000, fumigationPerYear: 3, wastePickup: "Weekly", inspectionsPerYear: 2 },
    estate: { name: "Estate", pricePerQuarter: 90_000, fumigationPerYear: 4, wastePickup: "2×/week", inspectionsPerYear: 4 },
  },
  types: ["FUMIGATION", "WASTE_MANAGEMENT", "INSPECTION", "REPAIR_ELECTRICAL", "REPAIR_PLUMBING", "REPAIR_GENERAL"],
  vendorResponseHours: 24,          // vendor must propose a slot within this window
  propertyAssessmentHours: 48,      // max time to assess a reported issue
  tenantVisitNoticeHours: 48,       // renters are notified this long before a visit
} as const;

/* ---------- verification ---------- */
export const VERIFICATION = {
  reviewHours: 24, // admin review SLA for identity/ownership documents
  acceptedIds: ["NIN", "BVN", "Driver's licence", "Voter's card", "International passport"],
} as const;

/* ---------- Nigerian banks (Flutterwave bank codes) ---------- */
export const NG_BANKS: { name: string; code: string }[] = [
  { name: "GTBank", code: "058" }, { name: "Access Bank", code: "044" },
  { name: "Zenith", code: "057" }, { name: "UBA", code: "033" },
  { name: "First Bank", code: "011" }, { name: "Opay", code: "999992" },
  { name: "Kuda", code: "50211" }, { name: "Moniepoint", code: "50515" },
];

/* ---------- listing amenities vocabulary ---------- */
export const AMENITIES = ["Water (borehole)", "Prepaid meter", "Gated compound", "Parking", "POP ceiling", "Fenced", "Security", "Tiled floors", "Wardrobes", "Kitchen cabinets"];
