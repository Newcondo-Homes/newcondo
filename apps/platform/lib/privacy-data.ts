/* ============================================================
   Privacy Policy — structured content.
   Prose lives in the component; the repetitive / tabular bits
   (TOC, tables, clause cards, acknowledgments) live here.
   ============================================================ */

export type TocItem = { id: string; n: string; label: string };

export const PRIVACY_TOC: TocItem[] = [
  { id: "scope", n: "01", label: "Scope & legal terms" },
  { id: "collect", n: "02", label: "Information we collect" },
  { id: "use", n: "03", label: "How we use your information" },
  { id: "ai", n: "04", label: "AI & automated systems" },
  { id: "share", n: "05", label: "How we share information" },
  { id: "processors", n: "06", label: "Service providers & processors" },
  { id: "social-login", n: "07", label: "Facebook & social login" },
  { id: "payments", n: "08", label: "Payment & cardholder data" },
  { id: "location", n: "09", label: "Location & mapping data" },
  { id: "cookies", n: "10", label: "Cookies & tracking" },
  { id: "security", n: "11", label: "Security & breach response" },
  { id: "retention", n: "12", label: "Retention & deletion" },
  { id: "deletion", n: "13", label: "Delete your data" },
  { id: "transfers", n: "14", label: "International transfers" },
  { id: "rights", n: "15", label: "Your rights & choices" },
  { id: "authorities", n: "16", label: "Government & legal requests" },
  { id: "children", n: "17", label: "Children's privacy" },
  { id: "safeguards", n: "18", label: "Risk & safeguards" },
  { id: "governance", n: "19", label: "Governance & updates" },
  { id: "acknowledgments", n: "20", label: "Your acknowledgments" },
  { id: "contact", n: "21", label: "Contact us" },
];

export const META_CHIPS: { icon: string; label: string; value: string; green?: boolean }[] = [
  { icon: "calendar-check", label: "Effective", value: "22 July 2025" },
  { icon: "history", label: "Last reviewed", value: "June 2026" },
  { icon: "shield-check", label: "", value: "NDPA 2023 compliant", green: true },
  { icon: "clock", label: "", value: "~12 min read" },
];

/* ---- 01 Scope — binding clause cards ---- */
export const CLAUSES: { icon: string; title: string; body: string }[] = [
  { icon: "scale", title: "Binding arbitration", body: "All disputes are resolved via confidential individual arbitration under the Nigerian Arbitration and Conciliation Act. Venue: Owerri, Imo State." },
  { icon: "users-round", title: "Class action waiver", body: "You permanently waive your right to initiate or participate in any class or representative actions." },
  { icon: "shield-alert", title: "Limitation of liability", body: "Our maximum liability is capped at six months' worth of your paid platform fees, regardless of the basis for the claim." },
  { icon: "cloud-lightning", title: "Force majeure", body: "We assume no liability for data compromise or service unavailability caused by cyber warfare, terrorism, natural disasters, nationwide strikes, or advanced zero-day vulnerabilities." },
];

/* ---- 02 Collect — “nutrition label” of data categories ---- */
export const NUTRITION_ROWS: [category: string, examples: string, purpose: string][] = [
  ["Identity data", "Name, email, phone, date of birth", "Account creation"],
  ["Social login data", "Platform user ID, name, email, profile picture, access token", "Sign-in via Facebook or Google"],
  ["Verification data", "NIN, BVN, ID card, ownership documents", "Identity & ownership verification"],
  ["Financial data", "Bank account and payout details", "Payments, payouts & refunds"],
  ["Property data", "Address, GPS coordinates, boundaries / polygons", "Property verification & duplicate-listing prevention"],
  ["Property media", "Exterior, interior & compound photos, and videos", "Listings & verification"],
  ["Device data", "IP address, browser, device type", "Security & fraud prevention"],
  ["Usage data", "Platform activity, clicks, searches", "Analytics & improvement"],
  ["AI inputs", "Messages submitted to AI-powered features", "AI functionality"],
  ["Communication data", "Emails, support tickets, reports", "Customer support"],
];

/* ---- 02 Collect — data by user class ---- */
export const COLLECT_ROWS: [userClass: string, collected: string][] = [
  ["All users", "Full name, date of birth, government ID (e.g. NIN, driver's licence, passport)."],
  ["Property Owners", "Bank account details (for payouts), property documents (to prove ownership), property GPS coordinates (to prevent double-listing)."],
  ["Agents", "Agency certification, bank account details (for payouts), signed consent of the property owner (to mitigate fraudulent listing), and property GPS coordinates."],
  ["Renters", "Bank account details (for processing refunds)."],
];

/* ---- 06 Sub-processors. Keep in sync with DATA-HANDLING.md §3. ---- */
export const SUBPROCESSOR_ROWS: [name: string, role: string, location: string][] = [
  ["Vercel Inc.", "Frontend application hosting & content delivery", "United States"],
  ["Render Services, Inc.", "Backend API and database hosting", "United States"],
  ["Amazon Web Services, Inc.", "Cloud infrastructure, storage and backups", "United States"],
  ["Flutterwave Technology Solutions Limited", "Payment processing, virtual accounts, payouts and refunds", "Nigeria"],
  ["Google LLC", "Maps Platform — geocoding, mapping, property boundaries", "United States"],
  ["Meta Platforms, Inc.", "Facebook Login authentication", "United States"],
  ["OpenAI, L.L.C.", "AI-assisted support, moderation and document review", "United States"],
];

/* ---- 07 Meta Platform Data received via Facebook Login ---- */
export const META_PLATFORM_ROWS: [data: string, purpose: string][] = [
  ["Meta user ID", "Link your Facebook account to your Newcondo account"],
  ["Name", "Create and populate your Newcondo profile"],
  ["Email address", "Account creation, sign-in, and service notifications"],
  ["Profile picture", "Display your profile photo, if you choose to use it"],
  ["Access token", "Authenticate your sign-in session — stored encrypted, never shared"],
];

/* ---- 16 Standing policy for public-authority requests ---- */
export const AUTHORITY_POLICIES: { icon: string; title: string; body: string }[] = [
  { icon: "scale", title: "Legality review", body: "Every request is reviewed for legal validity, proper authority, and correct jurisdiction before any data is released. Informal requests — calls, messages, unsigned letters — are refused." },
  { icon: "shield-alert", title: "Challenging unlawful requests", body: "Requests that are overbroad, improperly issued, or unlawful are challenged or refused, with legal counsel engaged where necessary." },
  { icon: "filter", title: "Data minimisation", body: "We disclose only the minimum data strictly responsive to a valid request. Bulk or exploratory access is refused." },
  { icon: "file-text", title: "Documentation", body: "Every request is logged with the requesting authority, legal instrument, date, decision-maker, legal reasoning, and exactly what was disclosed." },
];

/* ---- 05 Cookies ---- */
export const COOKIE_ROWS: [category: string, purpose: string][] = [
  ["Strictly necessary", "Authentication, security, fraud prevention, and load balancing. These cannot be switched off."],
  ["Functional", "Remember your settings, saved properties, and session state."],
  ["Performance", "De-identified analytics on how the platform is used, so we can fix and improve it."],
  ["Attribution", "Track agent and sub-agent promotion links so commission is paid to the correct party."],
];

/* ---- 07 Retention ---- */
export const RETENTION_ROWS: [dataType: string, retention: string, after: string][] = [
  ["Government ID", "24 months", "Converted to an irreversible SHA-256 hash."],
  ["Bank details", "45 days", "Tokenized and decoupled from user identity."],
  ["Social login data", "Life of account", "Deleted within 30 days of a verified account-deletion request \u2014 in most cases within 21."],
  ["Property location", "12 months", "Generalized to a 1\u00A0km grid."],
  ["Activity logs", "12 months", "Summarized into de-identified statistical data."],
];

/* ---- 11 Safeguards ---- */
export const SAFEGUARD_ROWS: [risk: string, mitigation: string][] = [
  ["Insider threat", "Individual background checks and EFCC vetting of staff."],
  ["Third-party exploits", "Data Processing Agreements with strict breach clauses and anti-tracking provisions."],
  ["Document forgery", "Automated e-GIS validation (e.g. LASG) plus a legal affidavit on authenticity."],
  ["Fraudulent user claims", "EFCC referral under the Cybercrimes Act."],
  ["Forced data disclosure", "Legal challenge of subpoenas; users notified unless under a judicial gag order."],
];

/* ---- 13 Acknowledgments ---- */
export const ACKNOWLEDGMENTS: string[] = [
  "\u201CI accept sole legal liability for documents uploaded to the platform.\u201D",
  "\u201CI waive all class action rights permanently.\u201D",
  "\u201CI consent to individual binding arbitration in Owerri, Imo State.\u201D",
  "\u201CI understand that sensitive data is tokenized or de-identified where appropriate after processing.\u201D",
];

/* ---- 14 Contact ---- */
export const CONTACT_ITEMS: { label: string; value: string; href?: string; mono?: boolean }[] = [
  { label: "Email", value: "info@newcondo.homes", href: "mailto:info@newcondo.homes" },
  { label: "Registered office", value: "6 Blessing Val Street, Umuagu Umuguma, Owerri-West, Imo State, Nigeria" },
  { label: "Registration", value: "RC8445849 (CAC)", mono: true },
  { label: "Response time", value: "Within 30 days of a verified request" },
];
