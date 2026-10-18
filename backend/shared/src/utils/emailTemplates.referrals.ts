// backend/shared/src/utils/emailTemplates.referrals.ts
// ============================================================
// Branded referral emails (spec §15) — same shell, palette and blocks as
// emailTemplates.ts. That file must expose its building blocks once:
//
//   // at the bottom of backend/shared/src/utils/emailTemplates.ts
//   export const EmailParts = { shell, btn, kvRows, amountBlock, notice, dash, ngn };
//
// and utils/index.ts:  export * from "./emailTemplates.referrals";
// Copy is rendered from the numbers passed in — no naira literals here.
// ============================================================
import { EmailParts, type EmailContent } from "./emailTemplates";

const { shell, btn, kvRows, amountBlock, notice, dash, ngn } = EmailParts;

export const ReferralEmailTemplates = {
  signedUp: (p: { name: string; refereeName: string }): EmailContent => ({
    subject: `${p.refereeName} joined Newcondo with your link`,
    html: shell({
      preheader: "You earn when their first payment clears.",
      heading: `${p.refereeName} just signed up`,
      intro: `Hi ${p.name}, someone you invited created a Newcondo account.`,
      body: notice("Rewards are created when their first payment clears — not at signup. We'll email you the moment it does.") + btn("See your referrals", dash("/referrals")),
    }),
  }),

  activated: (p: { name: string; refereeName: string }): EmailContent => ({
    subject: `${p.refereeName}'s first payment cleared`,
    html: shell({
      preheader: "Your referral is now active.",
      heading: "Your referral is active",
      intro: `Hi ${p.name}, ${p.refereeName}'s first payment on Newcondo has cleared.`,
      body: notice("Any credit this earns is scheduled on your referral page with the date it becomes available.", "success") + btn("Open referrals", dash("/referrals")),
    }),
  }),

  creditAvailable: (p: { name: string; amountNaira: number; expiresOn: string }): EmailContent => ({
    subject: `${ngn(p.amountNaira)} credit added to your account`,
    html: shell({
      preheader: "It applies automatically to your next subscription charge.",
      heading: "Referral credit added",
      body:
        amountBlock("Credit available", ngn(p.amountNaira), "in") +
        kvRows([["Applies to", "Your next subscription charge"], ["Expires", p.expiresOn]]) +
        btn("View credit", dash("/referrals")),
    }),
  }),

  creditExpiring: (p: { name: string; amountNaira: number; expiresOn: string }): EmailContent => ({
    subject: `${ngn(p.amountNaira)} of credit expires on ${p.expiresOn}`,
    html: shell({
      preheader: "Use it before it lapses.",
      heading: "Your credit expires soon",
      intro: `Hi ${p.name}, unused referral credit lapses after 12 months.`,
      body: amountBlock("Expiring credit", ngn(p.amountNaira)) + notice(`It applies automatically to your next subscription charge before ${p.expiresOn}.`, "warn") + btn("Open referrals", dash("/referrals")),
    }),
  }),

  milestoneUnlocked: (p: { name: string; title: string; expiresOn: string }): EmailContent => ({
    subject: `Unlocked: ${p.title}`,
    html: shell({
      preheader: "Book it from your referral page.",
      heading: `You unlocked ${p.title.toLowerCase()}`,
      intro: `Hi ${p.name}, your referred landlords just reached a milestone.`,
      body: kvRows([["Reward", p.title], ["Use on", "One of your own properties"], ["Expires", p.expiresOn]]) + btn("Book it", dash("/referrals")),
    }),
  }),

  overridePaid: (p: { name: string; amountNaira: number; landlordFirstName: string }): EmailContent => ({
    subject: `${ngn(p.amountNaira)} founding-agent override paid`,
    html: shell({
      preheader: `From rent paid on ${p.landlordFirstName}'s property.`,
      heading: "Founding Agent Override credited",
      body:
        amountBlock("Credited to your wallet", ngn(p.amountNaira), "in") +
        kvRows([["Landlord", p.landlordFirstName], ["Source", "Rent paid through Newcondo"]]) +
        btn("Open wallet", dash("/wallet")),
    }),
  }),

  rewardVoided: (p: { name: string; amountNaira: number }): EmailContent => ({
    subject: "A referral reward was reversed",
    html: shell({
      preheader: "The payment behind it was refunded.",
      heading: "A reward was reversed",
      intro: `Hi ${p.name}, the payment that funded ${ngn(p.amountNaira)} of your referral credit was refunded, so the unused credit has been removed.`,
      body: btn("See details", dash("/referrals")),
    }),
  }),
};
