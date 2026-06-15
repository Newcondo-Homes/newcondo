/* ============================================================
   Support — structured content.
   ============================================================ */

export const SUPPORT_CATEGORIES: { icon: string; title: string; body: string; href: string }[] = [
  { icon: "key-round", title: "For Renters", body: "Inspections, payments, refunds, and verifying a listing before you pay.", href: "#contact" },
  { icon: "building-2", title: "For Owners", body: "Listing a property, escrow payouts, tenant verification, and your dashboard.", href: "#contact" },
  { icon: "briefcase", title: "For Agents", body: "Certification, promotion links, commission, and managing client properties.", href: "#contact" },
  { icon: "credit-card", title: "Payments & refunds", body: "How escrow works, refund windows, and resolving a payment issue.", href: "/refund" },
  { icon: "shield-check", title: "Trust & Safety", body: "Reporting a listing, spotting scams, and keeping your account secure.", href: "/trust" },
  { icon: "user-cog", title: "Account & privacy", body: "Login help, verification, data requests, and managing your details.", href: "/privacy" },
];

export const SUPPORT_FAQS: [q: string, a: string][] = [
  ["How fast will I get a response?", "We aim to respond to every support request within 24 hours, and to urgent Trust & Safety reports within 24–48 hours. Reports of fraud or safety risks are prioritised."],
  ["My rent payment is stuck or hasn't shown up.", "Rent is collected into a secure escrow account, so funds are never lost. If a payment hasn't reflected within a few minutes, contact us with your transaction reference and we'll trace it immediately."],
  ["How do I report a suspicious listing or user?", "Use the report option on any listing, profile, or message, or email our Trust & Safety team. Every report is reviewed by a real person, and we can freeze funds or listings while we investigate."],
  ["How do I request a refund?", "Submit a request from your dashboard within the refund window. Eligible rent, deposits, and commission are refundable within 48 hours of payment — full detail is in our Cancellation & Refund Policy."],
  ["Can I delete my account and data?", "Yes. You can request account closure and a data deletion from your settings. Some data is retained where the law or fraud-prevention requires it, as explained in our Privacy Policy."],
];

export const SUPPORT_CHANNELS: { icon: string; label: string; value: string; sub: string; href: string }[] = [
  { icon: "mail", label: "Email us", value: "info@newcondo.homes", sub: "Best for most questions · ~24h reply", href: "mailto:info@newcondo.homes" },
  { icon: "shield-alert", label: "Report a safety issue", value: "Trust & Safety team", sub: "Fraud, scams, or suspicious activity", href: "/trust" },
  { icon: "message-circle", label: "In-app chat", value: "Open the chat bubble", sub: "Available while you're signed in", href: "#" },
];
