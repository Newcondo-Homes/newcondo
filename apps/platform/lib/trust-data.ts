/* ============================================================
   Trust & Safety — structured content.
   Reassurance-focused: how Newcondo keeps the marketplace safe.
   ============================================================ */

import type { TocItem, MetaChip } from "@/components/ui/legal-doc";

export const TRUST_TOC: TocItem[] = [
  { id: "commitment", n: "01", label: "Our safety commitment" },
  { id: "verification", n: "02", label: "Verified identities & owners" },
  { id: "escrow", n: "03", label: "Money held in escrow" },
  { id: "monitoring", n: "04", label: "Fraud monitoring" },
  { id: "inspections", n: "05", label: "Safe inspections" },
  { id: "reporting", n: "06", label: "Reporting & response" },
  { id: "data", n: "07", label: "Data & account security" },
  { id: "red-flags", n: "08", label: "Spotting red flags" },
  { id: "contact", n: "09", label: "Get help" },
];

export const TRUST_META: MetaChip[] = [
  { icon: "shield-check", label: "", value: "NDPA 2023 compliant", green: true },
  { icon: "lock", label: "", value: "Secure rent collection" },
  { icon: "badge-check", label: "", value: "ID-verified users" },
  { icon: "clock", label: "", value: "~7 min read" },
];

/* ---- 01 Four pillars ---- */
export const PILLARS: { icon: string; title: string; body: string }[] = [
  { icon: "badge-check", title: "Verify", body: "Every user is identity-checked, and every property is matched to genuine ownership documents before it goes live." },
  { icon: "lock", title: "Protect", body: "Rent never changes hands in cash. It is held in a secure escrow account until both sides are protected." },
  { icon: "scan-eye", title: "Monitor", body: "Automated systems watch for fraud, duplicate listings, and off-platform circumvention around the clock." },
  { icon: "life-buoy", title: "Respond", body: "A real team reviews every report, takes action on bad actors, and helps you resolve disputes fairly." },
];

/* ---- 02 What we verify ---- */
export const VERIFY_ROWS: [who: string, checked: string][] = [
  ["All users", "Government ID (NIN, driver's licence, or passport) confirmed through authorized verification APIs."],
  ["Property Owners", "Proof of ownership documents validated against government land records (e.g. e-GIS)."],
  ["Agents", "Valid agency certification and the property owner's signed consent before any listing goes live."],
];

/* ---- 04 Monitoring signals ---- */
export const MONITORING: string[] = [
  "Duplicate or cloned listings across multiple accounts.",
  "GPS coordinates that don't match the stated address.",
  "Attempts to move a conversation or payment off-platform.",
  "Unusual login, device, or payout patterns.",
  "Forged document signatures detected during verification.",
];

/* ---- 05 Inspection safety tips ---- */
export const INSPECTION_TIPS: { icon: string; title: string; body: string }[] = [
  { icon: "calendar-clock", title: "Book through the platform", body: "Schedule inspections inside Newcondo so there's a record of the appointment, the property, and who you're meeting." },
  { icon: "sun", title: "Meet in daylight", body: "Where possible, view properties during the day and let someone you trust know where you'll be and when." },
  { icon: "user-round-check", title: "Bring someone along", body: "Consider taking a friend or family member to an inspection, especially for a first viewing." },
  { icon: "wallet", title: "Never pay in cash", body: "Legitimate rent on Newcondo is always paid into escrow through the app — never handed over in cash on site." },
];

/* ---- 06 What happens when you report ---- */
export const REPORT_STEPS: { n: string; title: string; body: string }[] = [
  { n: "1", title: "You flag it", body: "Use the report option on any listing, profile, or message — or email our Trust & Safety team directly." },
  { n: "2", title: "We review", body: "Our team assesses the report, freezes funds or listings where needed, and may request supporting evidence." },
  { n: "3", title: "We act", body: "Confirmed violations lead to removal, permanent bans, and referral to the authorities where warranted." },
];

/* ---- 08 Red flags ---- */
export const RED_FLAGS: string[] = [
  "A landlord or agent who asks you to pay rent or a deposit outside the app.",
  "Pressure to pay immediately to \u201Csecure\u201D a property before an inspection.",
  "A listing priced far below the market with a reluctant or absent owner.",
  "Requests to communicate only via a personal phone number or messaging app.",
  "Anyone asking for your password, OTP, or full bank details.",
];

/* ---- 09 Contact ---- */
export const TRUST_CONTACT: { label: string; value: string; href?: string; mono?: boolean }[] = [
  { label: "Trust & Safety", value: "info@newcondo.homes", href: "mailto:info@newcondo.homes" },
  { label: "Registered office", value: "6 Blessing Val Street, Umuagu Umuguma, Owerri-West, Imo State, Nigeria" },
  { label: "Emergency", value: "In immediate danger, contact the Nigeria Police on 112 first." },
  { label: "Response time", value: "Reports reviewed within 24\u201348 hours" },
];
