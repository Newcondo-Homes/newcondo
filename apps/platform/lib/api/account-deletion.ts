/* ============================================================
   lib/api/account-deletion.ts

   Wires the delete-account flow to the backend:

     GET    /auth/account/deletion/preview   blockers + what goes + what stays
     POST   /auth/account/deletion           request (re-auth + confirm phrase)
     DELETE /auth/account/deletion           cancel / reactivate
     GET    /auth/account/deletion/status    banner state for a locked account
     GET    /data-deletion/:code             public status (Meta status URL)

   The preview is fetched BEFORE the dialog opens, never after — the dialog's
   whole job is to say what will happen to this specific account, and a spinner
   where that text should be is how people click through without reading.
   ============================================================ */

import { apiClient } from "./client";

const unwrap = <T,>(r: { data?: T }) => r.data as T;

export type BlockerCode =
  | "ACTIVE_TENANCY" | "ESCROW_HELD" | "PENDING_PAYOUT" | "WALLET_BALANCE"
  | "OPEN_DISPUTE" | "MARKING_IN_PROGRESS" | "MARKING_ASSIGNED"
  | "LISTING_AGENT_DUTY" | "SERVICE_JOB_OPEN" | "UNPAID_REWARD"
  | "UNPAID_COMMISSION" | "REFUND_WINDOW";

export interface DeletionBlocker {
  code: BlockerCode;
  title: string;
  detail: string;
  fix: string;
  fixLabel: string;
}

export interface DeletionPreview {
  role: "OWNER" | "AGENT" | "RENTER" | "ADMIN";
  canRequest: boolean;
  blockers: DeletionBlocker[];
  summary: {
    properties: number;
    listingsAsAgent: number;
    photos: number;
    documents: number;
    completedRentals: number;
    payments: number;
    referralCredits: number;
  };
  retained: string[];
  graceDays: number;
  retentionMonths: number;
  /** Social-only accounts confirm with an emailed code instead of a password. */
  reauth: "PASSWORD" | "OTP";
  /** Whether a Facebook/Google account is actually linked. An account can have
   *  no password WITHOUT being an OAuth account (invite-created renters,
   *  OTP-only signups), so the dialog must not claim social login. */
  hasOAuth: boolean;
  existing: { confirmationCode: string; anonymizeAfter: string } | null;
}

export const getDeletionPreview = () =>
  apiClient.get<DeletionPreview>("/auth/account/deletion/preview").then(unwrap);

export interface DeletionReceipt {
  status: "PENDING";
  confirmationCode: string;
  anonymizeAfter: string;
  graceDays: number;
}

/** `confirmPhrase` must equal ACCOUNT_DELETION.confirmPhrase exactly; the
 *  backend re-checks it, so the client-side check is convenience only. */
export const requestAccountDeletion = (body: {
  password?: string;
  otp?: string;
  reason?: string;
  reasonNote?: string;
  confirmPhrase: string;
}) => apiClient.post<DeletionReceipt>("/auth/account/deletion", body).then(unwrap);

export const cancelAccountDeletion = () =>
  apiClient.delete<{ ok: true }>("/auth/account/deletion").then(unwrap);

export interface DeletionStatus {
  scheduled: boolean;
  erasureDate: string | null;
  confirmationCode: string | null;
  graceDays: number;
}

export const getDeletionStatus = () =>
  apiClient.get<DeletionStatus>("/auth/account/deletion/status").then(unwrap);

/** Public — no session. Backs /data-deletion/[code], the URL we hand to Meta. */
export const getPublicDeletionStatus = (code: string) =>
  apiClient
    .get<{
      status: "PENDING" | "CANCELLED" | "ANONYMIZED" | "PURGED" | "BLOCKED";
      requestedAt: string;
      erasureDue: string;
      erasedAt: string | null;
      finalPurgeDue: string | null;
    }>(`/data-deletion/${code}`)
    .then(unwrap);

/* Social-only accounts: reuse the existing OTP sender. The code goes to the
   address ON the account (not a new one), because here it proves WHO is asking,
   not that a mailbox is reachable.
   Endpoint is /auth/send-otp — the same public sender register and resend use. */
export const sendDeletionOtp = (email: string) =>
  apiClient.post("/auth/send-otp", { identifier: email, type: "EMAIL_VERIFICATION" }).then(unwrap);
