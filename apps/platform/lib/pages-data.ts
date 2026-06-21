/* ============================================================
   Content for the audience-aware sub-pages:
   Pricing, How it works, Features. Single source of truth.
   ============================================================ */

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
  priceLabel?: string;
  unit?: string;
  note?: string;
  badge?: string;
  popular: boolean;
  variant: "light" | "dark";
  cta: string;
  href: string;
}
/** comparison cell: true → check · false → dash · string → text */
export type CmpCell = boolean | string;
export type CmpRow = [label: string, a: CmpCell, b: CmpCell];
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
}

export const PRICING: Record<Audience, PricingModel> = {
  owner: {
    eyebrow: "For property owners",
    title: "Own the building. Finally own the income too.",
    lead: "Every plan includes escrow rent collection, identity-verified tenants, legal agreements, fumigation, waste management and the full Newcondo platform. Elite adds the features that make it pay for itself.",
    billing: true,
    plans: [
      { id: "essential", name: "Essential", tagline: "Landlords with 1–2 properties", monthly: 7500, popular: false, variant: "light", cta: "Start with Essential", href: "/onboarding" },
      { id: "elite", name: "Elite", tagline: "3+ properties · diaspora owners · serious investors", monthly: 18500, popular: true, variant: "dark", cta: "Start with Elite", href: "/onboarding" },
    ],
    groups: [
      { name: "Listings & marking", rows: [
        ["Active property listings", "Up to 2", "Unlimited"],
        ["GPS property marking", true, true],
        ["Professional photography", "First listing free", "First listing free"],
        ["Priority marking agents", false, true],
        ["Free re-listing when a tenant vacates", false, true],
      ]},
      { name: "Rent & payments", rows: [
        ["Escrow rent collection", true, true],
        ["Platform commission on rents", "20%", "15%"],
        ["Dedicated virtual account", true, true],
        ["Automatic payout scheduling", true, true],
        ["Rent default insurance — 1 month covered", false, true],
      ]},
      { name: "Tenants & legal", rows: [
        ["Identity-verified tenants only", true, true],
        ["Auto-generated tenancy agreements", true, true],
        ["Tenant blacklist access", true, true],
        ["Move-in / move-out inspection reports", true, true],
      ]},
      { name: "Property care", rows: [
        ["Annual fumigation", "1× per year", "2× per year"],
        ["Monthly waste management", true, true],
        ["24-hour emergency maintenance", false, true],
      ]},
      { name: "Intelligence & support", rows: [
        ["Rent pricing intelligence — quarterly", true, true],
        ["Annual rental income statement", true, true],
        ["Owner dashboard & activity logs", true, true],
        ["Annual property valuation report", false, true],
        ["Dedicated account manager", false, true],
      ]},
    ],
    footnote: {
      icon: "calculator", title: "Why Elite pays for itself",
      body: "On Elite, commission drops from 20% to 15%. Collect ₦200,000/month in rent and that 5% saves you <strong>₦10,000 every month</strong> — more than half the subscription. You're essentially paying ₦8,500/month for an account manager, rent default insurance, emergency maintenance and unlimited listings. Most Elite subscribers are cash-positive from the commission saving alone.",
      tag: "Pay annually and get 2 months free on either plan.",
    },
  },
  agent: {
    eyebrow: "For agents",
    title: "Your commission, locked in before a kobo reaches the landlord.",
    lead: "Every agent on Newcondo is a paying, verified agent — which keeps listing quality high and noise low. Both tiers collect commission through the platform. Premium unlocks the income streams that pay for themselves.",
    billing: true,
    plans: [
      { id: "essential", name: "Essential", tagline: "Agents getting started — up to 5 active listings", monthly: 2000, popular: false, variant: "light", cta: "Join as an agent", href: "/onboarding" },
      { id: "premium", name: "Premium", tagline: "Full-time agents who want every income stream", badge: "Founding: free for life", monthly: 3500, popular: true, variant: "dark", cta: "Claim founding spot", href: "/onboarding" },
    ],
    groups: [
      { name: "Listings", rows: [
        ["Active property listings", "Up to 5", "Unlimited"],
        ["GPS property marking", true, true],
        ["Verified agent badge", "Standard", "Verified Premium"],
        ["Priority listing placement in search", false, true],
      ]},
      { name: "Earnings", rows: [
        ["Commission collection through platform", true, true],
        ["Listing-agent commission (50% of platform fee)", true, true],
        ["Marking job queue access", false, "₦5,000–₦10,000 / job"],
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
      icon: "trending-up", title: "Premium pays for itself",
      body: "One marking job (₦5,000–₦10,000) covers two to three months of Premium. One commission on a ₦400,000/year rental pays for years. The subscription isn't a cost — <strong>your first deal covers it permanently.</strong>",
      tag: "First 100 founding agents get Premium free for life.",
    },
  },
  renter: {
    eyebrow: "For renters",
    title: "Find a home in Nigeria without getting burnt.",
    lead: "Verified listings. Zero double-booking. No hidden agent fees. Premium is free for the first 300 renters — try the whole platform before you decide anything.",
    billing: false,
    plans: [
      { id: "free", name: "Free", tagline: "Browse and search verified listings", priceLabel: "Free", unit: "", note: "No card required", popular: false, variant: "light", cta: "Create free account", href: "/onboarding" },
      { id: "premium", name: "Premium", tagline: "The full protection stack", badge: "247 of 300 claimed", priceLabel: "Free", unit: "", note: "for the first 300 renters · then paid", popular: true, variant: "dark", cta: "Claim free Premium", href: "/onboarding" },
    ],
    groups: [
      { name: "Search & discovery", rows: [
        ["Browse & search verified listings", true, true],
        ["Filter, save & compare properties", true, true],
        ["Remote property discovery (room photos)", true, true],
        ["Verified-listings-only view", false, true],
      ]},
      { name: "Payments & protection", rows: [
        ["Secure platform payment", true, true],
        ["No exploitative agent fees", true, true],
        ["24-hour confirmation & refund window", false, true],
        ["Anti-double-booking lock", false, true],
      ]},
      { name: "Account & rewards", rows: [
        ["Virtual wallet & transaction history", false, true],
        ["Premium profile badge", false, true],
        ["Priority customer support", false, true],
        ["Referral bonus credits", false, true],
      ]},
    ],
    footnote: {
      icon: "shield-check", title: "Why Premium is free right now",
      body: "We're giving Premium to the first 300 renters so you can experience verified listings, the refund window and the double-booking lock <strong>before you spend a naira.</strong> After the first 300, Premium becomes a paid plan.",
      tag: "No card required. Takes 2 minutes to claim your spot.",
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
      { n: "01", variant: "teal", label: "Create account", anim: "Create your account", title: "Sign up free in two minutes", text: "Create your account with your email or phone and choose renter. No card required. Premium is free for the first 300 renters." },
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
        { icon: "umbrella", title: "Rent default insurance (Elite)", body: "If a verified tenant stops paying and won't vacate, Newcondo covers one full month of lost rent while the dispute is resolved. No other platform in Nigeria offers this." },
      ]},
      { name: "Tenants & legal", sub: "Know exactly who you're handing your keys to.", items: [
        { icon: "badge-check", title: "Identity-verified tenants only", body: "Every renter submits NIN, BVN, passport or driver's licence before they can pay. You'll never unknowingly hand your keys to an anonymous stranger again." },
        { icon: "scroll-text", title: "Auto-generated tenancy agreements", body: "The moment payment clears, a legally structured tenancy agreement is generated, signed digitally by both parties, and stored permanently — retrievable anytime, including in court." },
        { icon: "user-x", title: "Tenant blacklist access", body: "Before accepting a tenant, check their Newcondo history: evictions, defaults, reported damage and disputes. The database grows with every landlord on the platform." },
        { icon: "clipboard-check", title: "Move-in & move-out inspection reports", body: "When a tenant vacates, Newcondo documents an inspection with photos comparing condition. If there's damage, you have evidence — no more “that crack was already there.”" },
      ]},
      { name: "Property care", sub: "The chores that lose you tenants — handled on a schedule.", items: [
        { icon: "bug", title: "Scheduled fumigation", body: "Professional fumigation coordinated by Newcondo — once a year on Essential, twice on Elite. No contractors to call, nothing to remember." },
        { icon: "trash-2", title: "Monthly waste management", body: "Waste collection for your compound, coordinated and tracked every month. No compound disputes, no LAWMA fines, no refuse sitting for three weeks." },
        { icon: "wrench", title: "24-hour emergency maintenance (Elite)", body: "Burst pipe, electrical fault, broken gate — the tenant raises it in the app and Newcondo dispatches a vetted contractor within 24 hours. You approve the quote from your phone." },
      ]},
      { name: "Intelligence & support", sub: "Run your property like the asset it is.", items: [
        { icon: "trending-up", title: "Rent pricing intelligence", body: "A quarterly report on what comparable properties on your street and LGA are actually renting for today — so you stop leaving money on the table." },
        { icon: "file-text", title: "Annual rental income statement", body: "A formatted, signed statement of all rent collected through Newcondo in the year — for tax, loans, mortgages and proof of income. Most landlords can't prove this. Now you can." },
        { icon: "camera", title: "Professional photography", body: "Newcondo sends a photographer before your listing goes live (first listing free). Better photos mean faster tenants and less vacancy." },
        { icon: "headphones", title: "Dedicated account manager (Elite)", body: "A named Newcondo staff member handles your account with monthly performance updates and agent coordination on your behalf — built for diaspora owners especially." },
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
