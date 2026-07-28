"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AMENITIES = exports.NG_BANKS = exports.VERIFICATION = exports.SERVICES = exports.TENANTS = exports.REFERRALS = exports.PLANS = exports.PAYMENTS = exports.MARKING = exports.isAreaActive = exports.ACTIVE_AREAS = exports.COMPANY = void 0;
/* ---------- company ---------- */
exports.COMPANY = {
    name: "Newcondo",
    wordmark: "newcondo",
    domain: "newcondo.homes",
    supportEmail: "support@newcondo.homes",
    country: "Nigeria",
    currency: "NGN",
    currencySymbol: "₦",
};
exports.ACTIVE_AREAS = [
    { state: "Rivers", city: "Port Harcourt", areas: ["GRA Phase 2", "D-Line", "Trans Amadi", "Rumuola", "Woji", "Rumuokoro", "Aba Road"], launched: "Feb 2026" },
    { state: "Imo", city: "Owerri", areas: ["New Owerri", "Ikenegbu", "Aladinma", "Orji"], launched: "Mar 2026" },
    { state: "Enugu", city: "Enugu", areas: ["Independence Layout", "GRA", "Trans-Ekulu"], launched: "May 2026" },
    { state: "Lagos", city: "Lekki", areas: ["Lekki Phase 1", "Ikate"], launched: "Jul 2026" },
];
const isAreaActive = (state, city) => exports.ACTIVE_AREAS.some((a) => a.state === state && (!city || a.city.toLowerCase() === city.toLowerCase()));
exports.isAreaActive = isAreaActive;
/* ---------- marking service ---------- */
exports.MARKING = {
    fees: { SELF: 0, KNOWN_PERSON: 0, BROADCAST: 20000, NEWCONDO: 25000 }, // ₦, owner pays
    markerPayout: 5000, // ₦ per completed broadcast job (25% of broadcast fee)
    payoutHoldOnComplete: 1000, // ₦ held on completion; balance on owner confirmation
    slotHours: 3, // FCFS queue slot per marker
    ownerConfirmHours: 72, // owner window to confirm a marking
    broadcastRadiusKm: 10, // agent proximity for job broadcasts
    inviteLinkExpiryDays: 14, // known-person marking link validity
};
/* ---------- payments, escrow & commission ---------- */
exports.PAYMENTS = {
    platformCommissionRate: 0.20, // standard owner commission on rent
    eliteCommissionRate: 0.15, // Elite-plan owners
    agentShareOfCommission: 0.50, // listing agent's share of the commission
    subAgentSplitOfAgentShare: 0.50, // sub-agent's cut when a tracked link converts
    renterServiceFeeRate: 0.02, // renter-side fee on top of rent
    escrowWindowHours: 24, // renter confirmation window
    checkoutLockMinutes: 15, // flat/unit lock during checkout
    withdrawalFee: 0, // ₦ — withdrawals are free
};
/* ---------- subscription plans (₦/month) ---------- */
exports.PLANS = {
    owner: { essential: { name: "Essential", price: 7500 }, elite: { name: "Elite", price: 18500 } },
    agent: { premium: { name: "Premium", price: 3500 } },
    renter: { free: { name: "Free", price: 0 }, premium: { name: "Premium", price: 1500 } },
};
/* ---------- referrals (pay-on-success, dual-sided) ---------- */
exports.REFERRALS = {
    rewardByInviteeRole: { OWNER: 10000, AGENT: 5000, RENTER: 2000 }, // ₦ to the referrer
    inviteeWelcomeShare: 0.5, // invitee gets 50% of the referrer reward as credits
    leaderboardTopN: 4, // shown on the referral page before expanding
    leaderboardPageSize: 10, // rows per page in the expanded leaderboard
};
/* ---------- tenant invites ---------- */
exports.TENANTS = { inviteExpiryDays: 14 };
/* ---------- vendor services ---------- */
exports.SERVICES = {
    plans: {
        basic: { name: "Basic", pricePerQuarter: 18000, fumigationPerYear: 1, wastePickup: "Bi-weekly", inspectionsPerYear: 1 },
        shield: { name: "Shield", pricePerQuarter: 45000, fumigationPerYear: 3, wastePickup: "Weekly", inspectionsPerYear: 2 },
        estate: { name: "Estate", pricePerQuarter: 90000, fumigationPerYear: 4, wastePickup: "2×/week", inspectionsPerYear: 4 },
    },
    types: ["FUMIGATION", "WASTE_MANAGEMENT", "INSPECTION", "REPAIR_ELECTRICAL", "REPAIR_PLUMBING", "REPAIR_GENERAL"],
    vendorResponseHours: 24, // vendor must propose a slot within this window
    propertyAssessmentHours: 48, // max time to assess a reported issue
    tenantVisitNoticeHours: 48, // renters are notified this long before a visit
};
/* ---------- verification ---------- */
exports.VERIFICATION = {
    reviewHours: 24, // admin review SLA for identity/ownership documents
    acceptedIds: ["NIN", "BVN", "Driver's licence", "Voter's card", "International passport"],
};
/* ---------- Nigerian banks (Flutterwave bank codes) ---------- */
exports.NG_BANKS = [
    { name: "GTBank", code: "058" }, { name: "Access Bank", code: "044" },
    { name: "Zenith", code: "057" }, { name: "UBA", code: "033" },
    { name: "First Bank", code: "011" }, { name: "Opay", code: "999992" },
    { name: "Kuda", code: "50211" }, { name: "Moniepoint", code: "50515" },
];
/* ---------- listing amenities vocabulary ---------- */
exports.AMENITIES = ["Water (borehole)", "Prepaid meter", "Gated compound", "Parking", "POP ceiling", "Fenced", "Security", "Tiled floors", "Wardrobes", "Kitchen cabinets"];
//# sourceMappingURL=business.js.map