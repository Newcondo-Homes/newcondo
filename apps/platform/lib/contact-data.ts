/* ============================================================
   Contact — structured content. Single source of truth for the
   company's real-world details (also reused by the footer).
   ============================================================ */

export const CONTACT = {
  email: "info@newcondo.homes",
  phoneDisplay: "+234 810 831 5350",
  phoneRaw: "+2348108315350",
  whatsapp: "2348108315350",
  addressLines: ["6 Blessing Val Street", "Umuagu Umuguma", "Owerri-West, Imo State", "Nigeria"],
  addressOneLine: "6 Blessing Val Street, Umuagu Umuguma, Owerri-West, Imo State, Nigeria",
  hours: "Monday – Friday, 9:00am – 5:00pm WAT",
};

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  CONTACT.addressOneLine
)}`;

export const CONTACT_CHANNELS: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  href: string;
  external?: boolean;
}[] = [
  {
    icon: "mail",
    label: "Email us",
    value: CONTACT.email,
    sub: "Best for most questions · we reply within 24 hours",
    href: `mailto:${CONTACT.email}`,
  },
  {
    icon: "phone",
    label: "Call us",
    value: CONTACT.phoneDisplay,
    sub: CONTACT.hours,
    href: `tel:${CONTACT.phoneRaw}`,
  },
  {
    icon: "message-circle",
    label: "Live chat",
    value: "Chat with us now",
    sub: "No sign-in needed — a real person, right here",
    href: "/chat?back=%2Fcontact",
  },
];

/** Routes a message to the right desk — shown as the subject options. */
export const CONTACT_TOPICS = [
  "General enquiry",
  "Listing a property",
  "Property marking",
  "Rent or payment issue",
  "Agent partnership",
  "Trust & Safety report",
  "Press or partnerships",
];

/** Quick redirects for people who landed here but need a specific desk. */
export const CONTACT_SHORTCUTS: { icon: string; title: string; body: string; href: string }[] = [
  {
    icon: "life-buoy",
    title: "Support centre",
    body: "Answers to the most common renter, owner, and agent questions.",
    href: "/support",
  },
  {
    icon: "shield-alert",
    title: "Report a safety issue",
    body: "Fraud, scams, or a suspicious listing — reviewed by a real person.",
    href: "/trust",
  },
  {
    icon: "credit-card",
    title: "Refunds & payments",
    body: "How escrow works, refund windows, and tracing a payment.",
    href: "/refund",
  },
];
