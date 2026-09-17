/* ============================================================
   Content — single source of truth for the landing page.

   PRICES, COMMISSION RATES AND SERVICE LEVELS ARE NOT DEFINED HERE.
   They live in backend/shared/src/constants/subscriptionPlans.ts and reach
   this app through @/lib/constants/business. This file holds the persuasive
   copy around them. Where a number appears in prose below it is derived, or
   it is a number this file legitimately owns (marking fees, rent examples).

   Owner tiers, for reference while editing copy:
     Essential  ₦10,500/property/mo   1× fumigation/yr, no inspection, 20%
     Plus       ₦12,500/property/mo   + 1× inspection report/yr,       20%
     Premium    ₦18,250/property/mo   2× fumigation, 2× inspections,   15%
   Only Premium reduces commission. Plus's value is the inspection report.
   The number of properties per account is unlimited; the 3-plot cap is on
   the size of a single property.
   ============================================================ */

import {
  SUBSCRIPTION_PLANS as P,
  MAX_PLOTS_SELF_SERVE,
  formatNaira,
  formatRate,
  type SubscriptionPlanCode,
} from "@/lib/constants/business";

export type Problem = [n: string, title: string, body: string];

export const PROBLEMS: Problem[] = [
  ["01", "The disappearing agent", "Your agent collected 6 months' rent from the new tenant. You found out when the tenant called to complain about a leaking roof. The agent isn't picking up."],
  ["02", "The double booking", "Two families showed up with receipts on the same Saturday. Both paid different agents. One had already moved furniture in. You spent the afternoon begging a stranger to leave your own building."],
  ["03", "The tenant from hell", "You didn't know they had three previous evictions when you handed them the keys. There was no record. No platform tracks this. Now you're three months in with no rent and a property you can't enter."],
  ["04", "Managing from abroad", "You live in London. Your property is in Lekki. Your \u201Cproperty manager\u201D calls when something breaks and goes quiet when rent is due. No dashboard, no record, no visibility. Just trust \u2014 and trust isn't a system."],
  ["05", "The pest problem that costs you a tenant", "Your tenant leaves because of cockroaches. You lose three months of rent finding a replacement. A \u20A615,000 fumigation would have prevented it. Nobody ever scheduled it."],
  ["06", "No paper, no protection", "Your tenancy agreement was handwritten in 2019 and witnessed by a neighbour. It won't hold up anywhere. The tenant knows this, and so do you."],
];

export type StepVariant = "coral" | "lilac" | "teal" | "sunset";
export interface Step {
  n: string;
  variant: StepVariant;
  anim: string;
  label: string;
  title: string;
  text: string;
}

export const STEPS: Step[] = [
  { n: "01", variant: "coral", anim: "List & verify", label: "List & verify",
    title: "Your property goes live — verified, marked, and protected",
    text: "List with full GPS boundary marking on the map. Your ownership is documented and no other landlord can claim your building. Verified listings attract serious, identity-checked renters." },
  { n: "02", variant: "lilac", anim: "Tenants find you", label: "Tenants find you",
    title: "Agents promote your property — you control everything",
    text: "Registered agents promote your listing at no cost to you. Their activity is tracked. You see who's promoting, how many views each drives, and which agent's link brought the paying tenant." },
  { n: "03", variant: "teal", anim: "Rent in escrow", label: "Rent is collected — safely",
    title: "Money goes into escrow. Agents cannot touch it.",
    text: "When a tenant pays, rent is held in a secure virtual account — not with an agent, not in anyone's personal account. Released directly to your bank after the confirmation window. Every naira tracked." },
  { n: "04", variant: "sunset", anim: "We handle the rest", label: "We handle the rest",
    title: "Fumigation. Waste. Maintenance. Legal documents. All coordinated.",
    text: "Fumigation scheduled, waste collected, tenancy agreement generated and stored. Maintenance issues come through the app — not your phone at midnight. You approve repairs from your dashboard." },
];

/** [feature, oldWay, newWay(html)] */
export type CmpRow = [feature: string, oldWay: string, newWay: string];

export const CMP_ROWS: CmpRow[] = [
  ["Rent collection", "Paid to an agent in cash. You receive what's left — if anything.", "Collected by <strong>escrow</strong>. Released directly to your account. Agents cannot intercept it."],
  ["Tenant screening", "\u201CThey seemed okay.\u201D No ID check, no rental history, no verification.", "Every tenant submits <strong>NIN, BVN, or government ID</strong> before paying. Rental history visible."],
  ["Tenancy agreement", "Handwritten or a template from Google. Legally unenforceable.", "Auto-generated, digitally signed, <strong>stored permanently</strong>. Legally structured and retrievable."],
  ["Property maintenance", "Tenant calls your personal number. You argue about who pays. Nothing gets fixed.", `Raised in the app. You approve a vetted quote. <strong>Fixed within 24 hours</strong> (${P.OWNER_PREMIUM.name}).`],
  ["Fumigation", "Whenever you remember — or when a tenant complains and threatens to leave.", "<strong>Scheduled automatically.</strong> Exterior fumigation of the compound, handled by Newcondo. You don't lift a finger."],
  ["Waste management", "Tenants argue about who called LAWMA. The compound becomes a mess.", "<strong>Coordinated monthly</strong> and tracked. Your compound is clean on a schedule."],
  ["Double booking", "Multiple agents marketing the same flat. Two families on moving day.", "GPS-marked property. One listing, one record. <strong>Impossible to double-book.</strong>"],
  ["Visibility if abroad", "Phone calls, prayer, and hoping your cousin checks on the property.", "<strong>Full dashboard.</strong> Payment history, tenant & agent activity — anywhere in the world."],
  ["Property condition on handover", "A tenant moves out, you find the damage later, and it's your word against theirs.", `<strong>Move-in / move-out inspection reports</strong> with photos, filed to your dashboard. Once a year on ${P.OWNER_PLUS.name}, twice on ${P.OWNER_PREMIUM.name}.`],
  ["Tenant disputes", "He said, she said. No record of move-in condition. You absorb the loss.", "Documented inspection evidence instead of an argument. <strong>Photos, dated, stored.</strong>"],
  ["Problem-tenant history", "No record exists. You find out after they've moved in.", "<strong>Tenant blacklist access.</strong> Check any renter's history before accepting them."],
];

/** [lucideIconName, title, body, tier]
 *
 *  ⚠️ The 4th field WAS a boolean (`isElite`). It is now a three-way union,
 *  because there are three tiers and some features start at Plus. Every value
 *  is a non-empty string, so **every value is truthy** — an old
 *  `elite ? … : …` check now badges every feature. Render through TIER_LABEL. */
export type FeatureTier = "all" | "plus" | "premium";
export type Feature = [icon: string, title: string, body: string, tier: FeatureTier];

/** null → no badge; the feature is on every tier. */
export const TIER_LABEL: Record<FeatureTier, string | null> = {
  all: null,
  plus: `${P.OWNER_PLUS.name} & ${P.OWNER_PREMIUM.name}`,
  premium: `${P.OWNER_PREMIUM.name} only`,
};

export const FEATURES: Feature[] = [
  ["shield-check", "Escrow rent collection", "Rent is collected and held by Newcondo, then released directly to your bank. Your agents coordinate tenants — they never hold money.", "all"],
  ["badge-check", "Identity-verified tenants only", "Every renter submits NIN, BVN, passport or licence before they can pay. You'll never hand your keys to an anonymous stranger again.", "all"],
  ["scroll-text", "Auto-generated tenancy agreements", "The moment payment clears, a legally structured agreement is generated, signed digitally, and stored permanently — retrievable anytime, including in court.", "all"],
  ["bug", "Scheduled fumigation — included", `Professional exterior fumigation of the compound, coordinated by Newcondo. Once a year on ${P.OWNER_ESSENTIAL.name} and ${P.OWNER_PLUS.name}, twice on ${P.OWNER_PREMIUM.name}. No contractors to call. No forgetting.`, "all"],
  ["trash-2", "Monthly waste management", "Bins emptied every month for your compound, arranged and paid for by Newcondo. No compound disputes, no LAWMA fines, no refuse sitting for three weeks.", "all"],
  ["trending-up", "Rent pricing intelligence", "A quarterly report on what similar properties on your street or LGA actually rent for today. Most landlords haven't raised rent in five years.", "all"],
  ["user-x", "Tenant blacklist access", "Before accepting a tenant, check their Newcondo history: evictions, defaults, reported damage, disputes. It grows with every landlord on the platform.", "all"],
  ["file-text", "Annual rental income statement", "A formatted, signed statement of all rent collected in the year — for tax, loans, mortgages, and proof of income. Most landlords can't prove this. Now you can.", "all"],
  ["camera", "Professional photography — first free", "Newcondo sends a photographer before your listing goes live. Better photos mean faster tenants and less vacancy. Polished from day one.", "all"],
  ["layers", "One account, many properties — mixed tiers", `List as many properties as you own. Each one carries its own service tier and its own bill, so the flat you live in can sit on ${P.OWNER_ESSENTIAL.name} while the one you rent out from abroad sits on ${P.OWNER_PREMIUM.name}.`, "all"],
  ["clipboard-check", "Move-in / move-out inspection reports", `When a tenant moves in or out, a Newcondo inspector documents the property's condition with photos and files a report to your dashboard — so a damage dispute is a document, not an argument. Once a year on ${P.OWNER_PLUS.name}, twice on ${P.OWNER_PREMIUM.name}.`, "plus"],
  ["umbrella", "Rent default insurance", "If a verified tenant stops paying and won't vacate, Newcondo covers one full month of lost rent while the dispute is resolved. No other platform offers this.", "premium"],
  ["headphones", "Dedicated account manager", "A named Newcondo staff member handles your account — monthly performance updates and agent coordination on your behalf. For diaspora owners, this is everything.", "premium"],
  ["wrench", "24-hour emergency maintenance", "Burst pipe, electrical fault, broken gate — the tenant raises it in the app, Newcondo dispatches a vetted contractor within 24 hours. You approve from your phone.", "premium"],
];

export interface Testimonial {
  id: string;
  place: string;
  ph: string;
  quote: string;
  by: string;
}

export const TESTIMONIALS: Testimonial[] = [
  { id: "po-tst-1", place: "Port Harcourt", ph: "Landlord · Port Harcourt",
    quote: "\u201CThe first month I used Newcondo, I got paid directly into my account without calling anyone. I didn't know that was possible.\u201D",
    by: "Property owner · 3 units" },
  { id: "po-tst-2", place: "Lagos · based in Canada", ph: "Diaspora landlord · Lagos",
    quote: "\u201CNow I have a dashboard, a monthly call from my account manager, and I can see every payment. That peace of mind alone is worth the subscription.\u201D",
    by: "Diaspora landlord · 2 properties" },
  { id: "po-tst-3", place: "Abuja", ph: "Property investor · Abuja",
    quote: "\u201CThe tenant blacklist stopped me from a very expensive mistake. The person had two evictions on their history. I never would have known.\u201D",
    by: "Property investor · 5 units" },
];

/* ---------- owner plan copy ----------
   ⚠️ BREAKING SHAPE CHANGE: PLAN_ESSENTIAL / PLAN_ELITE were `string[]`.
   They are now `PlanCopy` objects keyed to a plan code, plus a `PLANS` array.
   components/sections/pricing.tsx looks copy up by code.

   The service-level lines here MUST stay in step with fumigationsPerYear /
   inspectionsPerYear in subscriptionPlans.ts — that file is the authority and
   the comparison tables render from it, so a mismatch shows up as the landing
   page contradicting the pricing page. */
export interface PlanCopy {
  code: SubscriptionPlanCode;
  features: string[];
}

export const PLAN_ESSENTIAL: PlanCopy = {
  code: "OWNER_ESSENTIAL",
  features: [
    "Unlimited property listings",
    "1× exterior fumigation per year",
    "Monthly waste management",
    "Escrow rent collection",
    "Identity-verified tenants",
    "Auto-generated tenancy agreements",
    "Professional photography (first listing)",
    "Tenant blacklist access",
    "Annual income statement",
    "Rent pricing intelligence (quarterly)",
    `${formatRate(P.OWNER_ESSENTIAL.commissionRate)} platform commission on rents`,
  ],
};

export const PLAN_PLUS: PlanCopy = {
  code: "OWNER_PLUS",
  features: [
    `Everything in ${P.OWNER_ESSENTIAL.name}, plus:`,
    "1× move-in / move-out inspection report per year",
    "Photo-documented condition at every tenant handover",
    "Priority marking agents",
    "Free re-listing every time a tenant vacates",
    `${formatRate(P.OWNER_PLUS.commissionRate)} platform commission on rents`,
  ],
};

export const PLAN_PREMIUM: PlanCopy = {
  code: "OWNER_PREMIUM",
  features: [
    `Everything in ${P.OWNER_PLUS.name}, plus:`,
    "2× exterior fumigation per year",
    "2× move-in / move-out inspection reports per year",
    `Reduced commission — ${formatRate(P.OWNER_PREMIUM.commissionRate)} instead of ${formatRate(P.OWNER_ESSENTIAL.commissionRate)}`,
    "Emergency maintenance within 24 hours",
    "Dedicated account manager (named, human)",
    "Rent default insurance — 1 full month covered",
    "Annual property valuation report",
  ],
};

/** Display order matches OWNER_TIER_ORDER. */
export const PLANS: PlanCopy[] = [PLAN_ESSENTIAL, PLAN_PLUS, PLAN_PREMIUM];

export type Faq = [question: string, answer: string];

export const FAQS: Faq[] = [
  ["What happens to my rent? Is it safe?", "Your rent is collected by Newcondo and held in a registered escrow account — not in anyone's personal account, not with your agent. After the tenant's 24-hour confirmation window, it's released directly to your linked bank account. Your agent coordinates the tenant. They never hold money."],
  ["Do I have to leave my current agent?", "No. Your agent can still manage viewings and tenant relationships. What changes is how rent is collected — through Newcondo's secure system, not directly through the agent. This actually protects your agent too, because there's no longer any suspicion about money."],
  ["I only have one property. Is it worth it?", `Yes — especially on ${P.OWNER_ESSENTIAL.name}. A single \u20A6100,000/month flat means you're trusting \u20A61.2 million a year to an informal system. The escrow protection alone — before fumigation, waste management or the legal paperwork — is worth more than the ${formatNaira(P.OWNER_ESSENTIAL.amountNaira)} monthly subscription many times over. And because pricing is per property, one property means one subscription.`],
  ["I have four properties. Do I pay four times?", `Yes — pricing is per property, per month, because the cost is per property: each compound gets its own fumigation, its own waste collection and its own inspection schedule. There's no limit on how many properties you can list, and you choose the tier for each one separately — so the flat you live in yourself can sit on ${P.OWNER_ESSENTIAL.name} while the one you rent out from abroad sits on ${P.OWNER_PREMIUM.name}. Your bill is simply the sum.`],
  ["My property is bigger than 3 plots.", `Then it needs a quote rather than a plan. ${P.OWNER_ESSENTIAL.name}, ${P.OWNER_PLUS.name} and ${P.OWNER_PREMIUM.name} are priced for a property of up to ${MAX_PLOTS_SELF_SERVE} plots — one to three buildings inside one fence, one owner — because that's the size our fumigation and waste-management partner pricing is built around. Note this is a limit on the size of a single property, not on how many you can have: ten separate 2-plot properties are all standard self-serve. Larger properties and estates are priced on the same underlying cost model, scaled to size — talk to sales and we'll quote it once, then it bills automatically like any other plan.`],
  ["What's the difference between Plus and Essential?", `The inspection report. On ${P.OWNER_PLUS.name}, a Newcondo inspector documents your property's condition with photos when a tenant moves in and when they move out, and files it to your dashboard. That's the difference between a damage dispute being a document and being an argument. Commission is the same ${formatRate(P.OWNER_PLUS.commissionRate)} on both tiers — only ${P.OWNER_PREMIUM.name} reduces it, to ${formatRate(P.OWNER_PREMIUM.commissionRate)}.`],
  ["I live abroad. How does this work for me?", `Newcondo was partly designed for exactly this. Your dashboard is accessible from anywhere. On ${P.OWNER_PREMIUM.name}, your dedicated account manager calls you monthly and handles local coordination, inspection reports document the property's real condition with photos at every handover, and your rent lands in your Nigerian account. You don't need a \u201Ctrusted person\u201D — you have a system.`],
  ["What's the commission for?", `Newcondo takes ${formatRate(P.OWNER_ESSENTIAL.commissionRate)} of rent collected — ${formatRate(P.OWNER_PREMIUM.commissionRate)} on ${P.OWNER_PREMIUM.name} — as a platform fee, covering escrow operations, agent payouts, verification, and platform maintenance. This replaces whatever informal arrangement you have now, except it's transparent, documented, and your share is guaranteed to arrive.`],
  ["Can I cancel?", "Yes. Cancel anytime — there's no lock-in, and you can cancel one property's plan without touching the others. Listings remain visible until the end of the paid period, after which they're archived. Your documents, tenancy agreements, and payment history stay in your account."],
  ["What is the marking feature?", "Before a property can be listed, it must be GPS-marked on the map. You tap your property — we record the exact coordinates and building boundaries — so no one else can list it. It's the verification layer that prevents duplicate or fraudulent listings. Can't mark it yourself? Newcondo can send a verified agent for a one-time fee."],
];

export const FOOTER: Record<string, string[]> = {
  //TODO: uncomment when agents page is readys
  // PRODUCT: ["How it works", "Features", "Pricing", "For Agents", "For Renters"],
  PRODUCT: ["How it works", "Features", "Pricing", "For Agents", "For Renters"],
  COMPANY: ["About", "Blog", "Support", "Careers", "Contact"],
  LEGAL: ["Privacy Policy", "Refund Policy", "Terms of Service", "Trust & Safety", "Cookie Policy", "Data Handling"],
};

export type NavLink = [label: string, href: string];

export const NAV_LINKS: NavLink[] = [
  ["How it works", "/how-it-works"],
  ["Features", "/features"],
  ["Pricing", "/pricing"],
  // ["Blog", "/blog"],
  // ["For Agents", "/features?type=agent"],
  // ["For Renters", "/features?type=renter"],
];
