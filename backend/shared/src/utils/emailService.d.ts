import type { EmailContent } from "./emailTemplates";
export declare function sendBrandedEmail(to: string, content: EmailContent): Promise<void>;
/** Batch helper: same or different templates to several recipients
    (e.g. all parties on a rent payment). Never rejects. */
export declare function sendBrandedEmails(entries: {
    to: string;
    content: EmailContent;
}[]): Promise<void>;
//# sourceMappingURL=emailService.d.ts.map