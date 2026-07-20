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

export const isLiveBackend = Boolean(process.env.NEXT_PUBLIC_API_URL);

const unwrap = <T,>(res: { data?: T }) => { if (res.data === undefined) throw new Error("Empty response"); return res.data; };

/* ---- bank accounts (payout destinations; virtual accounts are auto-created server-side) ---- */
export const getBankAccounts = () => apiClient.get<BankAccount[]>("/payments/bank-accounts").then(unwrap);
export const addBankAccount = (b: { bankName: string; bankCode: string; accountNumber: string }) =>
  apiClient.post<BankAccount>("/payments/bank-accounts", b).then(unwrap);
export const setDefaultBankAccount = (id: string) => apiClient.patch(`/payments/bank-accounts/${id}/default`);
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
export const initiateRent = (propertyId: string, unitNumber: string) =>
  apiClient.post<{ paymentId: string; checkout: Record<string, unknown> }>("/payments/rent/initiate", { propertyId, unitNumber }).then(unwrap);

/* ---- notifications (list + mark-read; real-time via useNotificationStream) ---- */
export const getNotifications = () => apiClient.get<Notification[]>("/notifications").then(unwrap);
export const markAllNotificationsRead = () => apiClient.post("/notifications/mark-all-read");

/* ---- payments history (matches existing dashboard hook keys) ---- */
export const getPayments = () => apiClient.get<Tx[]>("/payments/history").then(unwrap);
