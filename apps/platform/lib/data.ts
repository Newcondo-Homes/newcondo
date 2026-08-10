/* ============================================================
   Content — single source of truth for the landing page.
   ============================================================ */

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
  ["Property maintenance", "Tenant calls your personal number. You argue about who pays. Nothing gets fixed.", "Raised in the app. You approve a vetted quote. <strong>Fixed within 24 hours</strong> (Elite)."],
  ["Fumigation", "Whenever you remember — or when a tenant complains and threatens to leave.", "<strong>Scheduled automatically.</strong> Handled by Newcondo. You don't lift a finger."],
  ["Waste management", "Tenants argue about who called LAWMA. The compound becomes a mess.", "<strong>Coordinated monthly</strong> and tracked. Your compound is clean on a schedule."],
  ["Double booking", "Multiple agents marketing the same flat. Two families on moving day.", "GPS-marked property. One listing, one record. <strong>Impossible to double-book.</strong>"],
  ["Visibility if abroad", "Phone calls, prayer, and hoping your cousin checks on the property.", "<strong>Full dashboard.</strong> Payment history, tenant & agent activity — anywhere in the world."],
  ["Tenant disputes", "He said, she said. No record of move-in condition. You absorb the loss.", "Move-in & move-out <strong>inspection reports with photos</strong>. You have evidence."],
  ["Problem-tenant history", "No record exists. You find out after they've moved in.", "<strong>Tenant blacklist access.</strong> Check any renter's history before accepting them."],
];

/** [lucideIconName, title, body, isElite] */
export type Feature = [icon: string, title: string, body: string, elite: boolean];

export const FEATURES: Feature[] = [
  ["shield-check", "Escrow rent collection", "Rent is collected and held by Newcondo, then released directly to your bank. Your agents coordinate tenants — they never hold money.", false],
  ["badge-check", "Identity-verified tenants only", "Every renter submits NIN, BVN, passport or licence before they can pay. You'll never hand your keys to an anonymous stranger again.", false],
  ["scroll-text", "Auto-generated tenancy agreements", "The moment payment clears, a legally structured agreement is generated, signed digitally, and stored permanently — retrievable anytime, including in court.", false],
  ["bug", "Scheduled fumigation — included", "Professional fumigation, coordinated by Newcondo. Once a year on Essential, twice on Elite. No contractors to call. No forgetting.", false],
  ["trash-2", "Monthly waste management", "Waste collection for your compound, coordinated every month. No compound disputes, no LAWMA fines, no refuse sitting for three weeks.", false],
  ["trending-up", "Rent pricing intelligence", "A quarterly report on what similar properties on your street or LGA actually rent for today. Most landlords haven't raised rent in five years.", false],
  ["clipboard-check", "Tenant-exit inspection reports", "When a tenant vacates, Newcondo documents an inspection with photos comparing move-in and move-out condition. If there's damage, you have evidence.", false],
  ["user-x", "Tenant blacklist access", "Before accepting a tenant, check their Newcondo history: evictions, defaults, reported damage, disputes. It grows with every landlord on the platform.", false],
  ["file-text", "Annual rental income statement", "A formatted, signed statement of all rent collected in the year — for tax, loans, mortgages, and proof of income. Most landlords can't prove this. Now you can.", false],
  ["camera", "Professional photography — first free", "Newcondo sends a photographer before your listing goes live. Better photos mean faster tenants and less vacancy. Polished from day one.", false],
  ["umbrella", "Rent default insurance", "If a verified tenant stops paying and won't vacate, Newcondo covers one full month of lost rent while the dispute is resolved. No other platform offers this.", true],
  ["headphones", "Dedicated account manager", "A named Newcondo staff member handles your account — monthly performance updates and agent coordination on your behalf. For diaspora owners, this is everything.", true],
  ["wrench", "24-hour emergency maintenance", "Burst pipe, electrical fault, broken gate — the tenant raises it in the app, Newcondo dispatches a vetted contractor within 24 hours. You approve from your phone.", true],
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

export const PLAN_ESSENTIAL: string[] = [
  "List up to 2 properties", "Escrow rent collection", "Identity-verified tenants",
  "Auto-generated tenancy agreements", "1× annual fumigation", "Monthly waste management",
  "Professional photography (first listing)", "Tenant-exit inspection report",
  "Tenant blacklist access", "Annual income statement", "Rent pricing intelligence (quarterly)",
  "20% platform commission on rents",
];

export const PLAN_ELITE: string[] = [
  "Unlimited property listings", "2× annual fumigation", "Reduced commission — 15% instead of 20%",
  "Priority marking agents", "Emergency maintenance within 24 hours",
  "Dedicated account manager (named, human)", "Rent default insurance — 1 full month covered",
  "Annual property valuation report", "Free re-listing every time a tenant vacates",
];

export type Faq = [question: string, answer: string];

export const FAQS: Faq[] = [
  ["What happens to my rent? Is it safe?", "Your rent is collected by Newcondo and held in a registered escrow account — not in anyone's personal account, not with your agent. After the tenant's 24-hour confirmation window, it's released directly to your linked bank account. Your agent coordinates the tenant. They never hold money."],
  ["Do I have to leave my current agent?", "No. Your agent can still manage viewings and tenant relationships. What changes is how rent is collected — through Newcondo's secure system, not directly through the agent. This actually protects your agent too, because there's no longer any suspicion about money."],
  ["I only have one property. Is it worth it?", "Yes — especially on Essential. A single \u20A6100,000/month flat means you're trusting \u20A61.2 million a year to an informal system. The escrow protection alone — before any other benefit — is worth more than the subscription many times over."],
  ["I live abroad. How does this work for me?", "Newcondo was partly designed for exactly this. Your dashboard is accessible from anywhere. On Elite, your dedicated account manager calls you monthly and handles local coordination. Your rent lands in your Nigerian account. You don't need a \u201Ctrusted person\u201D — you have a system."],
  ["What's the 20% commission for?", "Newcondo takes 20% of rent collected (15% on Elite) as a platform fee — covering escrow operations, agent payouts, verification, and platform maintenance. This replaces whatever informal arrangement you have now, except it's transparent, documented, and your 80% is guaranteed to arrive."],
  ["Can I cancel?", "Yes. Cancel anytime — there's no lock-in. Your listings remain visible until the end of your paid period, after which they're archived. Your documents, tenancy agreements, and payment history stay in your account."],
  ["What is the marking feature?", "Before a property can be listed, it must be GPS-marked on the map. You tap your property — we record the exact coordinates and building boundaries — so no one else can list it. It's the verification layer that prevents duplicate or fraudulent listings. Can't mark it yourself? Newcondo can send a verified agent for a one-time fee."],
];

// TODO: do landing page for Agents and renters, and uncomment their links from here
export const FOOTER: Record<string, string[]> = {
  // PRODUCT: ["How it works", "Features", "Pricing", "For Agents", "For Renters"],
  PRODUCT: ["How it works", "Features", "Pricing"],
  COMPANY: ["About", "Blog", "Support", "Careers", "Contact"],
  LEGAL: ["Privacy Policy", "Refund Policy", "Terms of Service", "Trust & Safety", "Cookie Policy"],
};

export type NavLink = [label: string, href: string];

export const NAV_LINKS: NavLink[] = [
  ["How it works", "/how-it-works"],
  ["Features", "/features"],
  ["Pricing", "/pricing"],
  // ["For Agents", "#"],
  // ["For Renters", "#"],
];
