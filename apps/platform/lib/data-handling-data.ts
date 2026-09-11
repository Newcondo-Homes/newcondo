/* ============================================================
   Data Handling Policy — page-specific content only.

   This page exists to satisfy platform data-handling reviews
   (e.g. Meta / Facebook App Review). To prevent the two
   documents from ever contradicting each other, the
   sub-processor list, Meta platform data table, and
   authority-request policy are imported from privacy-data.ts
   (the single source of truth) rather than restated here.
   ============================================================ */

import type { TocItem, MetaChip } from "@/components/ui/legal-doc";

export const DH_TOC: TocItem[] = [
  { id: "controller", n: "01", label: "Data controller" },
  { id: "processors", n: "02", label: "Sub-processors" },
  { id: "platform-data", n: "03", label: "Social platform data" },
  { id: "minimization", n: "04", label: "Data minimization" },
  { id: "authority-requests", n: "05", label: "Government requests" },
  { id: "security", n: "06", label: "Security controls" },
  { id: "retention", n: "07", label: "Retention & deletion" },
  { id: "cardholder", n: "08", label: "Cardholder data" },
  { id: "contact", n: "09", label: "Contact" },
];

export const DH_META: MetaChip[] = [
  { icon: "calendar-check", label: "Effective", value: "June 2026" },
  { icon: "building-2", label: "Controller", value: "Newcondo Ltd" },
  { icon: "shield-check", label: "", value: "NDPA 2023 compliant", green: true },
  { icon: "clock", label: "", value: "~6 min read" },
];

/* ---- 04 Data minimization commitments ---- */
export const MINIMIZATION: string[] = [
  "We request only the permissions and data fields required for a feature to work.",
  "Social login is limited to basic profile fields (name, email, profile picture) and the platform user ID.",
  "Sub-processors receive only the minimum data needed to perform their specific task.",
  "Sensitive identifiers are hashed or tokenized once verification or payment is complete.",
  "We do not sell personal data, and we do not use platform data for unrelated advertising.",
];

/* ---- 06 Security controls ---- */
export const DH_SECURITY: string[] = [
  "Encryption in transit (TLS 1.3) and at rest (AES-256).",
  "Role-based access control, with access granted on a need-to-know basis.",
  "Periodic access reviews and automatic expiry of dormant privileges.",
  "Access and administrative action logging.",
  "Breach response: NDPC notified within 48 hours of a verified breach, affected users notified for high-risk incidents, and our payment partner notified promptly where payment data may be involved.",
];

export const DH_CONTACT: { label: string; value: string; href?: string; mono?: boolean }[] = [
  { label: "Data protection contact", value: "info@newcondo.homes", href: "mailto:info@newcondo.homes" },
  { label: "Data controller", value: "Newcondo Ltd (RC8445849), Nigeria" },
  { label: "Registered office", value: "6 Blessing Val Street, Umuagu Umuguma, Owerri-West, Imo State, Nigeria" },
  { label: "Response time", value: "Within one business day for enquiries" },
];
