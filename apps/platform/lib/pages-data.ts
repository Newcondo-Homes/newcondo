/* ============================================================
   Content for the audience-aware sub-pages:
   Pricing, How it works, Features.

   PRICING IS DERIVED, NOT AUTHORED. Every price, commission rate and service
   level in the PRICING block below comes from the single source of truth at
   backend/shared/src/constants/subscriptionPlans.ts — the same file the
   backend bills from. Never type a naira figure or a percentage into this
   file; if a number is wrong, fix it there.
   ============================================================ */

import {
  SUBSCRIPTION_PLANS as P,
  OWNER_TIER_ORDER,
  RENTER_LAUNCH_PRICING,
  formatNaira,
  formatRate as pct,
  MARKING,
  MAX_PLOTS_SELF_SERVE,
} from "@/lib/constants/business";

export type Audience = "renter" | "agent" | "owner";

export const AUDIENCES: [Audience, string][] = [
  ["renter", "Renters"],
  ["agent", "Agents"],
  ["owner", "Property owners"],
];

/** Primary nav/footer CTA per audience: [label, href]. */
export const CTA: Record<Audience, [string, string]> = {
  owner: ["List your property", "/onboarding"],
  agent: ["Join as an agent", "/onboarding"],
  renter: ["Get started free", "/onboarding"],
};

/* ===================== PRICING ===================== */
export interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthly?: number;
  /** Annual price for this tier, when it has an annual twin. */
  annual?: number;
  /** "/property/month" — owner tiers are priced per property. */
  unitLabel?: string;
  priceLabel?: string;
  unit?: string;
  /** Optional struck-through "was" price shown beside the live price. */
  strike?: string;
  note?: string;
  badge?: string;
  popular: boolean;
  variant: "light" | "dark";
  cta: string;
  href: string;
}
/** comparison cell: true → check · false → dash · string → text */
export type CmpCell = boolean | string;
/** One row: a label plus ONE CELL PER PLAN, in model.plans order. Owner has
 *  three plans, agent two — the table renders model.plans.length columns, so
 *  a row's cell count must match. */
export type CmpRow = [label: string, ...cells: CmpCell[]];
export interface CmpGroup {
  name: string;
  rows: CmpRow[];
}
export interface PricingModel {
  eyebrow: string;
  title: string;
  lead: string;
  billing: boolean;
  plans: Plan[];
  groups: CmpGroup[];
  footnote: { icon: string; title: string; body: string; tag: string };
  /** Optional secondary note below the footnote card — the owner audience
   *  uses it for the "over 3 plots / estates get a custom quote" notice. */
  belowFootnote?: { icon: string; title: string; body: string; cta: string; href: string };
}

/* Derived numbers for the owner footnote. At 20% → 15% on ₦200,000 of rent:
   saves ₦10,000/month against an ₦18,250 subscription. */
const SAMPLE_RENT = 200_000;
const premiumSaving = SAMPLE_RENT * (P.OWNER_ESSENTIAL.commissionRate - P.OWNER_PREMIUM.commissionRate);
const premiumNet = P.OWNER_PREMIUM.amountNaira - premiumSaving;
/** Marking-job earnings range quoted to agents (payout → admin-job payout). */
const markingJobRange = `${formatNaira(MARKING.markerPayout)}–${formatNaira(MARKING.markerPayout * 2)}`;
/** "1× per year", or false (renders a dash) when a tier doesn't include it. */
const times = (n: number) => (n > 0 ? `${n}× per year` : false);

export const PRICING: Record<Audience, PricingModel> = {
  owner: {
    eyebrow: "For property owners",
    title: "Own the building. Finally own the income too.",
    lead: "Every tier includes escrow rent collection, identity-verified tenants, legal agreements, monthly waste management and the full Newcondo platform. Tiers differ in how often we show up — fumigation and inspections. Priced per property, per month, and you choose a tier separately for each property — mix tiers freely across your portfolio. Covers properties up to 3 plots of land; larger properties and estates get a custom quote.",
    billing: true,
    plans: OWNER_TIER_ORDER.map((code) => {
      const p = P[code];
      const annualCode = p.annualCode;
      return {
        id: p.uiId,
        name: p.name,
        tagline: p.tagline,
        monthly: p.amountNaira,
        annual: annualCode ? P[annualCode].amountNaira : undefined,
        unitLabel: p.unitLabel,
        popular: !!p.highlight,
        variant: (p.highlight ? "dark" : "light") as "dark" | "light",
        cta: `Start with ${p.name}`,
        href: "/onboarding",
      };
    }),
    groups: [
      { name: "Service level — per property", rows: [
        ["Fumigation (exterior / compound)", times(P.OWNER_ESSENTIAL.fumigationsPerYear), times(P.OWNER_PLUS.fumigationsPerYear), times(P.OWNER_PREMIUM.fumigationsPerYear)],
        // Inspection availability is defined ONCE, here, from
        // inspectionsPerYear. Do not add a second inspection row elsewhere
        // hardcoded to `true` — that contradiction shipped once already.
        ["Move-in / move-out inspection reports", times(P.OWNER_ESSENTIAL.inspectionsPerYear), times(P.OWNER_PLUS.inspectionsPerYear), times(P.OWNER_PREMIUM.inspectionsPerYear)],
        ["Monthly waste management", true, true, true],
        ["24-hour emergency maintenance", false, false, true],
      ]},
      { name: "Listings & marking", rows: [
        ["Active property listings", "Unlimited", "Unlimited", "Unlimited"],
        ["GPS property marking", true, true, true],
        ["Professional photography", "First listing free", "First listing free", "First listing free"],
        ["Priority marking agents", false, true, true],
        ["Free re-listing when a tenant vacates", false, true, true],
      ]},
      { name: "Rent & payments", rows: [
        ["Escrow rent collection", true, true, true],
        ["Platform commission on rents", pct(P.OWNER_ESSENTIAL.commissionRate), pct(P.OWNER_PLUS.commissionRate), pct(P.OWNER_PREMIUM.commissionRate)],
        ["Dedicated virtual account", true, true, true],
        ["Automatic payout scheduling", true, true, true],
        ["Rent default insurance — 1 month covered", false, false, true],
      ]},
      { name: "Tenants & legal", rows: [
        ["Identity-verified tenants only", true, true, true],
        ["Auto-generated tenancy agreements", true, true, true],
        ["Tenant blacklist access", true, true, true],
      ]},
      { name: "Intelligence & support", rows: [
        ["Rent pricing intelligence — quarterly", true, true, true],
        ["Annual rental income statement", true, true, true],
        ["Owner dashboard & activity logs", true, true, true],
        ["Annual property valuation report", false, false, true],
        ["Dedicated account manager", false, false, true],
      ]},
      { name: "Eligibility", rows: [
        ["Maximum property size (self-serve)", `Up to ${MAX_PLOTS_SELF_SERVE} plots`, `Up to ${MAX_PLOTS_SELF_SERVE} plots`, `Up to ${MAX_PLOTS_SELF_SERVE} plots`],
        ["Mix tiers across your properties", true, true, true],
      ]},
    ],
    footnote: {
      icon: "calculator", title: `Why ${P.OWNER_PREMIUM.name} pays for itself`,
      body: `On ${P.OWNER_PREMIUM.name}, commission drops from ${pct(P.OWNER_ESSENTIAL.commissionRate)} to ${pct(P.OWNER_PREMIUM.commissionRate)}. Collect ${formatNaira(SAMPLE_RENT)}/month in rent on a property and that difference saves you <strong>${formatNaira(premiumSaving)} every month</strong> — more than half the subscription. You're effectively paying ${formatNaira(premiumNet)}/month for twice the fumigation, two inspection reports a year, an account manager, rent default insurance and 24-hour emergency maintenance. And because the tier is set per property, you can put the one you rent out from abroad on ${P.OWNER_PREMIUM.name} and leave the rest on ${P.OWNER_ESSENTIAL.name}.`,
      tag: "Pay annually and get 2 months free on any tier.",
    },
    belowFootnote: {
      icon: "building-2",
      title: `Property bigger than ${MAX_PLOTS_SELF_SERVE} plots, or an estate?`,
      body: `${P.OWNER_ESSENTIAL.name}, ${P.OWNER_PLUS.name} and ${P.OWNER_PREMIUM.name} are priced for properties up to ${MAX_PLOTS_SELF_SERVE} plots of land (1–3 buildings, one fence, one owner) — that's the size our fumigation and waste-management partner pricing is built around. Larger single properties and estates are priced with a custom quote built on the same underlying cost model, scaled to size.`,
      cta: "Talk to sales",
      href: "/contact",
    },
  },
  agent: {
    eyebrow: "For agents",
    title: "Your commission, locked in before a kobo reaches the landlord.",
    lead: "Every agent on Newcondo is a paying, verified agent — which keeps listing quality high and noise low. Both tiers collect commission through the platform. Premium unlocks the income streams that pay for themselves.",
    billing: true,
    plans: [
      // ids stay "essential" / "premium" — registered as uiAliases on the
      // agent specs, so resolvePlanCode maps them without breaking any
      // /pricing?plan= link already in the wild.
      { id: "essential", name: P.AGENT_ESSENTIAL.name, tagline: `Agents getting started — up to ${P.AGENT_ESSENTIAL.propertyListingCap} active listings`, monthly: P.AGENT_ESSENTIAL.amountNaira, annual: P.AGENT_ESSENTIAL_ANNUAL.amountNaira, unitLabel: P.AGENT_ESSENTIAL.unitLabel, popular: false, variant: "light", cta: "Join as an agent", href: "/onboarding" },
      { id: "premium", name: P.AGENT_PREMIUM.name, tagline: "Full-time agents who want every income stream", badge: P.AGENT_PREMIUM.badge, monthly: P.AGENT_PREMIUM.amountNaira, annual: P.AGENT_PREMIUM_ANNUAL.amountNaira, unitLabel: P.AGENT_PREMIUM.unitLabel, popular: true, variant: "dark", cta: "Claim founding spot", href: "/onboarding" },
    ],
    groups: [
      { name: "Listings", rows: [
        ["Active property listings", `Up to ${P.AGENT_ESSENTIAL.propertyListingCap}`, "Unlimited"],
        ["GPS property marking", true, true],
        ["Verified agent badge", "Standard", "Verified Premium"],
        ["Priority listing placement in search", false, true],
      ]},
      { name: "Earnings", rows: [
        ["Commission collection through platform", true, true],
        ["Listing-agent commission (50% of platform fee)", true, true],
        ["Marking job queue access", false, `${markingJobRange} / job`],
        ["Referral income access", false, true],
        ["Automatic payout scheduling", false, true],
      ]},
      { name: "Sub-agent network", rows: [
        ["Promote other agents' listings", true, true],
        ["Sub-agent network participation", "Standard", "Full management"],
        ["Control who promotes your listings", false, true],
      ]},
      { name: "Tools & support", rows: [
        ["Renter inquiries access", true, true],
        ["Dashboard", "Basic", "Advanced analytics"],
        ["Dedicated virtual account", true, true],
      ]},
    ],
    footnote: {
      icon: "trending-up", title: `${P.AGENT_PREMIUM.name} pays for itself`,
      body: `One marking job (${markingJobRange}) covers two to three months of ${P.AGENT_PREMIUM.name}. One commission on a ₦400,000/year rental pays for years. The subscription isn't a cost — <strong>your first deal covers it permanently.</strong>`,
      tag: "First 100 founding agents get Premium free for life.",
    },
  },
  renter: {
    eyebrow: "For renters",
    title: "Find a home in Nigeria without getting burnt.",
    lead: "Right now, renting on Newcondo is free for renters — verified listings, secure payment, the 24-hour refund window and the double-booking lock, all included. Paid plans come later; the first 300 founding renters keep their perks when they do.",
    billing: false,
    plans: [
      { id: "plus", name: P.RENTER_PREMIUM_PLUS.name, tagline: "Everything renters get — free while we grow", priceLabel: "Free", unit: "", strike: `${formatNaira(RENTER_LAUNCH_PRICING.premiumPlus)}/mo`, note: `Free for the first 300 founding renters · ${formatNaira(RENTER_LAUNCH_PRICING.premiumPlus)}/mo after launch`, badge: "Founding offer — free for life", popular: true, variant: "dark", cta: "Claim founding access", href: "/onboarding" },
    ],
    groups: [
      { name: "Search & discovery", rows: [
        ["Browse & search verified listings", true, true],
        ["Filter, save & compare properties", true, true],
        ["Remote property discovery (room photos)", true, true],
        ["Verified-listings-only view", false, true],
        ["Early access to new listings", false, true],
      ]},
      { name: "Payments & protection", rows: [
        ["Secure platform payment", true, true],
        ["No exploitative agent fees", true, true],
        ["24-hour confirmation & refund window", true, true],
        ["Anti-double-booking lock", true, true],
      ]},
      { name: "Account & rewards", rows: [
        ["Virtual wallet & transaction history", true, true],
        ["Referral bonus credits", "Standard", "Boosted"],
        ["Premium profile badge", false, true],
        ["Priority customer support", false, true],
      ]},
    ],
    footnote: {
      icon: "gift", title: "Free for renters, right now",
      body: `While we build our launch base, renters use Newcondo for free — including the full ${P.RENTER_PREMIUM_PLUS.name} protection stack for the first 300 founding renters. Paid plans (Basic Premium ${formatNaira(RENTER_LAUNCH_PRICING.basicPremium)}/mo and ${P.RENTER_PREMIUM_PLUS.name} ${formatNaira(RENTER_LAUNCH_PRICING.premiumPlus)}/mo, billed monthly with ~2 months free yearly) arrive later, and <strong>founding renters keep their founding perks.</strong>`,
      tag: "No card required. Takes 2 minutes to create your account.",
    },
  },
};

/* ===================== HOW IT WORKS ===================== */
export type StepVariant = "coral" | "lilac" | "teal" | "sunset";
export interface HowStep { n: string; variant: StepVariant; label: string; anim: string; title: string; text: string; }
export interface HowModel { title: string; lead: string; steps: HowStep[]; cta: [string, string]; }

export const HOW: Record<Audience, HowModel> = {
  owner: {
    title: "From locked-out landlord to fully in control — in five steps.",
    lead: "You list once. Newcondo verifies your tenants, holds your rent, handles your paperwork and coordinates your maintenance. Here's the whole journey.",
    steps: [
      { n: "01", variant: "coral", label: "List & verify", anim: "List & verify", title: "List your property and prove it's yours", text: "Add your property, upload your documents, and complete ID verification. Verified listings attract serious, identity-checked renters — not time-wasters." },
      { n: "02", variant: "lilac", label: "Mark on the map", anim: "Mark your property", title: "GPS-mark the building so no one else can claim it", text: "Tap your property on the map — we store the exact coordinates and boundary. It can never be double-listed. Not on-site? Send someone with a link, or assign a verified Newcondo agent." },
      { n: "03", variant: "teal", label: "Tenants find you", anim: "Tenants find you", title: "Agents promote your listing — you stay in control", text: "Registered agents can promote your property at no cost to you. Every view and every paying tenant is attributed to the agent's link, so you always know who delivered." },
      { n: "04", variant: "sunset", label: "Rent in escrow", anim: "Rent into escrow", title: "Rent is collected and held — agents never touch it", text: "When a tenant pays, the money sits in a secure virtual account. After the 24-hour confirmation window it's released directly to your bank. Every naira tracked." },
      { n: "05", variant: "coral", label: "We handle the rest", anim: "We handle the rest", title: "Fumigation, waste, maintenance and documents — coordinated", text: "Your fumigation is scheduled, waste collected, tenancy agreement generated and stored. Maintenance requests come through the app — you approve repairs from your dashboard." },
    ],
    cta: ["See owner plans", "/pricing?type=owner"],
  },
  agent: {
    title: "List, mark, earn — and never chase a commission again.",
    lead: "Every step you do as an agent is wired into the platform, so the money and the credit can't be taken away from you.",
    steps: [
      { n: "01", variant: "lilac", label: "Join & verify", anim: "Join & verify", title: "Create your agent account and get verified", text: "Sign up, verify with your NIN, BVN or government ID, and your verified badge plus a personal virtual account are created automatically." },
      { n: "02", variant: "teal", label: "List or promote", anim: "List or promote", title: "Be the sole listing agent — or promote others' listings", text: "List a property and you're the one listing agent for it; no one can co-list above or beside you. Or promote any open listing with your own tracked link and earn on it." },
      { n: "03", variant: "sunset", label: "Take marking jobs", anim: "Take marking jobs", title: "Earn from marking jobs near you", text: "When an owner needs a property marked, the job is broadcast to verified agents nearby on a first-come queue. Accept it, mark the property, and earn ₦5,000–₦10,000 per job." },
      { n: "04", variant: "coral", label: "Commission locked", anim: "Commission locked in", title: "Your commission is set aside before the landlord is paid", text: "When a renter pays, the platform calculates every split and holds your share first. The landlord can't receive funds without your cut already reserved. It's the architecture, not a promise." },
      { n: "05", variant: "lilac", label: "Withdraw", anim: "Withdraw on your schedule", title: "Get paid on your own schedule", text: "After the confirmation window clears, your commission lands in your virtual account. Withdraw manually, or set automatic transfers to your bank — daily, weekly or monthly." },
    ],
    cta: ["See agent plans", "/pricing?type=agent"],
  },
  renter: {
    title: "Find a real home, pay safely, move in — with nothing to lose.",
    lead: "No fake listings. No double-booking. No surprise agent fees. Here's how renting on Newcondo actually works.",
    steps: [
      { n: "01", variant: "teal", label: "Create account", anim: "Create your account", title: "Sign up free in two minutes", text: "Create your account with your email or phone and choose renter. It's free for now — no card required, and the first 300 founding renters keep their perks when paid plans arrive." },
      { n: "02", variant: "sunset", label: "Browse verified", anim: "Browse verified listings", title: "Browse only verified, GPS-marked properties", text: "Every property is geo-verified before it's listed, so if you see it, it's real. Filter by city, price and type; save and compare from your phone." },
      { n: "03", variant: "coral", label: "Pay securely", anim: "Pay securely", title: "Pay through the platform — the flat locks to you", text: "The moment you start payment, that property is locked. No one else can pay for it at the same time, so double-booking simply can't happen." },
      { n: "04", variant: "lilac", label: "Confirm in 24h", anim: "Confirm within 24 hours", title: "Inspect, then confirm within 24 hours", text: "Your money is held — not released — for 24 hours. Visit the property and confirm it matches the listing. If it doesn't, request a refund automatically from your dashboard." },
      { n: "05", variant: "teal", label: "Move in", anim: "Move in", title: "Confirm and move in", text: "Once you confirm, payment releases to the verified parties and your details are documented. No agent fee ambush, no stories — just your keys." },
    ],
    cta: ["See renter plan", "/pricing?type=renter"],
  },
};

/* ===================== FEATURES ===================== */
export interface Feature { icon: string; title: string; body: string; }
export interface FeatureGroupT { name: string; sub: string; items: Feature[]; }
export interface FeaturesModel { title: string; lead: string; groups: FeatureGroupT[]; cta: [string, string]; }

export const FEATURES_PAGE: Record<Audience, FeaturesModel> = {
  owner: {
    title: "Everything it takes to own rental property — without the second job.",
    lead: "We didn't build a listing site. We built a property-management operation that protects your money, screens your tenants, handles your paperwork and keeps your property cared for.",
    groups: [
      { name: "Money & protection", sub: "Your rent arrives, in full, every time.", items: [
        { icon: "shield-check", title: "Escrow rent collection", body: "Rent is collected and held by Newcondo in a secure virtual account, then released straight to your bank after the confirmation window. Your agents coordinate tenants — they never hold a kobo of your money." },
        { icon: "wallet", title: "Dedicated virtual account", body: "Every owner gets a virtual account where rent is held and tracked. Set automatic transfers to your personal bank — as soon as funds clear, or on a schedule you choose." },
        { icon: "umbrella", title: "Rent default insurance (Premium)", body: "If a verified tenant stops paying and won't vacate, Newcondo covers one full month of lost rent while the dispute is resolved. No other platform in Nigeria offers this." },
      ]},
      { name: "Tenants & legal", sub: "Know exactly who you're handing your keys to.", items: [
        { icon: "badge-check", title: "Identity-verified tenants only", body: "Every renter submits NIN, BVN, passport or driver's licence before they can pay. You'll never unknowingly hand your keys to an anonymous stranger again." },
        { icon: "scroll-text", title: "Auto-generated tenancy agreements", body: "The moment payment clears, a legally structured tenancy agreement is generated, signed digitally by both parties, and stored permanently — retrievable anytime, including in court." },
        { icon: "user-x", title: "Tenant blacklist access", body: "Before accepting a tenant, check their Newcondo history: evictions, defaults, reported damage and disputes. The database grows with every landlord on the platform." },
        { icon: "clipboard-check", title: "Move-in & move-out inspection reports (Plus)", body: "When a tenant moves in or out, Newcondo documents an inspection with photos comparing condition. If there's damage, you have evidence — no more “that crack was already there.” Once a year on Plus, twice on Premium." },
      ]},
      { name: "Property care", sub: "The chores that lose you tenants — handled on a schedule.", items: [
        { icon: "bug", title: "Scheduled fumigation", body: "Professional exterior fumigation of the compound, coordinated by Newcondo — once a year on Essential and Plus, twice on Premium. No contractors to call, nothing to remember." },
        { icon: "trash-2", title: "Monthly waste management", body: "Waste collection for your compound, coordinated and tracked every month. No compound disputes, no LAWMA fines, no refuse sitting for three weeks." },
        { icon: "wrench", title: "24-hour emergency maintenance (Premium)", body: "Burst pipe, electrical fault, broken gate — the tenant raises it in the app and Newcondo dispatches a vetted contractor within 24 hours. You approve the quote from your phone." },
      ]},
      { name: "Intelligence & support", sub: "Run your property like the asset it is.", items: [
        { icon: "trending-up", title: "Rent pricing intelligence", body: "A quarterly report on what comparable properties on your street and LGA are actually renting for today — so you stop leaving money on the table." },
        { icon: "file-text", title: "Annual rental income statement", body: "A formatted, signed statement of all rent collected through Newcondo in the year — for tax, loans, mortgages and proof of income. Most landlords can't prove this. Now you can." },
        { icon: "camera", title: "Professional photography", body: "Newcondo sends a photographer before your listing goes live (first listing free). Better photos mean faster tenants and less vacancy." },
        { icon: "headphones", title: "Dedicated account manager (Premium)", body: "A named Newcondo staff member handles your account with monthly performance updates and agent coordination on your behalf — built for diaspora owners especially." },
      ]},
    ],
    cta: ["Compare owner plans", "/pricing?type=owner"],
  },
  agent: {
    title: "The platform that makes sure you get paid for the work you actually did.",
    lead: "A listing site lets you be bypassed, undercut and ignored. Newcondo wires your commission, your listings and your reputation into the system itself — so they can't be taken from you.",
    groups: [
      { name: "Get paid, every time", sub: "Your commission is architecture, not a conversation.", items: [
        { icon: "lock", title: "Commission locked before the landlord is paid", body: "When a renter pays, the platform calculates and holds your listing-agent commission — 50% of Newcondo's 20% platform fee — before the landlord receives anything. There's no scenario where you do the work and don't get paid." },
        { icon: "shield-ban", title: "Renters can't pay behind your back", body: "Listed properties are payment-locked to the platform. There's no “call the landlord directly” path — the only way to rent is through Newcondo, which means your commission is protected on every deal." },
        { icon: "wallet", title: "Virtual account + automatic payouts", body: "On signup you get a virtual account where every commission, marking fee and referral reward lands. Set automatic transfers to your bank on your own cadence, or withdraw any time." },
      ]},
      { name: "Your listings, your network", sub: "Control who profits from what you built.", items: [
        { icon: "badge-check", title: "Sole listing-agent protection", body: "List it and you own it. No other agent can claim, co-list or override your position. The chain ambush — where a deal you sourced gets split five ways — is structurally impossible." },
        { icon: "users", title: "Sub-agent promotion network", body: "Open your listings to other agents who promote them across WhatsApp and social media. When a renter pays through a sub-agent's link, the split is automatic and transparent — you both get paid without a single conversation." },
        { icon: "sliders-horizontal", title: "Control how you're promoted", body: "Choose per listing: open public promotion, permission-based, request-and-review, or fully restricted. Change it any time. Your listings are your business." },
      ]},
      { name: "Earn beyond listings", sub: "Income streams that activate just for being active.", items: [
        { icon: "map-pin", title: "Marking job income", body: "When an owner near you needs a property marked, the job is broadcast to verified agents on a first-come queue. Show up, mark it, and earn ₦5,000–₦10,000 — income that has nothing to do with your own listings." },
        { icon: "gift", title: "Referral income", body: "Refer another agent or a property owner; when they transact, you earn referral credits automatically — no manual tracking, no chasing." },
      ]},
      { name: "Standing & tools", sub: "Stand out from unverified competition.", items: [
        { icon: "shield-check", title: "Verified badge + reliability score", body: "Your profile shows a verified badge after ID checks and builds a public reliability score from successful deals and marking jobs. In a market full of fake agents, your verified status converts." },
        { icon: "bar-chart-3", title: "Advanced analytics (Premium)", body: "Views per listing, sub-agent activity, conversion rates and payout history — see exactly what's working across your portfolio." },
        { icon: "phone-off", title: "Zero post-rent drama", body: "Once a deal closes, operational questions and disputes route through the platform, not your personal phone. Your job ends when the deal closes." },
      ]},
    ],
    cta: ["Compare agent plans", "/pricing?type=agent"],
  },
  renter: {
    title: "Rent in Nigeria the way it should have always worked.",
    lead: "Fake listings, double-bookings and surprise agent fees aren't your fault — but they've been your problem. Every feature here exists to take one of them off the table.",
    groups: [
      { name: "Find real homes", sub: "If you can see it here, it exists.", items: [
        { icon: "map-pin", title: "Geo-verified listings only", body: "Before any property is listed, it must be physically marked on the map with stored coordinates. A fake or nonexistent address can't complete the process — so you stop wasting Saturdays and transport on ghost flats." },
        { icon: "shield-check", title: "Verified, accountable agents", body: "Every agent is verified with government ID, BVN/NIN and a signed legal undertaking, and their performance is tracked. No more anonymous agents disappearing behind new phone numbers." },
        { icon: "image", title: "Remote property discovery", body: "Listings include verified room-by-room photos taken at the point of marking, so you can search and commit to a flat in Lagos from Abuja — or from London — without flying in to inspect." },
      ]},
      { name: "Pay with protection", sub: "Your money is never just gone.", items: [
        { icon: "lock", title: "Anti-double-booking lock", body: "The moment you start payment, the property locks to you. No one else can pay for the same flat at the same time — the nightmare of two families on moving day simply can't happen." },
        { icon: "rotate-ccw", title: "24-hour confirmation & refund window", body: "After you pay, your money is held — not released — for 24 hours. Visit, confirm it matches the listing, and if it doesn't, get a full refund automatically. No begging, no negotiation." },
        { icon: "circle-dollar-sign", title: "No exploitative agent fees", body: "One transparent platform fee, shown before you commit. No 10% agency fee on top, no “connection” or “introduction” charge. What you see is what you pay." },
      ]},
      { name: "Search smarter & earn", sub: "Less hassle, a little reward.", items: [
        { icon: "wallet", title: "Virtual wallet & history", body: "A secure wallet holds your transactions and keeps a clear record of every payment and refund — no more chasing receipts." },
        { icon: "gift", title: "Referral bonus credits", body: "Get a unique link the moment you join. When someone you refer completes a transaction, you earn credits toward future fees. Refer a few friends and your Premium pays for itself." },
        { icon: "star", title: "Premium badge & priority support", body: "Verified Premium renters get a profile badge agents respond to faster, plus priority customer support when you need a hand." },
      ]},
    ],
    cta: ["See the renter plan", "/pricing?type=renter"],
  },
};
