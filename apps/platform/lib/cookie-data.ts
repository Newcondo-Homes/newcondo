/* ============================================================
   Cookie Policy — structured content.
   ============================================================ */

import type { TocItem, MetaChip } from "@/components/ui/legal-doc";

export const COOKIE_TOC: TocItem[] = [
  { id: "what", n: "01", label: "What cookies are" },
  { id: "why", n: "02", label: "Why we use them" },
  { id: "types", n: "03", label: "Types we use" },
  { id: "third-party", n: "04", label: "Third-party cookies" },
  { id: "manage", n: "05", label: "Managing cookies" },
  { id: "changes", n: "06", label: "Changes & contact" },
];

export const COOKIE_META: MetaChip[] = [
  { icon: "calendar-check", label: "Effective", value: "22 July 2025" },
  { icon: "history", label: "Last updated", value: "June 2026" },
  { icon: "cookie", label: "", value: "Browser-controllable", green: true },
  { icon: "clock", label: "", value: "~5 min read" },
];

/* ---- 03 Cookie categories (mirrors Privacy §05) ---- */
export const COOKIE_TYPE_ROWS: [category: string, purpose: string, duration: string][] = [
  ["Strictly necessary", "Authentication, security, fraud prevention, and load balancing. These cannot be switched off.", "Session"],
  ["Functional", "Remember your settings, saved properties, and session state.", "Up to 12 months"],
  ["Performance", "De-identified analytics on how the platform is used, so we can fix and improve it.", "Up to 24 months"],
  ["Attribution", "Track agent and sub-agent promotion links so commission is paid to the correct party.", "Up to 90 days"],
];

/* ---- 04 Third-party providers ---- */
export const COOKIE_THIRD_PARTY: [provider: string, role: string][] = [
  ["Payment processors", "PCI-DSS-compliant providers (e.g. Flutterwave) set cookies to secure checkout and prevent payment fraud."],
  ["Analytics", "De-identified usage measurement to help us understand and improve platform performance."],
  ["Verification APIs", "Government and identity verification partners may set cookies during the verification flow."],
];

/* ---- 05 How to manage, by browser ---- */
export const BROWSER_LINKS: string[] = [
  "Chrome — Settings → Privacy and security → Cookies and other site data.",
  "Safari — Preferences → Privacy → Manage Website Data.",
  "Firefox — Settings → Privacy & Security → Cookies and Site Data.",
  "Edge — Settings → Cookies and site permissions → Manage and delete cookies.",
];

export const COOKIE_CONTACT: { label: string; value: string; href?: string; mono?: boolean }[] = [
  { label: "Email", value: "info@newcondo.homes", href: "mailto:info@newcondo.homes" },
  { label: "Registered office", value: "6 Blessing Val Street, Umuagu Umuguma, Owerri-West, Imo State, Nigeria" },
  { label: "Related policy", value: "See our Privacy Policy for full data detail" },
  { label: "Registration", value: "RC8445849 (CAC)", mono: true },
];
