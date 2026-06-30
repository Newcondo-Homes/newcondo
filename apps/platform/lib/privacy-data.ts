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
  { id: "location", n: "06", label: "Location & mapping data" },
  { id: "cookies", n: "07", label: "Cookies & tracking" },
  { id: "security", n: "08", label: "Security & breach response" },
  { id: "retention", n: "09", label: "Retention & deletion" },
  { id: "transfers", n: "10", label: "International transfers" },
  { id: "rights", n: "11", label: "Your rights & choices" },
  { id: "children", n: "12", label: "Children's privacy" },
  { id: "safeguards", n: "13", label: "Risk & safeguards" },
  { id: "governance", n: "14", label: "Governance & updates" },
  { id: "acknowledgments", n: "15", label: "Your acknowledgments" },
  { id: "contact", n: "16", label: "Contact us" },
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
