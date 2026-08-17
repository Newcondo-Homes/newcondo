/* ============================================================
   Dashboard API client — every dashboard feature calls the ONE
   combined-backend surface (`NEXT_PUBLIC_API_URL` → /api/v1) through
   lib/api/client.ts, which attaches `Authorization: Bearer <accessToken>`
   from the session on every request. Server side these hit:
     properties → @newcondo/property-service (via combined routes/properties.ts)
     payments   → @newcondo/payment-service  (via routes/payments.dashboard.ts)
     notifications → @newcondo/notification-service (via routes/notifications.ts)
   Security: nothing here holds secrets; ownership/role checks live in the
   backend services — these calls just carry the JWT.
   ============================================================ */
import apiClient from "@/lib/api/client";
import type { BankAccount, Tenant, BrowseResult, BrowseFilters, Notification, Tx } from "@/lib/dashboard/data";

export const isLiveBackend = true;

const unwrap = <T,>(res: { data?: T }) => { if (res.data === undefined) throw new Error("Empty response"); return res.data; };

/* ---- bank accounts (payout destinations; virtual accounts are auto-created server-side) ---- */
export const getBankAccounts = () => apiClient.get<BankAccount[]>("/payments/bank-accounts").then(unwrap);
export const addBankAccount = (b: { bankName: string; bankCode: string; accountNumber: string; otp?: string }) =>
  apiClient.post<BankAccount>("/payments/bank-accounts", b).then(unwrap);
export const setDefaultBankAccount = (id: string, otp?: string) => apiClient.patch(`/payments/bank-accounts/${id}/default`, { otp });
export const removeBankAccount = (id: string) => apiClient.delete(`/payments/bank-accounts/${id}`);

/* ---- receipts: backend renders a branded PDF (pdfkit), caches it in S3,
   returns a 10-min presigned URL we open for the download ---- */
export const getReceiptPdfUrl = (paymentId: string) =>
  apiClient.get<{ url: string }>(`/payments/${paymentId}/receipt.pdf`).then(unwrap);

/* ---- tenants + invite links ----
   Tenants are Rental rows in Prisma; invites optionally tie to a
   PropertyUnit via unitId. The backend maps DB rows → these DTO shapes. */
export const getTenants = (propertyId: string) => apiClient.get<Tenant[]>(`/properties/${propertyId}/tenants`).then(unwrap);
export const createTenantInvite = (propertyId: string, unitId?: string) =>
  apiClient.post<{ url: string; expiresInDays: number }>(`/properties/${propertyId}/tenant-invites`, { unitId }).then(unwrap);
/** PUBLIC — the /tenant-invite/[token] page calls this before any sign-in. */
export const validateTenantInvite = (token: string) =>
  apiClient.get<{ property: { id: string; title: string; location: string }; inviter: { name: string; role: string }; flatLabel?: string }>(
    `/properties/tenant-invites/${token}`, { skipAuth: true } as never).then(unwrap);

/* ---- browse grid (public) + renter rent checkout ---- */
export const browseProperties = (f: BrowseFilters) => {
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)]));
  return apiClient.get<BrowseResult>(`/properties/browse?${qs}`).then(unwrap);
};
export const quoteRent = (propertyId: string, unitNumber: string) =>
  apiClient.get(`/payments/rent/quote?propertyId=${propertyId}&unitNumber=${encodeURIComponent(unitNumber)}`).then(unwrap);
/** Locks the unit server-side (booking-service mutex + PropertyUnit
    isPaymentLocked) and returns the Flutterwave checkout payload — payment
    lands in escrow (Payment HELD), 24h confirmation window. */
export const initiateRent = (propertyId: string, unitNumber: string, shareCode?: string) =>
  apiClient.post<{ paymentId: string; checkout: Record<string, unknown> }>("/payments/rent/initiate", { propertyId, unitNumber, shareCode }).then(unwrap);

/* ---- notifications (list + mark-read; real-time via useNotificationStream) ---- */
export const getNotifications = () => apiClient.get<Notification[]>("/notifications").then(unwrap);
export const markAllNotificationsRead = () => apiClient.post("/notifications/mark-all-read");

/* ---- share links, promotions, agent invites (collab router) ---- */
export const createShareLink = (propertyId: string, kind: "SHARE" | "PROMO" = "SHARE") =>
  apiClient.post<{ code: string; url: string }>(`/properties/${propertyId}/share-link`, { kind }).then(unwrap);
export const resolveShareLink = (code: string) => apiClient.get(`/share/${code}`).then(unwrap);
export const requestPromotion = (propertyId: string) => apiClient.post(`/properties/${propertyId}/promotion-requests`);
export const getPromotionRequests = () => apiClient.get("/promotion-requests").then(unwrap);
export const approvePromotion = (id: string) => apiClient.post<{ promoUrl: string; splitPct: number }>(`/promotion-requests/${id}/approve`).then(unwrap);
export const declinePromotion = (id: string, reason?: string) => apiClient.post(`/promotion-requests/${id}/decline`, { reason });
export const createAgentInvite = (agentEmail?: string) => apiClient.post<{ url: string; expiresInDays: number; emailSent?: boolean }>("/agent-invites", { agentEmail }).then(unwrap);
export const validateAgentInvite = (token: string) => apiClient.get<{ ownerName: string }>(`/agent-invites/${token}`).then(unwrap);
export const acceptAgentInvite = (token: string) => apiClient.post<{ ownerName: string }>("/agent-invites/accept", { token }).then(unwrap);
export const getLinkedOwners = () => apiClient.get<{ ownerId: string; ownerName: string }[]>("/agent-invites/owners").then(unwrap);

/* ---- renter escrow virtual account (idempotent; 400 asks for BVN) ---- */
export const ensureRenterVA = (bvn?: string) => apiClient.post("/payments/renter-va/ensure", { bvn });

/* ---- bank-change OTP (branded email) ---- */
export const requestBankOtp = () => apiClient.post("/payments/bank-accounts/request-otp");

/* ---- payments history (matches existing dashboard hook keys) ---- */
export const getPayments = () => apiClient.get<Tx[]>("/payments/history").then(unwrap);

/* ---- wallet: balances, withdraw (→ default bank via Flutterwave), auto-payout ---- */
export const getWalletApi = () => apiClient.get<{ available: number; locked: number; autoPayout: string }>("/payments/wallet").then(unwrap);
export const withdrawApi = (amount: number) => apiClient.post<{ reference: string }>("/payments/wallet/withdraw", { amount }).then(unwrap);
export const setAutoPayoutApi = (mode: string) => apiClient.patch("/payments/wallet/auto-payout", { mode });

/* ---- referrals ---- */
export interface ReferralStatsPayload {
  link: string; invited: number; signedUp: number; converted: number; credits: number;
  history: { id: string; name: string; status: string; reward: number; date: string; note?: string }[];
}
export const getReferralStats = () => apiClient.get<ReferralStatsPayload>("/referrals/stats").then(unwrap);
export const sendReferralInvite = (email: string) => apiClient.post("/referrals/invite", { email });
export const getLeaderboard = (page = 1, pageSize?: number) =>
  apiClient.get(`/referrals/leaderboard?page=${page}${pageSize ? `&pageSize=${pageSize}` : ""}`).then(unwrap);
export const getActiveAreas = () => apiClient.get("/referrals/active-areas").then(unwrap);

/* ---- marking ---- */
export const getOwnerMarkingJobs = () => apiClient.get("/marking/jobs/mine").then(unwrap);
export const createMarkingJobApi = (b: { propertyId: string; method: string; contactName?: string; contactPhone?: string; accessNotes?: string }) => apiClient.post("/marking/jobs", b).then(unwrap);
export const confirmMarkingApi = (jobId: string) => apiClient.post(`/marking/jobs/${jobId}/confirm`);
export const disputeMarkingApi = (jobId: string, reason: string) => apiClient.post(`/marking/jobs/${jobId}/dispute`, { reason });
export const getAvailableMarkingJobs = (lat: number, lng: number) => apiClient.get(`/marking/available-jobs?lat=${lat}&lng=${lng}`).then(unwrap);
export const joinMarkingQueue = (jobId: string) => apiClient.post(`/marking/queue/${jobId}/join`).then(unwrap);
/** Presigned S3 PUTs — keys land under properties/{country}/{state}/{city}/{id}/marking/{boundary|rooms}/ */
export const presignMarkingPhotosApi = (jobId: string, photos: { kind: "boundary" | "rooms"; contentType: string; contentLength: number }[]) =>
  apiClient.post<{ key: string; uploadUrl: string }[]>(`/marking/jobs/${jobId}/photos/presign`, { photos }).then(unwrap);
export const completeMarkingApi = (jobId: string, b: { polygonNorm: [number, number][]; mapBounds: object; photoKeys: string[] }) =>
  apiClient.post(`/marking/jobs/${jobId}/complete`, b).then(unwrap);
export const abandonMarkingJob = (jobId: string) => apiClient.post(`/marking/jobs/${jobId}/abandon`);
/** Paid marking (BROADCAST/NEWCONDO): PENDING payment + Flutterwave inline
    payload; the NC-MKFEE-* webhook creates + broadcasts the job. */
export const initiateMarkingPaymentApi = (b: { propertyId: string; method: string; contactName: string; contactPhone: string; accessNotes?: string }) =>
  apiClient.post<{ paymentId: string; checkout: Record<string, unknown> }>("/marking/jobs/initiate-payment", b).then(unwrap);
/** AI segmentation: satellite snapshot key → { polygonNorm, maskKey } (vision model + server-side green-polygon extraction) */
export const segmentBuildingApi = (jobId: string, screenshotKey: string, geo: { state: string; city: string; propertyId: string }) =>
  apiClient.post<{ polygonNorm: [number, number][]; maskKey: string }>(`/marking/jobs/${jobId}/segment`, { screenshotKey, geo }).then(unwrap);
export interface SavedCardInfo {
  hasSavedCard: boolean;
  last4?: string;
  brand?: string;
  expiry?: string;
}

export type ChargeFailureCode =
  | "INSUFFICIENT_FUNDS"
  | "CARD_DECLINED"
  | "CARD_EXPIRED"
  | "NO_SAVED_CARD"
  | "NETWORK"
  | "UNKNOWN";

export interface MarkingChargeResult {
  ok: boolean;
  jobId?: string;
  reference: string;
  amount: number;
  failureCode?: ChargeFailureCode;
  failureMessage?: string;
  retryWithInline?: boolean;
}

/** Does the user have a subscription card token we can charge silently? */
export const getSavedCardApi = () =>
  apiClient.get<SavedCardInfo>("/marking/saved-card").then(unwrap);

/** Server-to-server tokenized charge. A DECLINE returns ok:false (not a throw). */
export const payMarkingWithSavedCardApi = (b: {
  propertyId: string;
  method: string;
  contactName: string;
  contactPhone: string;
  accessNotes?: string;
}) =>
  apiClient.post<MarkingChargeResult>("/marking/jobs/pay-with-saved-card", b).then(unwrap);

/* ---- vendor services ---- */
export const getServicesOverview = () => apiClient.get("/services/overview").then(unwrap);
export const requestServiceApi = (b: { propertyId: string; serviceType: string; notes?: string }) => apiClient.post("/services/request", b).then(unwrap);
export const rescheduleServiceJob = (id: string) => apiClient.post(`/services/jobs/${id}/reschedule`);
export const reportServiceIssue = (id: string, reason: string) => apiClient.post(`/services/jobs/${id}/issue`, { reason });

/* ---- agent promotions ---- */
export interface PromoteResult {
  status: "APPROVED" | "PENDING";
  /** Present only when APPROVED — the agent's tracked link. */
  promoUrl?: string;
  /** Share of total rent the sub-agent earns, e.g. 2 (%). */
  splitPct?: number;
  requestId?: string;
}


// create property
export interface CreatePropertyResult { id: string; title: string; status: "DRAFT"; needsMarking: true }


export const getUnmarkedProperties = () =>
  apiClient.get<{ id: string; title: string; location: string; status: string; price: number; marked: boolean }[]>(
    "/properties/unmarked"
  ).then(unwrap);

/** Agent adds a browsed property to their promotions. */
export const promoteProperty = (propertyId: string) =>
  apiClient.post<PromoteResult>(`/properties/${propertyId}/promote`, {}).then(unwrap);

/* ============================================================
   lib/api/dashboard.ts — ADDITIONS for the Create-listing wizard,
   My Properties, and property photos.

   Append these to your existing apps/platform/lib/api/dashboard.ts.
   ============================================================ */

export interface CreatePropertyResult { id: string; title: string; status: "DRAFT"; needsMarking: true }

export const createPropertyApi = (body: {
  title: string; propertyType: string; price: number; unitCount: number;
  description?: string; amenities?: string[];
  state: string; lga: string; area: string; address?: string;
  ownerId?: string; undertaking: boolean; ownerConsent?: boolean;
  /** S3 keys from uploadPropertyPhotos() — optional at creation time. */
  photoKeys?: string[];
}) => apiClient.post<CreatePropertyResult>("/properties", body).then(unwrap);

/** Every listing this user owns or is listing agent for (incl. DRAFT). */
export const getMyProperties = () =>
  apiClient.get("/properties/mine").then(unwrap);



/* ---------------- property photos (S3) ---------------- */

export interface PresignedUpload {
  /** PUT the file here directly — the bytes never touch our server. */
  uploadUrl: string;
  /** Store this on the property; it's what getPropertyPhotos signs for reads. */
  key: string;
}

/** Ask the API for one presigned PUT per file (max 10 per call). */
export const presignPropertyPhotos = (propertyId: string, files: { name: string; type: string; size: number }[]) =>
  apiClient.post<PresignedUpload[]>(`/properties/${propertyId}/photos/presign`, { files }).then(unwrap);

/** Attach successfully-uploaded S3 keys to the property. */
export const attachPropertyPhotos = (propertyId: string, keys: string[]) =>
  apiClient.post<{ photos: PropertyPhoto[] }>(`/properties/${propertyId}/photos`, { keys }).then(unwrap);

export interface PropertyPhoto { id: string; key: string; url: string; isCover: boolean }

/** Signed, time-limited GET urls for display. */
export const getPropertyPhotos = (propertyId: string) =>
  apiClient.get<PropertyPhoto[]>(`/properties/${propertyId}/photos`).then(unwrap);

export const deletePropertyPhoto = (propertyId: string, photoId: string) =>
  apiClient.delete<{ photos: PropertyPhoto[] }>(`/properties/${propertyId}/photos/${photoId}`).then(unwrap);

export interface SavedCardInfo {
  hasSavedCard: boolean;
  last4?: string;
  brand?: string;
  expiry?: string;
}


export interface MarkingChargeResult {
  ok: boolean;
  jobId?: string;
  reference: string;
  amount: number;
  failureCode?: ChargeFailureCode;
  failureMessage?: string;
  retryWithInline?: boolean;
}

/* ---------------- proof of ownership (S3, private) ----------------
   One document per property. It does NOT block creating a listing, but
   the backend's assertOwnershipProof() gates marking, sharing and tenant
   invites on it — see ownershipDocService.ts. */

export interface OwnershipDoc {
  id: string;
  name: string;
  docType: string;
  mime?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string | null;
  uploadedAt?: string;
}

export const presignOwnershipDoc = (propertyId: string, file: { name: string; type: string; size: number }) =>
  apiClient.post<{ uploadUrl: string; key: string }[]>(`/properties/${propertyId}/ownership-doc/presign`, { file }).then(unwrap);

export const attachOwnershipDoc = (propertyId: string, body: { key: string; docType: string }) =>
  apiClient.post<OwnershipDoc>(`/properties/${propertyId}/ownership-doc`, body).then(unwrap);

export const getOwnershipDoc = (propertyId: string) =>
  apiClient.get<OwnershipDoc | null>(`/properties/${propertyId}/ownership-doc`).then(unwrap);

/** Short-lived signed GET — minted per download, never stored. */
export const getOwnershipDocUrl = (propertyId: string) =>
  apiClient.get<{ url: string }>(`/properties/${propertyId}/ownership-doc/url`).then(unwrap);

export const deleteOwnershipDoc = (propertyId: string) =>
  apiClient.delete<{ ok: true }>(`/properties/${propertyId}/ownership-doc`).then(unwrap);


/* ---------------- delete / take down / resign ----------------
   Three separate calls on purpose — see deletePropertyService.ts. */

export interface DeletePreview {
  canDelete: boolean;
  isOwner: boolean;
  /** Why delete is unavailable, in words the dialog shows verbatim. */
  reason: string | null;
  photos: number;
  units: number;
}

export const getDeletePreview = (propertyId: string) =>
  apiClient.get<DeletePreview>(`/properties/${propertyId}/delete-preview`).then(unwrap);

/** Permanent. OWNER/ADMIN only; refused with a 409 when records must survive. */
export const deletePropertyApi = (propertyId: string) =>
  apiClient.delete<{ deleted: true; title: string; removedPhotos: number }>(`/properties/${propertyId}`).then(unwrap);

/** Hide from renters, keep everything. Always available to owner or agent. */
export const takeDownPropertyApi = (propertyId: string) =>
  apiClient.post<{ ok: true; status: string }>(`/properties/${propertyId}/takedown`, {}).then(unwrap);

/** The agent's exit: detach from the listing, which survives with its owner. */
export const resignAsListingAgentApi = (propertyId: string) =>
  apiClient.delete<{ ok: true; title: string }>(`/properties/${propertyId}/agent`).then(unwrap);