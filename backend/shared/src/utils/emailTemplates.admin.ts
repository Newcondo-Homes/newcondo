// backend/shared/src/utils/emailTemplates.admin.ts
// ============================================================
// Branded admin/staff emails — same shell as every other Newcondo email.
// Exported from shared/src/index.ts (AdminEmailTemplates).
// Every staff-typed string is HTML-escaped: a reason typed in the admin
// dashboard must never inject markup into a customer's inbox.
// ============================================================
import { EmailParts, type EmailContent } from "./emailTemplates";
import { ADMIN_LIMITS, ADMIN_ROLES, type AdminRole } from "../constants/adminScopes";

const { shell, btn, kvRows, notice, dash } = EmailParts;
const aapp = (path: string) => `${(process.env.ADMIN_APP_URL || "https://admin.newcondo.homes").replace(/\/$/, "")}${path}`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export const AdminEmailTemplates = {
  staffInvite: (p: { invitedBy: string; role: AdminRole; token: string; scopeCount: number }): EmailContent => ({
    subject: "You’ve been invited to the Newcondo admin team",
    html: shell({
      preheader: `Set your password — the link expires in ${ADMIN_LIMITS.INVITE_TTL_HOURS} hours.`,
      heading: "Join the Newcondo admin team",
      intro: `${esc(p.invitedBy)} invited you as ${ADMIN_ROLES[p.role].label}.`,
      body:
        kvRows([["Role", ADMIN_ROLES[p.role].label], ["Permissions", String(p.scopeCount)], ["Link expires", `${ADMIN_LIMITS.INVITE_TTL_HOURS} hours, one use`]]) +
        btn("Set your password", aapp(`/accept-invite/${encodeURIComponent(p.token)}`)) +
        notice("Didn’t expect this? Ignore the email — nothing happens until you set a password.", "info"),
    }),
  }),

  staffActivated: (p: { name: string; email: string }): EmailContent => ({
    subject: `${p.name} joined the admin team`,
    html: shell({ preheader: "Their account is active.", heading: "New staff member active", intro: `${esc(p.name)} (${esc(p.email)}) set a password and signed in.`, body: btn("Open Staff & access", aapp("/staff")) }),
  }),

  staffFrozen: (p: { name: string; frozen: boolean }): EmailContent => ({
    subject: p.frozen ? "Your Newcondo admin access is paused" : "Your Newcondo admin access is restored",
    html: shell({
      preheader: p.frozen ? "You’ve been signed out." : "You can sign in again.",
      heading: p.frozen ? "Access paused" : "Access restored",
      intro: `Hi ${esc(p.name)}, a super admin has ${p.frozen ? "frozen" : "unfrozen"} your admin account.`,
      body: p.frozen ? notice("Contact your super admin if you think this is a mistake.", "warn") : btn("Sign in", aapp("/login")),
    }),
  }),

  /** Sent to the USER when staff start a support session on their account. */
  supportAccess: (p: { name: string; staffName: string; reason: string; minutes: number }): EmailContent => ({
    subject: "Newcondo support accessed your account",
    html: shell({
      preheader: "For your records — no action needed.",
      heading: "Support session started",
      intro: `Hi ${esc(p.name)}, ${esc(p.staffName)} from Newcondo support opened your account to help you.`,
      body: kvRows([["Reason", esc(p.reason)], ["Ends automatically", `${p.minutes} minutes`]]) +
        notice("During a support session we can’t withdraw money, make or authorise payments, change bank details, your email or password, or see your full BVN/NIN. Reply to this email if you didn’t ask for help.", "info"),
    }),
  }),

  accountSuspended: (p: { name: string; reason: string | null }): EmailContent => ({
    subject: "Your Newcondo account is on hold",
    html: shell({
      preheader: "You’ve been signed out while we review your account.",
      heading: "Account on hold",
      intro: `Hi ${esc(p.name)}, we’ve paused your account and signed you out.`,
      body: (p.reason ? notice(`<b>Reason:</b> ${esc(p.reason)}`, "warn") : "") +
        notice("Rent already held in escrow is not affected. Your public listings are hidden until the hold is lifted. Reply to this email to talk to us.", "info"),
    }),
  }),

  accountRestored: (p: { name: string }): EmailContent => ({
    subject: "Your Newcondo account is active again",
    html: shell({ preheader: "You can sign in again.", heading: "Account restored", intro: `Hi ${esc(p.name)}, the hold on your account has been lifted.`, body: btn("Open your dashboard", dash()) }),
  }),

  listingHidden: (p: { name: string; property: string; reason: string | null; hidden: boolean }): EmailContent => ({
    subject: p.hidden ? `${p.property} is hidden from Browse` : `${p.property} is back on Browse`,
    html: shell({
      preheader: p.hidden ? "Existing tenants and payments are not affected." : "Renters can find it again.",
      heading: p.hidden ? "Listing hidden" : "Listing visible again",
      intro: `Hi ${esc(p.name)}, Newcondo has ${p.hidden ? "hidden" : "restored"} ${esc(p.property)} ${p.hidden ? "from" : "on"} Browse.`,
      body: (p.reason ? notice(`<b>Reason:</b> ${esc(p.reason)}`, p.hidden ? "warn" : "info") : "") + btn("View listing", dash("/properties/my-listings")),
    }),
  }),
};
