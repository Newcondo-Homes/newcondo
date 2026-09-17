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
  /** Standard owner rate — Essential and Plus. Authority: commissionRateFor(). */
  platformCommissionRate: 0.20,
  /** Owner Premium rate — the only tier that reduces commission. */
  premiumCommissionRate: 0.15,
  /** @deprecated renamed to premiumCommissionRate (Elite → Premium, Sept 2026). */
  eliteCommissionRate: 0.15,
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

/* ---------- structured Nigerian geography for listings ----------
   Shape: { State: { LGA: [area, ...] } }
   Used by: the create-listing address step, marking broadcasts, search. */
export type Geo = Record<string, Record<string, string[]>>;

export const GEO: Geo = {
  Imo: {
    "Owerri Municipal": ["New Owerri", "Ikenegbu", "Aladinma", "Douglas", "Wetheral"],
    "Owerri North": ["Orji", "Egbu", "Emekuku", "Uratta"],
    "Owerri West": ["Umuguma", "Avu", "Irete", "Nekede"],
    Okigwe: ["Okigwe Town", "Umulolo"],
    Mbaitoli: ["Nwaorieubi", "Ogwa"],
  },
  Rivers: {
    "Port Harcourt": ["GRA Phase 1", "GRA Phase 2", "GRA Phase 3", "D-Line", "Old Township", "Amadi Flats"],
    "Obio-Akpor": ["Trans Amadi", "Rumuola", "Woji", "Rumuokoro", "Rumuokwuta", "Ada George", "Eliozu"],
    Eleme: ["Akpajo", "Onne"],
    Ikwerre: ["Igwuruta", "Isiokpo"],
  },
};

/** States open for listing, in display order. */
export const GEO_STATES = Object.keys(GEO);

/** LGAs in a state (empty array for an unknown/closed state). */
export const lgasIn = (state: string): string[] => Object.keys(GEO[state] ?? {});

/** Areas in an LGA. */
export const areasIn = (state: string, lga: string): string[] => GEO[state]?.[lga] ?? [];

/** Guard used server-side so a crafted request can't list outside coverage. */
export const isGeoSupported = (state: string, lga?: string, area?: string): boolean => {
  const l = GEO[state];
  if (!l) return false;
  if (!lga) return true;
  const a = l[lga];
  if (!a) return false;
  return !area || a.includes(area);
};

/* ---------- proof of ownership ----------
   A listing can be CREATED without it — owners rarely have the document to
   hand at 11pm — but it gates every action that exposes the property to
   other people: marking, sharing, and inviting a tenant. */
export const OWNERSHIP_PROOF = {
  /** Actions blocked until an ownership document is uploaded. */
  gatedActions: ["MARK", "SHARE", "INVITE_TENANT", "PUBLISH"],
  acceptedDocs: [
    "Certificate of Occupancy (C of O)",
    "Deed of Assignment",
    "Governor's Consent",
    "Survey Plan",
    "Purchase Receipt + Deed",
    "Letter of Administration",
  ],
  maxSizeMb: 15,
  acceptedMime: ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"],
} as const;

/* ---------- agent invites ---------- */
export const AGENT_INVITES = {
  /** Invite links die after this many days (founder: 2). */
  expiryDays: 2,
  /** Single-use: the first agent to accept consumes the link. */
  singleUse: true,
} as const;

// TEN minutes, not five: the whole point of the register-before-OTP change is
// that the user leaves the browser to fetch the code from a mail app. Five
// minutes does not reliably survive that round trip on a phone.
// ============================================================

export const OTP = {
  /** Code lifetime. Used by register, sendOTP and resendOTP — all three. */
  expiryMinutes: 10,
  /** Digits in the code (generateOTP default). */
  length: 6,
  /** Minimum gap between sends for the same identifier+type. */
  resendCooldownSeconds: 60,
  /** Wrong-code attempts before the code is burned. */
  maxAttempts: 5,
} as const;

/** Convenience — the value every caller actually needs. */
export const OTP_EXPIRY_MS = OTP.expiryMinutes * 60 * 1000;

/* ============================================================
   STUB ACCOUNT CLEANUP

   Registering before the OTP means an abandoned form leaves a real User row
   that is unverified and unsubscribed. checkEmailExists already treats those
   as ghosts (exists: false) so the address is never blocked — but the rows
   still need sweeping, or they accumulate forever and hold the unique email
   index hostage against a future verified signup.
   ============================================================ */
export const ACCOUNT_STUBS = {
  /** Delete unverified, unsubscribed, password-only accounts older than this. */
  expiryDays: 7,
} as const;


export const ACCOUNT_DELETION = {
  /** Reversible lock-out window, in days, and the day erasure actually runs.
   *
   *  WHY 21, AND WHY 21 IS THE CEILING.
   *
   *  The NDPA requires a data subject request to be answered within 30 days
   *  (GDPR Art. 12(3) is the same shape: one month). That is a maximum, and
   *  neither law sets a minimum waiting period, so acting sooner is always
   *  compliant. Storage limitation pushes the same direction.
   *
   *  The grace window has to fit INSIDE those 30 days, not sit alongside them:
   *  a regulator reading "you asked on the 1st, we erased on the 30th" sees a
   *  30-day response, whatever we call the delay internally. So the real
   *  ceiling on this number is 30 minus operational margin.
   *
   *  21 days is that ceiling. It leaves 9 days of margin — ample for a cron
   *  that alerts at a 3-day lag — and gives someone three weeks and three
   *  reminder emails to change their mind. Going to 30 would buy nine more
   *  days of reversibility and spend ALL the margin: two failed runs and the
   *  published promise in /privacy §13 is breached, which is exactly the kind
   *  of provable claim this work exists to remove.
   *
   *  Do not raise this above 21 without also re-drafting /privacy §13, and
   *  note that §13 cannot be re-drafted past 30 days anyway — that is statute,
   *  not preference. */
  graceDays: 21,
  /** The outer commitment published in /privacy §13. Never raise graceDays to
   *  meet this number — the gap between them IS the safety margin. */
  policyMaxDays: 30,
  /** Days before erasure that we email a reminder. Must all be < graceDays.
   *  Three, not two: window LENGTH is a weak lever on whether someone changes
   *  their mind — being TOLD is the strong one. Most regret surfaces in the
   *  first 72 hours (angry or accidental click) or months later (when they need
   *  the service again), and no grace window covers the second case. */
  reminderDaysBefore: [14, 7, 1],

  /** How long the anonymous financial shell survives after erasure.
   *  18 months — long enough for chargebacks, Flutterwave's 180-day rolling
   *  reserve (merchant agreement cl. 13) and a full tax year of queries. */
  retentionMonths: 18,

  /** Records that outlive even the purge, held in isolated archive storage,
   *  not in the live database. Tax and AML record-keeping. */
  statutoryYears: 6,

  /** Re-authentication must be this fresh for the request to be accepted. */
  reauthMaxAgeMinutes: 10,
  /** Typed exactly, case-sensitive, before the button enables. */
  confirmPhrase: "DELETE MY ACCOUNT",

  /** A request is refused while a dispute or chargeback is open, and for this
   *  long after it closes — deleting to escape a dispute is already a
   *  permanent-ban offence under /refund §06. */
  disputeHoldDays: 90,

  /** Tombstone shapes. The real email/phone/referral code are freed on
   *  anonymization so the person can sign up again with them. */
  tombstone: {
    emailDomain: "deleted.newcondo.invalid",
    name: "Deleted user",
  },

  /** Reasons offered in the dialog. Free text goes in reasonNote. */
  reasons: [
    "I found a place / I no longer rent out property",
    "I'm not getting enough out of it",
    "It costs too much",
    "I had a bad experience",
    "Privacy concerns",
    "I have another account",
    "Other",
  ],
} as const;

/** Day 0 → the date erasure runs (day 14). */
export const anonymizeDateFor = (from: Date = new Date()) =>
  new Date(from.getTime() + ACCOUNT_DELETION.graceDays * 24 * 60 * 60 * 1000);

/** Erasure date → the date the residual shell may be destroyed. */
export const purgeDateFor = (anonymizedAt: Date) => {
  const d = new Date(anonymizedAt);
  d.setMonth(d.getMonth() + ACCOUNT_DELETION.retentionMonths);
  return d;
};