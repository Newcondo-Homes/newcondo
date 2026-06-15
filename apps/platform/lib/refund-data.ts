/* ============================================================
   Cancellation & Refund Policy — structured content.
   Prose lives in the component; tables / repeated lists here.
   ============================================================ */

import type { TocItem, MetaChip } from "@/components/ui/legal-doc";

export const REFUND_TOC: TocItem[] = [
  { id: "scope", n: "01", label: "Scope & binding agreement" },
  { id: "non-refundable", n: "02", label: "Non-refundable fees" },
  { id: "refundable", n: "03", label: "Refundable transactions" },
  { id: "cancellation", n: "04", label: "Cancellation protocols" },
  { id: "workflow", n: "05", label: "Refund request workflow" },
  { id: "force-majeure", n: "06", label: "Force majeure" },
  { id: "fraud", n: "07", label: "Fraudulent disputes" },
  { id: "arbitration", n: "08", label: "Dispute resolution" },
  { id: "updates", n: "09", label: "Policy updates" },
  { id: "contact", n: "10", label: "Contact & legal" },
];

export const REFUND_META: MetaChip[] = [
  { icon: "calendar-check", label: "Effective", value: "22 July 2025" },
  { icon: "history", label: "Last updated", value: "22 July 2025" },
  { icon: "shield-check", label: "", value: "NDPA 2023 compliant", green: true },
  { icon: "clock", label: "", value: "~8 min read" },
];

/* ---- 02 Non-refundable fees ---- */
export const NON_REFUNDABLE: { who: string; title: string; body: string }[] = [
  { who: "Owners / Agents", title: "Subscription fees", body: "Cover advanced tools — rent tracking, property promotion, listing highlights, and analytics." },
  { who: "All users", title: "Platform service fees", body: "Charged per transaction for platform maintenance and security." },
  { who: "All users", title: "Transaction charges", body: "Reflect the payment gateway's processing cost on each transaction." },
  { who: "Renters", title: "Inspection fees", body: "Paid directly to Owners / Agents and non-refundable once paid." },
];

/* ---- 03 Renter refundable transactions ---- */
export const RENTER_REFUND_ROWS: [type: string, window: string, amount: string, conditions: string][] = [
  ["Rent", "48h post-payment", "100%", "Excludes service & transaction fees"],
  ["Advance notice deposit", "48h post-payment", "100%", "Must be cancelled via the platform"],
  ["Commission", "48h post-payment", "100%", "Linked to the cancelled rent"],
];

/* ---- 05 Resolution timelines ---- */
export const TIMELINE_ROWS: [type: string, time: string, method: string][] = [
  ["Standard", "3–5 business days", "Original payment method"],
  ["Force majeure", "7–10 business days", "Original payment method"],
];

/* ---- 07 Fraudulent disputes & penalties ---- */
export const FRAUD_ROWS: [violation: string, consequence: string][] = [
  ["Chargeback without a claim", "<strong>\u20A6100,000</strong> fine + permanent ban"],
  ["Fake force majeure evidence", "EFCC referral + <strong>\u20A6500,000</strong> penalty"],
  ["Account deletion to evade debt", "Legal action + collections"],
];

/* ---- 10 Contact ---- */
export const REFUND_CONTACT: { label: string; value: string; href?: string; mono?: boolean }[] = [
  { label: "Email", value: "info@newcondo.homes", href: "mailto:info@newcondo.homes" },
  { label: "Registered office", value: "6 Blessing Val Street, Umuagu Umuguma, Owerri-West, Imo State, Nigeria" },
  { label: "Registration", value: "RC8445849 (CAC)", mono: true },
  { label: "Resolution venue", value: "Owerri, Imo State, Nigeria" },
];
