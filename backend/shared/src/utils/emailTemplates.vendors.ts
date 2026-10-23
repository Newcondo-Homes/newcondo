// backend/shared/src/utils/emailTemplates.vendors.ts
// ============================================================
// Branded vendor-network emails — same shell and blocks as emailTemplates.ts
// (EmailParts), so they look identical to every other Newcondo email.
// Vendor links point at the vendors app (VENDORS.appUrl, overridable with
// VENDORS_APP_URL); owner/tenant links use dash() into the platform app.
// Export from utils/index.ts:  export * from "./emailTemplates.vendors";
// ============================================================
import { EmailParts, type EmailContent } from "./emailTemplates";
import { VENDORS } from "../constants/vendors";

const { shell, btn, kvRows, amountBlock, notice, dash, ngn } = EmailParts;
const vapp = (path: string) => `${(process.env.VENDORS_APP_URL || VENDORS.appUrl).replace(/\/$/, "")}${path}`;

export const VendorEmailTemplates = {
  welcome: (p: { name: string }): EmailContent => ({
    subject: "Welcome to the Newcondo vendor network",
    html: shell({
      preheader: "Finish verification to start receiving clients.",
      heading: `Welcome, ${p.name}`,
      intro: "Your vendor account is created. Newcondo matches you with subscribed properties in the areas you serve.",
      body:
        kvRows([["Next", "Upload your documents and verify your bank account"], ["Then", "Add your service areas"], ["Service hours", "Mon – Thu & Sat, 9:00 – 17:00"]]) +
        btn("Finish setup", vapp("/settings")),
    }),
  }),

  verified: (p: { name: string }): EmailContent => ({
    subject: "Your vendor account is verified",
    html: shell({
      preheader: "You can now be matched with properties.",
      heading: "You're verified",
      intro: `Hi ${p.name}, Newcondo has approved your documents and bank account.`,
      body: notice("New subscribed properties in your service areas will start appearing in Clients.", "success") + btn("Open dashboard", vapp("/dashboard")),
    }),
  }),

  clientAssigned: (p: { name: string; property: string; area: string; services: string; firstVisit: string }): EmailContent => ({
    subject: `New client: ${p.property}`,
    html: shell({
      preheader: `First visit ${p.firstVisit}.`,
      heading: "You have a new client",
      intro: `Hi ${p.name}, a subscribed property in ${p.area} has been assigned to you.`,
      body: kvRows([["Property", p.property], ["Services", p.services], ["First visit", p.firstVisit]]) + btn("View client", vapp("/clients")),
    }),
  }),

  visitBooked: (p: { name: string; property: string; service: string; date: string; window: string; vendor: string }): EmailContent => ({
    subject: `${p.service} booked for ${p.date}`,
    html: shell({
      preheader: `${p.vendor} · ${p.window}`,
      heading: `${p.service} is booked`,
      intro: `Hi ${p.name}, here is your next visit for ${p.property}.`,
      body:
        kvRows([["Date", p.date], ["Window", p.window], ["Provider", p.vendor]]) +
        notice("On the day, open Services in your dashboard and give the provider your visit code once the work is done. Only you, your listing agent or a tenant can create it.") +
        btn("See your services", dash("/services")),
    }),
  }),

  visitCompleted: (p: { name: string; property: string; service: string; vendor: string; photos: number }): EmailContent => ({
    subject: `${p.service} completed at ${p.property}`,
    html: shell({
      preheader: `${p.photos} photo(s) attached in your dashboard.`,
      heading: "Visit completed",
      intro: `Hi ${p.name}, ${p.vendor} finished the ${p.service.toLowerCase()} and the visit code was confirmed.`,
      body: notice("Something not right? Report it from Services within 48 hours.", "warn") + btn("View report", dash("/services")),
    }),
  }),

  payoutSent: (p: { name: string; amountNaira: number; jobs: number; bank: string }): EmailContent => ({
    subject: `${ngn(p.amountNaira)} sent to your bank`,
    html: shell({
      preheader: `${p.jobs} verified job(s).`,
      heading: "Payout sent",
      body: amountBlock("Sent to " + p.bank, ngn(p.amountNaira), "in") + kvRows([["Jobs", String(p.jobs)], ["Timing", "Usually lands within minutes"]]) + btn("See payouts", vapp("/payouts")),
    }),
  }),

  clientPaused: (p: { name: string; property: string }): EmailContent => ({
    subject: `Paused: ${p.property}`,
    html: shell({
      preheader: "No visits until the owner's plan is active again.",
      heading: "A client is paused",
      intro: `Hi ${p.name}, the owner's plan for ${p.property} is not active, so its visits are on hold. Don't go to the property — it won't be paid.`,
      body: btn("Open clients", vapp("/clients")),
    }),
  }),
};
