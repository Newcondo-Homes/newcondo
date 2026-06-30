/* ============================================================
   Terms of Service — structured content.
   Prose lives in the component; tables / repeated lists here.
   ============================================================ */

import type { TocItem, MetaChip } from "@/components/ui/legal-doc";

export const TERMS_TOC: TocItem[] = [
  { id: "acceptance", n: "01", label: "Acceptance & eligibility" },
  { id: "accounts", n: "02", label: "Registration & verification" },
  { id: "roles", n: "03", label: "Roles & responsibilities" },
  { id: "rent", n: "04", label: "Secure rent collection" },
  { id: "fees", n: "05", label: "Fees & billing" },
  { id: "acceptable-use", n: "06", label: "Acceptable use" },
  { id: "content", n: "07", label: "Listings, content & IP" },
  { id: "ai", n: "08", label: "AI & automated systems" },
  { id: "maps", n: "09", label: "Maps & location" },
  { id: "no-advice", n: "10", label: "No professional advice" },
  { id: "property", n: "11", label: "Property disclaimer" },
  { id: "fraud", n: "12", label: "Fraud & enforcement" },
  { id: "termination", n: "13", label: "Termination & suspension" },
  { id: "indemnity", n: "14", label: "Indemnification" },
  { id: "liability", n: "15", label: "Disclaimers & liability" },
  { id: "arbitration", n: "16", label: "Dispute resolution" },
  { id: "changes", n: "17", label: "Changes & contact" },
];

export const TERMS_META: MetaChip[] = [
  { icon: "calendar-check", label: "Effective", value: "22 July 2025" },
  { icon: "history", label: "Last updated", value: "June 2026" },
  { icon: "scale", label: "", value: "Arbitration \u00B7 Owerri", green: true },
  { icon: "clock", label: "", value: "~11 min read" },
];

/* ---- 03 Roles & responsibilities ---- */
export const ROLE_CARDS: { icon: string; role: string; body: string }[] = [
  { icon: "key-round", role: "Renters", body: "Provide accurate identity details, attend booked inspections, pay rent through the platform only, and honour the terms of any tenancy entered into." },
  { icon: "building-2", role: "Property Owners", body: "List only properties you lawfully own or control, upload genuine ownership documents, honour confirmed bookings, and keep listing details truthful and current." },
  { icon: "briefcase", role: "Agents", body: "Hold valid agency certification, list only with the owner's signed consent, represent properties honestly, and pass on all platform-collected funds correctly." },
];

/* ---- 04 Secure rent collection flow ---- */
export const ESCROW_STEPS: { n: string; title: string; body: string }[] = [
  { n: "1", title: "Renter pays into a secure account", body: "Rent is collected into a secure virtual account operated by our licensed, PCI-DSS-compliant payment partner — never paid to an agent in cash." },
  { n: "2", title: "Dispute window opens", body: "Funds are held for a 72-hour review window during which a cancellation or refund claim can be raised under the Refund Policy." },
  { n: "3", title: "Released to the owner", body: "Once the window closes with no valid dispute, the balance (net of platform and transaction fees) is released directly to the owner or agent's account." },
];

/* ---- 06 Prohibited conduct ---- */
export const PROHIBITED: string[] = [
  "Listing a property you do not own or lawfully control.",
  "Taking payments off-platform to evade fees, escrow protection, or verification.",
  "Uploading forged ownership documents, identity documents, or agency certificates.",
  "Impersonating another person, agency, or Newcondo itself.",
  "Posting false, misleading, or duplicate listings.",
  "Harvesting other users' data, or scraping the platform by automated means.",
  "Attempting to bypass, probe, or disrupt platform security or escrow controls.",
  "Using the platform for money laundering or any unlawful purpose.",
];

/* ---- 08 Enforcement consequences ---- */
export const ENFORCEMENT_ROWS: [breach: string, consequence: string][] = [
  ["Forged ownership or ID documents", "Immediate ban, listing removal, and EFCC referral"],
  ["Off-platform payment circumvention", "Account suspension"],
  ["Fraudulent or duplicate listings", "Delisting and permanent ban on repeat offence"],
  ["Cancelling a paid renter (Owner / Agent)", "Permanent ban and property delisting"],
];

/* ---- 12 Contact ---- */
export const TERMS_CONTACT: { label: string; value: string; href?: string; mono?: boolean }[] = [
  { label: "Email", value: "info@newcondo.homes", href: "mailto:info@newcondo.homes" },
  { label: "Registered office", value: "6 Blessing Val Street, Umuagu Umuguma, Owerri-West, Imo State, Nigeria" },
  { label: "Registration", value: "RC8445849 (CAC)", mono: true },
  { label: "Governing law", value: "Federal Republic of Nigeria \u00B7 Arbitration seated in Owerri" },
];
