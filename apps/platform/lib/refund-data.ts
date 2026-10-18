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
  { icon: "history", label: "Last updated", value: "10 October 2026" },
  { icon: "shield-check", label: "", value: "NDPA 2023 compliant", green: true },
  { icon: "clock", label: "", value: "~8 min read" },
];

/* ---- 02 Non-refundable fees ---- */
export const NON_REFUNDABLE: { who: string; title: string; body: string }[] = [
  { who: "Owners / Agents / Renters", title: "Subscription fees", body: "Every subscription charge — first payment and each renewal, monthly or annual, including Premium renter plans. Cancelling stops the next renewal; the current period is not refunded or prorated." },
  { who: "Owners", title: "Property plan fees", body: "The service plan on each property, including prorated charges when a property is added mid-period. Stopping a property's monthly service takes effect at the end of the paid period; nothing already paid is refunded." },
  { who: "Owners / Agents", title: "Marking fees", body: "Broadcast and Newcondo-managed marking service fees, once paid — including where a job is closed unconfirmed after the confirmation windows lapse." },
  { who: "Owners", title: "Vendor & service fees", body: "Fumigation, waste management, inspection, repair and other vendor services booked or charged through the platform." },
  { who: "Renters", title: "Renter service fee", body: "The Newcondo service fee charged on top of rent." },
  { who: "All users", title: "Payment processing fees", body: "The Flutterwave processing cost passed on at checkout (shown as its own line). Flutterwave does not return it on a refund." },
  { who: "All users", title: "Transfer fees", body: "The Flutterwave fee deducted from withdrawals and payouts to your bank." },
  { who: "Renters", title: "Refund cost", body: "Where rent is refunded, the cost Flutterwave charges Newcondo to reverse and send it back (see section 03)." },
  { who: "Renters", title: "Inspection fees", body: "Paid directly to Owners / Agents and non-refundable once paid." },
];

/* ---- 03 Renter refundable transactions ---- */
export const RENTER_REFUND_ROWS: [type: string, window: string, amount: string, conditions: string][] = [
  ["Rent", "Within the 24-hour confirmation window", "Rent less the refund cost", "A reasonable dispute, raised before the window closes, that Newcondo upholds after review. The rent must still be held in escrow."],
];

/* ---- 05 Resolution timelines ---- */
export const TIMELINE_ROWS: [type: string, time: string, method: string][] = [
  ["Dispute acknowledgement", "1 business day", "Email or in-app"],
  ["Dispute decision", "Within 3 business days", "Email or in-app"],
  ["Rent refund (dispute upheld)", "Initiated within 3–5 business days of the decision", "Original payment method"],
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
