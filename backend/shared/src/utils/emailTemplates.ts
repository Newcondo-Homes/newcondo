// backend/shared/src/utils/emailTemplates.ts
// ============================================================
// BRANDED EMAIL TEMPLATES — the ONLY place Newcondo emails are designed.
// Controllers/services NEVER build their own HTML (the old otpController
// did — that pattern is retired). Import a template + sendBrandedEmail.
//
// Design system: warm cream page (#F7F6EF), white card (16px radius,
// hairline border), ink #131313 header with the lowercase wordmark,
// pill ink CTA, mono for OTPs/amounts/references, green only as accent.
// Table-based layout + inline styles = renders in Gmail/Outlook/Apple Mail.
//
// Export from shared/src/utils/index.ts:
//   export * from "./emailTemplates"; export * from "./emailService";
// ============================================================
import { COMPANY } from "../constants/business";

export interface EmailContent { subject: string; html: string; }


const ngnDate = (d: Date) =>
  d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

/* The role-specific line about what survives. Vague reassurance is what makes a
   deletion notice feel like a lie — name the records.

   And name only the records that EXIST. Telling a renter who never rented that
   "rent receipts held by your landlord remain" is both false and alarming; the
   same for an owner with no listings. `counts` comes from the request snapshot,
   so each email describes that account and no other. */
export interface DeletionCounts {
  properties?: number;
  listingsAsAgent?: number;
  documents?: number;
  payments?: number;
  rentals?: number;
  photos?: number;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function retainedItems(role: string, c: DeletionCounts = {}): string[] {
  const out: string[] = [];
  const payments = c.payments ?? 0;
  const rentals = c.rentals ?? 0;

  if (role === "OWNER") {
    const props = c.properties ?? 0;
    if (props > 0) {
      out.push(
        `Your ${plural(props, "property", "properties")} stay in our records as closed listings with their rent and marking history, but your name, contact details, ownership documents and property photos are removed, and the address is generalized to the city.`
      );
    }
    if (rentals > 0) {
      out.push(
        `Tenancy records for the ${plural(rentals, "person", "people")} who rented from you, showing you only as a former owner.`
      );
    }
  } else if (role === "AGENT") {
    const listings = c.listingsAsAgent ?? 0;
    if (listings > 0) {
      out.push(`The ${plural(listings, "listing")} you managed stay with their owners, without your name on them.`);
    }
    out.push(
      "Marking jobs you completed and commissions you were paid remain as anonymous financial records."
    );
  } else if (rentals > 0) {
    out.push(`Rent receipts for your ${plural(rentals, "tenancy", "tenancies")}, held by your landlord, with your name removed.`);
  }

  if (payments > 0) {
    out.push(
      `Your ${plural(payments, "payment record")}, without your name attached — tax, anti-money-laundering and chargeback rules require them.`
    );
  }

  // Nothing to name: a signup that never listed, paid or rented. Say so — it is
  // the most reassuring version of this paragraph, and it is true.
  if (out.length === 0) {
    out.push(
      "You never listed, rented or paid through Newcondo, so there is no financial history to keep. Once erasure runs, all we retain is a dated record that this account was deleted."
    );
  }
  return out;
}

/** Single-sentence form, for the shorter emails. */
function retainedLine(role: string, c: DeletionCounts = {}): string {
  return retainedItems(role, c).join(" ");
}


/* ---------- palette (inlined; email clients ignore stylesheets) ---------- */
const C = {
  page: "#F7F6EF", card: "#FFFFFF", ink: "#131313", cream: "#F9F9EF",
  text: "#131313", sub: "#6E6B60", hair: "#E7E4D8", sunken: "#F1EFE6",
  green: "#008F5A", greenWash: "#E7F5EE", amber: "#8a6508", amberWash: "#FBF3DC",
  red: "#B03A2E", redWash: "#F9E9E6",
};
const FONT = `'Geist','Helvetica Neue',Helvetica,Arial,sans-serif`;
const MONO = `'Geist Mono',SFMono-Regular,Menlo,Consolas,monospace`;

/* ---------- building blocks ---------- */
const btn = (label: string, url: string) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px auto 6px"><tr><td style="border-radius:999px;background:${C.ink}"><a href="${url}" style="display:inline-block;padding:13px 30px;font-family:${FONT};font-size:14px;font-weight:600;color:${C.cream};text-decoration:none;border-radius:999px">${label}</a></td></tr></table>`;

const kvRows = (rows: [string, string][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 4px">${rows
    .map(([k, v]) => `<tr><td style="padding:9px 0;border-bottom:1px solid ${C.hair};font-family:${FONT};font-size:13px;color:${C.sub}">${k}</td><td align="right" style="padding:9px 0;border-bottom:1px solid ${C.hair};font-family:${FONT};font-size:13px;font-weight:600;color:${C.text}">${v}</td></tr>`)
    .join("")}</table>`;

const amountBlock = (label: string, amount: string, tone: "in" | "out" | "neutral" = "neutral") =>
  `<div style="text-align:center;margin:22px 0 6px"><div style="font-family:${FONT};font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${C.sub}">${label}</div><div style="font-family:${MONO};font-size:32px;font-weight:600;letter-spacing:-.02em;color:${tone === "in" ? C.green : C.ink};margin-top:6px">${amount}</div></div>`;

const otpBlock = (code: string) =>
  `<div style="text-align:center;margin:24px 0 8px"><div style="display:inline-block;background:${C.sunken};border:1px solid ${C.hair};border-radius:16px;padding:18px 34px;font-family:${MONO};font-size:34px;font-weight:600;letter-spacing:.35em;color:${C.ink}">${code}</div></div>`;

const notice = (html: string, tone: "info" | "warn" | "success" = "info") => {
  const bg = tone === "warn" ? C.amberWash : tone === "success" ? C.greenWash : C.sunken;
  const fg = tone === "warn" ? C.amber : tone === "success" ? C.green : C.sub;
  return `<div style="background:${bg};border-radius:14px;padding:14px 18px;margin:18px 0 4px;font-family:${FONT};font-size:13px;line-height:1.55;color:${fg}">${html}</div>`;
};

const ngn = (n: number) => `\u20a6${Math.abs(n).toLocaleString("en-NG")}`;

/* ---------- base shell: header wordmark · white card · footer ---------- */
function shell(opts: { preheader: string; heading: string; intro?: string; body: string; footNote?: string }): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.page}">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${opts.preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}"><tr><td align="center" style="padding:32px 16px 40px">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%">
<tr><td style="padding:0 6px 18px"><span style="font-family:${FONT};font-size:22px;font-weight:700;letter-spacing:-.04em;color:${C.ink}">${COMPANY.wordmark}</span></td></tr>
<tr><td style="background:${C.card};border:1px solid ${C.hair};border-radius:16px;padding:34px 34px 30px">
<h1 style="margin:0 0 10px;font-family:${FONT};font-size:22px;font-weight:700;letter-spacing:-.03em;line-height:1.2;color:${C.ink}">${opts.heading}</h1>
${opts.intro ? `<p style="margin:0 0 6px;font-family:${FONT};font-size:14.5px;line-height:1.6;color:${C.sub}">${opts.intro}</p>` : ""}
${opts.body}
</td></tr>
<tr><td style="padding:20px 6px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.sub}">
${opts.footNote ? `${opts.footNote}<br><br>` : ""}
Newcondo — verified rentals, escrow-protected payments.<br>
This email was sent by Newcondo (${COMPANY.domain}). Never share your OTP or password; Newcondo staff will never ask for them.<br>
<a href="https://${COMPANY.domain}" style="color:${C.sub}">Visit ${COMPANY.domain}</a> · <a href="https://${COMPANY.domain}/support" style="color:${C.sub}">Support</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

const dash = (path = "/dashboard") => `https://${COMPANY.domain}${path}`;

/* ============================================================
   TEMPLATES — one function per email type. Each returns {subject, html}.
   ============================================================ */
export const EmailTemplates = {
  /* ---- auth & security ---- */
  otp: (p: { code: string; purpose?: string; expiresMinutes?: number }): EmailContent => ({
    subject: `${p.code} is your Newcondo code`,
    html: shell({
      preheader: `Your verification code is ${p.code}`,
      heading: "Your verification code",
      intro: p.purpose ? `Use this code to ${p.purpose}.` : "Use this code to continue on Newcondo.",
      body: otpBlock(p.code) + notice(`This code expires in <b>${p.expiresMinutes ?? 10} minutes</b> and can only be used once. If you didn't request it, you can safely ignore this email.`, "warn"),
    }),
  }),

  passwordReset: (p: { name?: string; resetUrl: string }): EmailContent => ({
    subject: "Reset your Newcondo password",
    html: shell({
      preheader: "Reset your password — link expires in 30 minutes",
      heading: "Reset your password",
      intro: `${p.name ? `Hi ${p.name}, w` : "W"}e received a request to reset your password.`,
      body: btn("Choose a new password", p.resetUrl) + notice("The link expires in 30 minutes. If you didn't ask for this, ignore this email — your password stays unchanged.", "warn"),
    }),
  }),

  welcome: (p: { name: string; role: "OWNER" | "AGENT" | "RENTER" }): EmailContent => {
    const roleCopy = {
      OWNER: "List your property, get it GPS-marked, and collect rent with a 24-hour escrow window — all from one dashboard.",
      AGENT: "List for owners, promote properties with tracked links, and earn marking-job payouts near you.",
      RENTER: "Pay rent through escrow, raise documented maintenance requests, and keep your tenancy in one place.",
    }[p.role];
    return {
      subject: "Welcome to Newcondo",
      html: shell({
        preheader: "Your Newcondo account is ready",
        heading: `Welcome, ${p.name.split(" ")[0]}`,
        intro: roleCopy,
        body: btn("Open your dashboard", dash()) + notice("Next step: verify your identity (NIN or BVN) to unlock payments — it usually takes under 24 hours.", "info"),
      }),
    };
  },

  verificationSubmitted: (p: { name: string }): EmailContent => ({
    subject: "We received your verification documents",
    html: shell({
      preheader: "Verification in review — usually under 24 hours",
      heading: "Verification in review",
      intro: `Thanks ${p.name.split(" ")[0]} — your identity documents are with our review team.`,
      body: notice("Reviews usually complete within <b>24 hours</b>. We'll email you the moment there's a decision.", "info"),
    }),
  }),

  verificationApproved: (p: { name: string }): EmailContent => ({
    subject: "You're verified on Newcondo ✓",
    html: shell({
      preheader: "Identity verified — payments unlocked",
      heading: "You're verified",
      intro: `${p.name.split(" ")[0]}, your identity is confirmed. Your verified badge now shows on your listings and activity, and payments are unlocked.`,
      body: btn("Open your dashboard", dash()),
    }),
  }),

  verificationRejected: (p: { name: string; reason: string }): EmailContent => ({
    subject: "Your verification needs another look",
    html: shell({
      preheader: "We couldn't verify your documents",
      heading: "We couldn't verify your documents",
      intro: `${p.name.split(" ")[0]}, our review team couldn't approve your submission.`,
      body: notice(`<b>Reason:</b> ${p.reason}`, "warn") + btn("Re-submit documents", dash("/profile")),
    }),
  }),

  /* ---- money: rent, escrow, commission, withdrawal ---- */
  rentPaidOwner: (p: { ownerName: string; amount: number; net: number; property: string; renterName: string; escrowEndsAt: string }): EmailContent => ({
    subject: `Rent payment in escrow — ${p.property}`,
    html: shell({
      preheader: `${ngn(p.amount)} received and held in escrow`,
      heading: "Rent payment in escrow",
      intro: `${p.ownerName.split(" ")[0]}, ${p.renterName} just paid rent on ${p.property}. The money is held in your property's virtual account.`,
      body: amountBlock("Held in escrow", ngn(p.amount)) +
        kvRows([["Property", p.property], ["You receive after commission", ngn(p.net)], ["Escrow window ends", p.escrowEndsAt]]) +
        notice("The renter has 24 hours to confirm the property. If the window passes quietly, funds release to you automatically.", "info") +
        btn("View payment", dash("/payments")),
    }),
  }),

  rentReceiptRenter: (p: { renterName: string; amount: number; property: string; unit: string; reference: string }): EmailContent => ({
    subject: `Payment received — you're protected for 24 hours`,
    html: shell({
      preheader: `${ngn(p.amount)} secured in escrow`,
      heading: "Payment received — you're protected",
      intro: `${p.renterName.split(" ")[0]}, your rent payment is secured in Newcondo escrow.`,
      body: amountBlock("Paid", ngn(p.amount)) +
        kvRows([["Property", `${p.property} (${p.unit})`], ["Reference", `<span style="font-family:${MONO}">${p.reference}</span>`], ["Protection window", "24 hours"]]) +
        notice("Visit the property within 24 hours. If it doesn't match the listing, open a dispute from <b>My Rentals</b> before the window closes and the payment reverses.", "warn") +
        btn("Open My Rentals", dash("/payments")),
    }),
  }),

  escrowReleased: (p: { ownerName: string; amount: number; property: string }): EmailContent => ({
    subject: `${ngn(p.amount)} released to your wallet`,
    html: shell({
      preheader: "Escrow window closed — funds released",
      heading: "Funds released",
      intro: `${p.ownerName.split(" ")[0]}, the confirmation window on ${p.property} closed and your rent has been released.`,
      body: amountBlock("Now available", ngn(p.amount), "in") + btn("Withdraw or view wallet", dash("/wallet")),
    }),
  }),

  commissionReceived: (p: { agentName: string; amount: number; property: string; kind: "LISTING" | "SUB_AGENT" | "MARKING" }): EmailContent => {
    const label = p.kind === "LISTING" ? "Listing commission" : p.kind === "SUB_AGENT" ? "Sub-agent commission" : "Marking payout";
    return {
      subject: `${label} — ${ngn(p.amount)}`,
      html: shell({
        preheader: `${ngn(p.amount)} credited for ${p.property}`,
        heading: `${label} credited`,
        intro: `${p.agentName.split(" ")[0]}, your ${label.toLowerCase()} on ${p.property} has been credited to your Newcondo account.`,
        body: amountBlock("Credited", ngn(p.amount), "in") + btn("View commissions", dash("/payments")),
      }),
    };
  },

  withdrawalInitiated: (p: { name: string; amount: number; bank: string; reference: string }): EmailContent => ({
    subject: `Withdrawal of ${ngn(p.amount)} on its way`,
    html: shell({
      preheader: "Transfer initiated to your bank",
      heading: "Withdrawal initiated",
      intro: `${p.name.split(" ")[0]}, we've started your transfer. It usually lands within minutes.`,
      body: kvRows([["Amount", ngn(p.amount)], ["To", p.bank], ["Reference", `<span style="font-family:${MONO}">${p.reference}</span>`]]) +
        notice("Didn't request this? Contact support immediately and change your password.", "warn"),
    }),
  }),

  withdrawalSettled: (p: { name: string; amount: number; bank: string }): EmailContent => ({
    subject: `${ngn(p.amount)} delivered to ${p.bank}`,
    html: shell({
      preheader: "Your withdrawal has settled",
      heading: "Withdrawal delivered",
      intro: `${p.name.split(" ")[0]}, your money has arrived at ${p.bank}.`,
      body: amountBlock("Delivered", ngn(p.amount), "in"),
    }),
  }),

  paymentFailed: (p: { name: string; what: string; reason?: string }): EmailContent => ({
    subject: "A payment didn't go through",
    html: shell({
      preheader: `Payment failed — ${p.what}`,
      heading: "Payment failed",
      intro: `${p.name.split(" ")[0]}, your payment for ${p.what} didn't complete.${p.reason ? "" : " No money left your account."}`,
      body: (p.reason ? notice(`<b>Reason:</b> ${p.reason}`, "warn") : "") + btn("Try again", dash("/payments")),
    }),
  }),

  /* ---- subscriptions ---- */
  subscriptionActive: (p: { name: string; plan: string; price: number; renewsOn: string }): EmailContent => ({
    subject: `Your ${p.plan} plan is active`,
    html: shell({
      preheader: `${p.plan} plan active — renews ${p.renewsOn}`,
      heading: `${p.plan} plan active`,
      intro: `${p.name.split(" ")[0]}, your subscription is live. Everything in your plan is unlocked now.`,
      body: kvRows([["Plan", p.plan], ["Billing", `${ngn(p.price)}/month via Flutterwave`], ["Next renewal", p.renewsOn]]) + btn("Open your dashboard", dash()),
    }),
  }),

  subscriptionCancelled: (p: { name: string; plan: string; activeUntil: string }): EmailContent => ({
    subject: "Your subscription is set to cancel",
    html: shell({
      preheader: `Active until ${p.activeUntil}`,
      heading: "Subscription cancelled",
      intro: `${p.name.split(" ")[0]}, your ${p.plan} plan will not renew.`,
      body: notice(`You keep full access until <b>${p.activeUntil}</b>. Your listings are archived after that — documents and payment history stay in your account. You can resume anytime before then.`, "info") + btn("Resume subscription", dash("/profile")),
    }),
  }),

  subscriptionPaymentFailed: (p: { name: string; plan: string; retryOn: string }): EmailContent => ({
    subject: "We couldn't renew your subscription",
    html: shell({
      preheader: "Renewal payment failed — we'll retry",
      heading: "Renewal payment failed",
      intro: `${p.name.split(" ")[0]}, this month's charge for your ${p.plan} plan didn't go through.`,
      body: notice(`We'll retry on <b>${p.retryOn}</b>. To avoid interruption, check your card or pay manually from your profile.`, "warn") + btn("Update billing", dash("/profile")),
    }),
  }),

  /* ---- marking ---- */
  markingCompleted: (p: { ownerName: string; property: string; markerName: string; confirmBy: string }): EmailContent => ({
    subject: `Confirm the marking on ${p.property}`,
    html: shell({
      preheader: "Marking completed — 72 hours to confirm",
      heading: "Your property has been marked",
      intro: `${p.ownerName.split(" ")[0]}, ${p.markerName} marked ${p.property} and uploaded verification photos.`,
      body: notice(`Review the boundary and photos, then confirm before <b>${p.confirmBy}</b>. If the window passes, the marker's payout starts releasing automatically.`, "warn") + btn("Review & confirm", dash("/marking")),
    }),
  }),

  markingJobNearby: (p: { agentName: string; property: string; area: string; payout: number }): EmailContent => ({
    subject: `New marking job near you — ${ngn(p.payout)}`,
    html: shell({
      preheader: `${p.property} · ${p.area}`,
      heading: "New marking job nearby",
      intro: `${p.agentName.split(" ")[0]}, a job just went live near you: ${p.property}, ${p.area}. First come, first served.`,
      body: amountBlock("Payout", ngn(p.payout)) + btn("Join the queue", dash("/marking")),
    }),
  }),

  markingSlotActive: (p: { agentName: string; property: string; slotHours: number }): EmailContent => ({
    subject: "Your marking slot just started",
    html: shell({
      preheader: `${p.slotHours}-hour slot active — ${p.property}`,
      heading: "Your slot is active",
      intro: `${p.agentName.split(" ")[0]}, you're up. You have ${p.slotHours} hours to mark ${p.property}.`,
      body: btn("Open the job", dash("/marking")),
    }),
  }),

  /* ---- tenants & invites ---- */
  tenantJoined: (p: { listerName: string; tenantName: string; property: string; unit?: string }): EmailContent => ({
    subject: `${p.tenantName} joined via your invite`,
    html: shell({
      preheader: "Tenant onboarded on Newcondo",
      heading: "A tenant joined Newcondo",
      intro: `${p.listerName.split(" ")[0]}, ${p.tenantName} onboarded via your invite link${p.unit ? ` for ${p.unit}` : ""} at ${p.property}. Their tenancy now shows in your dashboard.`,
      body: btn("View tenants", dash("/properties")),
    }),
  }),

  agentInvite: (p: {
    agentName?: string;
    ownerName: string;
    inviteUrl: string;
    // Sourced from AGENT_INVITES.expiryDays by the caller. Optional +
    // defaulted so no existing call site breaks.
    expiresInDays?: number;
  }): EmailContent => {
    const days = p.expiresInDays ?? 2;
    return {
      subject: `${p.ownerName} invited you to list their property`,
      html: shell({
        preheader: "Listing invitation on Newcondo",
        heading: "You've been invited to list",
        intro: `${p.ownerName} wants you to be the listing agent for their property on Newcondo. Accepting links their property to your dashboard — rent goes to them, your commission split is automatic.`,
        body:
          btn("Accept the invitation", p.inviteUrl) +
          notice(
            `You need a Newcondo agent account to accept. The link is single-use and <b>expires in ${days} day${days === 1 ? "" : "s"}</b> — after that the owner has to send a new one.`,
            "warn"
          ),
      }),
    };
  },

  agentInviteAccepted: (p: { ownerName: string; agentName: string }): EmailContent => ({
    subject: `${p.agentName} accepted your listing invitation`,
    html: shell({
      preheader: "Your agent is connected",
      heading: "Your agent is connected",
      intro: `${p.ownerName.split(" ")[0]}, ${p.agentName} accepted your invitation and can now list on your behalf. Every listing they create shows in your dashboard, and rent always settles to your account.`,
      body: btn("Open your dashboard", dash("/properties")),
    }),
  }),

  subAgentRequest: (p: { listerName: string; subAgentName: string; property: string }): EmailContent => ({
    subject: `${p.subAgentName} wants to promote ${p.property}`,
    html: shell({
      preheader: "New sub-agent promotion request",
      heading: "Promotion request",
      intro: `${p.listerName.split(" ")[0]}, ${p.subAgentName} asked to promote ${p.property} with a tracked link. You control who promotes — review their reliability and decide.`,
      body: btn("Review request", dash()),
    }),
  }),

  promotionApproved: (p: { subAgentName: string; property: string; splitPct: number; promoUrl: string }): EmailContent => ({
    subject: `You're approved to promote ${p.property}`,
    html: shell({
      preheader: `Tracked promo link ready — ${p.splitPct}% share`,
      heading: "Promotion approved",
      intro: `${p.subAgentName.split(" ")[0]}, the lister approved your request. When a renter pays through your link, you earn <b>${p.splitPct}% of the rent</b> — the split is enforced automatically.`,
      body: notice(`Your tracked link: <a href="${p.promoUrl}" style="color:${C.green};font-family:${MONO}">${p.promoUrl.replace(/^https?:\/\//, "")}</a>`, "success") + btn("Open My Listings", dash("/properties")),
    }),
  }),

  promotionDeclined: (p: { subAgentName: string; property: string; reason?: string }): EmailContent => ({
    subject: `Promotion request declined — ${p.property}`,
    html: shell({
      preheader: "Your promotion request was declined",
      heading: "Request declined",
      intro: `${p.subAgentName.split(" ")[0]}, the lister declined your request to promote ${p.property}.${p.reason ? "" : " You can promote other live listings from Browse."}`,
      body: (p.reason ? notice(`<b>Reason:</b> ${p.reason}`, "warn") : "") + btn("Browse properties", dash("/browse")),
    }),
  }),
} as const;

export function accountDeletionScheduledEmail(o: {
  name: string;
  role: string;
  erasureDate: Date;
  graceDays: number;
  retentionMonths: number;
  confirmationCode: string;
  counts?: DeletionCounts;
}) {
  const roleWord = o.role === "OWNER" ? "property owner" : o.role === "AGENT" ? "agent" : "renter";
  const c = o.counts ?? {};

  /* What GOES — also specific. An agent has no ownership documents; a renter
     has no property photos. Listing them anyway reads as boilerplate. */
  const erasedLine = (() => {
    const base = "your name, email, phone number, date of birth, address and BVN";
    const docs = (c.documents ?? 0) > 0 ? `, and ${plural(c.documents!, "identity document")} you uploaded` : "";
    if (o.role === "OWNER" && (c.photos ?? 0) > 0)
      return `${base}${docs}, together with ${plural(c.photos!, "property photo")} and every ownership document on your listings`;
    if (o.role === "AGENT")
      return `${base}${docs}, together with your promotion links, service areas and marking availability`;
    return `${base}${docs}`;
  })();

  const kept = retainedItems(o.role, c);

  const body = `
${kvRows([
  ["Requested", ngnDate(new Date())],
  ["Account type", roleWord[0].toUpperCase() + roleWord.slice(1)],
  ["Signed out everywhere", "Now"],
  ["Permanent erasure", ngnDate(o.erasureDate)],
  ["Reference", o.confirmationCode],
])}
<p style="margin:18px 0 0;font-family:${FONT};font-size:14.5px;line-height:1.6;color:${C.sub}">
Your account is closed as of today. You're signed out on every device${
    o.role === "RENTER" ? "" : ", your listings are hidden"
  }, and your subscription will not renew.
For the next <b style="color:${C.text}">${o.graceDays} days</b> nothing is erased — sign in again and everything comes back exactly as it was.
</p>
<p style="margin:14px 0 0;font-family:${FONT};font-size:14.5px;line-height:1.6;color:${C.sub}">
On <b style="color:${C.text}">${ngnDate(o.erasureDate)}</b> we permanently erase ${erasedLine}. That step cannot be undone.
</p>
${notice(
    `<b>What stays, and why.</b><br>${kept
      .map((k) => `• ${k}`)
      .join("<br>")}${
      (c.payments ?? 0) > 0
        ? `<br><br>Those records are destroyed after ${o.retentionMonths} months, except where tax or anti-money-laundering law requires longer.`
        : ""
    }`
  )}
${btn("I didn't ask for this — restore my account", `https://${COMPANY.domain}/login?restore=1`)}
`;
  return {
    subject: `Your Newcondo account closes on ${ngnDate(o.erasureDate)}`,
    html: shell({
      preheader: `Reversible until ${ngnDate(o.erasureDate)}.`,
      heading: "Your account is scheduled for deletion",
      intro: `${o.name}, we've received your request to delete your Newcondo ${roleWord} account.`,
      body,
      footNote: `If you did not request this, sign in now to cancel it — and change your password. Questions: info@${COMPANY.domain}.`,
    }),
  };
}

export function accountDeletionReminderEmail(o: {
  name: string;
  daysLeft: number;
  erasureDate: Date;
  role: string;
  counts?: DeletionCounts;
}) {
  const unit = o.daysLeft === 1 ? "tomorrow" : `in ${o.daysLeft} days`;
  const body = `
<p style="margin:0 0 0;font-family:${FONT};font-size:14.5px;line-height:1.6;color:${C.sub}">
Your Newcondo account is erased <b style="color:${C.text}">${unit}</b>, on ${ngnDate(o.erasureDate)}.
Until then it can still be restored in full — just sign in.
</p>
${notice(`After that we can't bring anything back. ${retainedLine(o.role, o.counts)}`, "warn")}
${btn("Restore my account", `https://${COMPANY.domain}/login?restore=1`)}
`;
  return {
    subject: o.daysLeft === 1 ? "Last day to restore your Newcondo account" : `Your Newcondo account is erased in ${o.daysLeft} days`,
    html: shell({
      preheader: `Erased ${unit}. Sign in to keep it.`,
      heading: o.daysLeft === 1 ? "Last chance to restore your account" : "Your account is erased soon",
      intro: `${o.name} — this is a reminder, not a new request.`,
      body,
    }),
  };
}

export function accountDeletionCompletedEmail(o: {
  name: string;
  role: string;
  retentionMonths: number;
  purgeDate: Date;
  counts?: DeletionCounts;
}) {
  const kept = retainedItems(o.role, o.counts);
  const body = `
<p style="margin:0;font-family:${FONT};font-size:14.5px;line-height:1.6;color:${C.sub}">
We've permanently erased the personal data in your Newcondo account: your name, email address, phone number, date of birth, home address, BVN, profile photo and every identity document you uploaded. Your Facebook and Google sign-in links have been disconnected. This is the confirmation our Privacy Policy promises.
</p>
${notice(
    `<b>What we kept, and why.</b><br>${kept.map((k) => `• ${k}`).join("<br>")}<br><br>These records carry no information that identifies you, and the last of them is destroyed on ${ngnDate(o.purgeDate)} — ${o.retentionMonths} months from today — except where tax or anti-money-laundering law requires a longer period.`
  )}
<p style="margin:16px 0 0;font-family:${FONT};font-size:14.5px;line-height:1.6;color:${C.sub}">
This email address is no longer attached to any Newcondo account. You're welcome to sign up again with it whenever you like.
</p>
`;
  return {
    subject: "Your Newcondo data has been deleted",
    html: shell({
      preheader: "Erasure complete.",
      heading: "Your data has been deleted",
      intro: `${o.name}, this is confirmation that your deletion request is complete.`,
      body,
      footNote: `Questions about what was kept: info@${COMPANY.domain}. Full detail: https://${COMPANY.domain}/privacy#deletion`,
    }),
  };
}

export function accountDeletionCancelledEmail(o: { name: string }) {
  const body = `
<p style="margin:0;font-family:${FONT};font-size:14.5px;line-height:1.6;color:${C.sub}">
Your account is active again and nothing was erased. Your listings are still hidden — switch them back on from My Properties when you're ready.
</p>
${notice("If you didn't do this, someone else has access to your account. Change your password now and email us immediately.", "warn")}
${btn("Go to my dashboard", `https://${COMPANY.domain}/dashboard`)}
`;
  return {
    subject: "Your Newcondo account is active again",
    html: shell({
      preheader: "Deletion cancelled.",
      heading: "Welcome back",
      intro: `${o.name}, we've cancelled the deletion of your account.`,
      body,
    }),
  };
}

export type EmailTemplateName = keyof typeof EmailTemplates;
