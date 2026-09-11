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
  { id: "chargebacks", n: "06", label: "Chargebacks" },
  { id: "force-majeure", n: "07", label: "Force majeure" },
  { id: "fraud", n: "08", label: "Fraudulent disputes" },
  { id: "arbitration", n: "09", label: "Dispute resolution" },
  { id: "updates", n: "10", label: "Policy updates" },
  { id: "contact", n: "11", label: "Contact & legal" },
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
  ["Enquiry acknowledgement", "1 business day", "Email or in-app"],
  ["Standard refund", "3–5 business days", "Original payment method"],
  ["Force majeure refund", "7–10 business days", "Original payment method"],
];

/* ---- 06 Chargeback process ---- */
export const CHARGEBACK_ROWS: [stage: string, what: string][] = [
  ["Talk to us first", "Raise any payment problem with Newcondo before contacting your bank — we respond within 1 business day and can usually resolve it faster."],
  ["If you file a chargeback", "Your card issuer or payment scheme investigates and decides. Newcondo cannot overturn their decision, and their determination is final."],
  ["Owners & Agents", "Where a chargeback relates to funds already settled to you, that amount plus any related costs may be recovered by deduction or set-off from your future payouts."],
  ["Timing", "Chargebacks can be raised long after a transaction. These obligations continue to apply even after an account is closed."],
];

/* ---- 07 Fraudulent disputes & consequences ---- */
export const FRAUD_ROWS: [violation: string, consequence: string][] = [
  ["Chargeback without a claim", "Permanent account ban"],
  ["Fake force majeure evidence", "EFCC referral and permanent ban"],
  ["Account deletion to evade a dispute", "Permanent ban from the platform"],
];

/* ---- 10 Contact ----
   ⚠️ FLUTTERWAVE REQUIREMENT (cl. 6.1.15): display a support PHONE NUMBER too.
// { label: "Phone", value: "+234 ...", href: "tel:+234..." },
   ---- */
export const REFUND_CONTACT: { label: string; value: string; href?: string; mono?: boolean }[] = [
  { label: "Email", value: "info@newcondo.homes", href: "mailto:info@newcondo.homes" },
  { label: "Response time", value: "Within 1 business day" },
  { label: "Registered office", value: "6 Blessing Val Street, Umuagu Umuguma, Owerri-West, Imo State, Nigeria" },
  { label: "Registration", value: "RC8445849 (CAC)", mono: true },
];
