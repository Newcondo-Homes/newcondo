"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBrandedEmail = sendBrandedEmail;
exports.sendBrandedEmails = sendBrandedEmails;
// backend/shared/src/utils/emailService.ts
// ============================================================
// sendBrandedEmail — the single send entrypoint every service uses.
// Wraps the EXISTING transport in shared/src/utils/email.ts (Mailgun), so SMTP
// config stays where it is; this file only adds the branded layer.
//
// NOTE ON THE SIGNATURE: email.ts exports
//     sendEmail(template: { to, subject, html, text? })
// — a single object, NOT (to, subject, html). Calling it positionally is what
// produced "TS2554: Expected 1 arguments, but got 3".
//
// Usage anywhere in the backend:
//   import { sendBrandedEmail, EmailTemplates } from "@newcondo/backend-shared";
//   await sendBrandedEmail(user.email, EmailTemplates.otp({ code, purpose: "sign in" }));
//
// Fire-and-forget by design: an email outage must never fail the business
// operation (same rule as notificationBus). Errors are logged, not thrown.
// ============================================================
const email_1 = require("./email");
/** Strip tags for the plain-text part — every branded template is HTML-first. */
function toPlainText(html) {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s{2,}/g, " ")
        .trim();
}
async function sendBrandedEmail(to, content) {
    try {
        const result = await (0, email_1.sendEmail)({
            to,
            subject: content.subject,
            html: content.html,
            text: toPlainText(content.html).slice(0, 2000),
        });
        if (!result?.success)
            console.error(`[emailService] send failed to ${to} — "${content.subject}":`, result?.error);
    }
    catch (e) {
        console.error(`[emailService] send threw for ${to} — "${content.subject}":`, e);
    }
}
/** Batch helper: same or different templates to several recipients
    (e.g. all parties on a rent payment). Never rejects. */
async function sendBrandedEmails(entries) {
    await Promise.all(entries.map((e) => sendBrandedEmail(e.to, e.content)));
}
//# sourceMappingURL=emailService.js.map