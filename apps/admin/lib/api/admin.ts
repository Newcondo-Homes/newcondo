// apps/admin/lib/api/admin.ts
// Every call goes to combined-backend /api/v1/admin/* with the staff member's
// backend JWT (lib/api/client.ts). Scopes are enforced server-side on every
// route — hiding a button in the UI is convenience, not security.
"use client";
import api, { unwrap } from "./client";
import type { AdminRole, AdminScope } from "@/lib/scopes";

export interface Page<T> { rows: T[]; total: number; page: number; pageSize: number }
export interface ListParams { page: number; pageSize?: number; q?: string; filter?: string }
const list = <T,>(path: string) => (p: ListParams) => api.get(path, { params: p }).then(unwrap<Page<T>>);

export interface Impersonation { id: string; targetUserId: string; targetName: string; targetRole: string; reason: string; expiresAt: string; platformUrl: string | null }
export interface StaffMe { id: string; name: string; email: string; role: AdminRole; scopes: AdminScope[]; impersonating: Impersonation | null }
export interface StaffRow { id: string; name: string | null; email: string; role: AdminRole; granted: string[]; revoked: string[]; status: "ACTIVE" | "FROZEN" | "INVITED"; lastActiveAt: string | null; inviteExpiresAt: string | null; device: string | null; isSelf: boolean }
export interface UserRow { id: string; name: string | null; email: string; phone: string | null; role: string; plan: string | null; planStatus: string | null; verification: string; status: "ACTIVE" | "SUSPENDED"; joinedAt: string; lastSeenAt: string | null; lastDevice: string | null; lastCity: string | null }
export interface UserDetail extends UserRow {
  area: string | null; referredBy: string | null; activeDevices30: number; activeDays30: number; actions30: number;
  walletAvailableKobo: string; walletPendingKobo: string; suspendedReason: string | null; isFieldMarker: boolean;
  idDocuments: { type: string; status: string; numberMasked: string | null }[];
  devices: { id: string; label: string | null; city: string | null; firstSeenAt: string; lastSeenAt: string; activeDays: number; signedOut: boolean }[];
  properties: { id: string; title: string; relation: "OWNER" | "AGENT"; status: string; public: boolean }[];
  rentals: { id: string; property: string; unit: string | null; status: string; since: string }[];
}
export interface ApprovalDoc { id: string; type: string; side: string | null; numberMasked: string | null; url: string | null }
export interface Approval {
  id: string; kind: "IDENTITY" | "LISTING"; who: { id: string; name: string | null; role: string; verification: string }; label: string; propertyId: string | null;
  submittedAt: string; note: string | null; documents: ApprovalDoc[]; blockers: string[];
  marking?: { method: string | null; markedBy: string | null; snapshotUrl: string | null; maskUrl: string | null; boundaryVerified: boolean } | null;
}
export interface MarkingJob { id: string; property: { id: string; title: string; city: string; state: string; boundaryVerified: boolean }; requester: { name: string | null; role: string }; method: "SELF" | "KNOWN_PERSON" | "BROADCAST" | "NEWCONDO"; feeNaira: number; paid: boolean; status: string; marker: { id: string; name: string | null } | null; queue: number; slotEndsAt: string | null; confirmBy: string | null; disputeReason: string | null; contact: string; createdAt: string; completedAt: string | null }
export interface FieldMarker { id: string; name: string | null; area: string; openJobs: number }
export interface PropertyRow { id: string; title: string; area: string; owner: { id: string; name: string | null }; agent: { id: string; name: string | null } | null; priceNaira: number; units: number; availableUnits: number | null; marked: boolean; status: string; approval: string; public: boolean; hiddenReasons: string[] }
export interface PropertyDetail extends Omit<PropertyRow, "area" | "owner"> {
  address: string; city: string; state: string; rejectionReason: string | null; adminHidden: boolean; createdAt: string;
  owner: { id: string; name: string | null; verified: boolean }; plan: { planType: string; status: string } | null;
  tenants: { rentalId: string; renter: { id: string; name: string | null }; unit: string | null; rentalStatus: string; since: string; until: string | null; rentNaira: number; payment: string; paymentId: string | null; escrowEndsAt: string | null }[];
  vendors: { id: string; name: string; service: string; paused: boolean }[];
}
export interface VendorRow { id: string; name: string; kind: string; services: string[]; status: string; rating: number; clients: number; capacity: number; contact: string | null; areas: string[] }
export interface VendorDetail {
  id: string; name: string; kind: string; services: string[]; status: string; rating: number; maxClients: number; capacityPerDay: number; releaseMode: string;
  contactName: string | null; phone: string | null; email: string | null; cacNumber: string | null; bankName: string | null; accountName: string | null; accountMasked: string | null; bankVerifiedAt: string | null; userId: string | null;
  lastSeenAt: string | null; lastDevice: string | null; areas: { id: string; area: string; lga: string; state: string; radiusKm: number }[];
  assignments: { id: string; serviceType: string; status: string; assignedAt: string; distanceKm: number | null; property: { id: string; title: string; city: string; owner: { name: string | null } } }[];
  jobs: { id: string; serviceType: string; status: string; scheduledFor: string | null; verifiedAt: string | null; cost: number; paidOutAt: string | null; issueReason: string | null; property: { id: string; title: string } }[];
  payouts: { id: string; reference: string; amountKobo: string; jobCount: number; status: string; createdAt: string; settledAt: string | null }[];
}
export interface EligibleProperty { id: string; title: string; city: string; owner: string | null; services: string[]; movesFrom: string[] }
export interface RentRow { id: string; ref: string; tenant: string; tenantId: string; property: string; propertyId: string | null; unit: string | null; amountKobo: string; status: "IN_ESCROW" | "DISPUTED" | "RELEASED" | "REFUNDED" | "PENDING" | "FAILED" | "CANCELLED"; paidAt: string | null; escrowEndsAt: string | null; disputeId: string | null; split: { ownerKobo: string; listingAgentKobo: string; subAgentKobo: string; newcondoKobo: string } | null; parties: { owner: string | null; listingAgent: string | null; subAgent: string | null } }
export interface LedgerRow { id: string; type: string; memo: string | null; source: string; createdAt: string; createdBy: string | null; amountKobo: string; revenueKobo: string; legs: { account: string; kind: string; amountKobo: string }[] }
export interface FailedTransfer { id: string; kind: "WITHDRAWAL" | "VENDOR_BATCH"; ref: string; party: string | null; partyId: string; amountKobo: string; reason: string | null; createdAt: string; next: string }
export interface DisputeRow { id: string; reason: string; description: string; preferredResolution: string; status: string; resolutionOutcome: string | null; resolutionNotes: string | null; createdAt: string; resolvedAt: string | null; renter: { id: string; name: string | null }; payment: { id: string; amount: number; status: string; confirmationPeriodEnd: string | null }; rental: { unit: { unitNumber: string } | null; property: { id: string; title: string; owner: { id: string; name: string | null } } }; _count: { evidence: number; comments: number } }
export interface VisitIssue { id: string; serviceType: string; status: string; scheduledFor: string | null; issueReason: string | null; verifiedAt: string | null; property: { id: string; title: string; owner: { name: string | null } }; vendor: { id: string; name: string } | null }
export interface ReferralRow { id: string; status: string; fraudHold: boolean; fraudReason: string | null; source: string | null; referralType: string | null; createdAt: string; activatedAt: string | null; referrer: { id: string; name: string | null; role: string }; referred: { id: string; name: string | null; role: string }; referrerEarnedKobo: string; referredEarnedKobo: string }
export interface Ticket { id: string; title: string; description: string; category: string; priority: string; status: string; adminResponse: string | null; createdAt: string; resolvedAt: string | null; user: { id: string; name: string | null; role: string } }
export interface AuditRow { id: string; action: string; targetType: string; targetId: string; description: string | null; createdAt: string; admin: { name: string | null; email: string } }
export interface Overview { queues: Record<string, number | null>; escrow: { naira: number; count: number } | null; vendorVisitsToday: number | null }

export const A = {
  me: () => api.get("/admin/me").then(unwrap<StaffMe>),
  overview: () => api.get("/admin/overview").then(unwrap<Overview>),
  audit: list<AuditRow>("/admin/audit"),

  staff: list<StaffRow>("/admin/staff"),
  invite: (b: { emails: string[]; role: AdminRole; granted: string[]; revoked: string[] }) => api.post("/admin/staff/invites", b).then(unwrap<{ sent: string[]; expiresAt: string }>),
  resendInvite: (id: string) => api.post(`/admin/staff/invites/${id}/resend`).then(unwrap),
  revokeInvite: (id: string) => api.delete(`/admin/staff/invites/${id}`).then(unwrap),
  setScopes: (id: string, b: { role: AdminRole; granted: string[]; revoked: string[] }) => api.put(`/admin/staff/${id}/scopes`, b).then(unwrap),
  setFrozen: (id: string, frozen: boolean) => api.put(`/admin/staff/${id}/frozen`, { frozen }).then(unwrap),
  acceptInvite: (b: { token: string; name: string; password: string }) => api.post("/admin/staff/accept-invite", b).then(unwrap<{ email: string }>),

  users: list<UserRow>("/admin/users"),
  user: (id: string) => api.get(`/admin/users/${id}`).then(unwrap<UserDetail>),
  editUser: (id: string, b: { name?: string; phone?: string; city?: string; isFieldMarker?: boolean }) => api.patch(`/admin/users/${id}`, b).then(unwrap),
  suspendUser: (id: string, suspended: boolean, reason?: string) => api.put(`/admin/users/${id}/suspended`, { suspended, reason }).then(unwrap),
  signOutUser: (id: string) => api.post(`/admin/users/${id}/sign-out`).then(unwrap),
  revokeVerification: (id: string, reason: string) => api.post(`/admin/users/${id}/revoke-verification`, { reason }).then(unwrap<{ listingsHidden: number }>),
  impersonate: (id: string, reason: string) => api.post(`/admin/users/${id}/impersonate`, { reason }).then(unwrap<Impersonation>),
  endImpersonation: () => api.delete("/admin/impersonation").then(unwrap),

  identityQueue: list<Approval>("/admin/approvals/identity"),
  listingQueue: list<Approval>("/admin/approvals/listing"),
  decide: (kind: "identity" | "listing", id: string, b: { approve: boolean; reason?: string; allowRemark?: boolean }) => api.post(`/admin/approvals/${kind}/${id}`, b).then(unwrap),

  marking: list<MarkingJob>("/admin/marking"),
  fieldMarkers: (q?: string) => api.get("/admin/marking/field-markers", { params: { q } }).then(unwrap<FieldMarker[]>),
  assignMarker: (id: string, markerId: string) => api.post(`/admin/marking/${id}/assign`, { markerId }).then(unwrap),
  rotateQueue: (id: string) => api.post(`/admin/marking/${id}/rotate`).then(unwrap),
  resolveMarking: (id: string, outcome: "UPHOLD_MARKER" | "REMARK", note?: string) => api.post(`/admin/marking/${id}/resolve`, { outcome, note }).then(unwrap),
  allowRemark: (propertyId: string) => api.post(`/admin/properties/${propertyId}/allow-remark`).then(unwrap),

  properties: list<PropertyRow>("/admin/properties"),
  property: (id: string) => api.get(`/admin/properties/${id}`).then(unwrap<PropertyDetail>),
  setVisibility: (id: string, pub: boolean, reason?: string) => api.put(`/admin/properties/${id}/visibility`, { public: pub, reason }).then(unwrap),

  vendors: list<VendorRow>("/admin/vendors"),
  vendor: (id: string) => api.get(`/admin/vendors/${id}`).then(unwrap<VendorDetail>),
  eligibleProperties: (id: string, q?: string) => api.get(`/admin/vendors/${id}/eligible-properties`, { params: { q } }).then(unwrap<EligibleProperty[]>),
  setVendorStatus: (id: string, status: "VERIFIED" | "SUSPENDED", reason?: string) => api.put(`/admin/vendors/${id}/status`, { status, reason }).then(unwrap),
  assignProperties: (id: string, propertyIds: string[]) => api.post(`/admin/vendors/${id}/properties`, { propertyIds }).then(unwrap<{ assigned: number; failed: { propertyId: string; message: string }[] }>),
  removeProperty: (id: string, propertyId: string) => api.delete(`/admin/vendors/${id}/properties/${propertyId}`).then(unwrap<{ rematched: string[]; unmatched: string[] }>),
  rebookVisit: (jobId: string, reason: string) => api.post(`/admin/visits/${jobId}/rebook`, { reason }).then(unwrap),
  visitIssues: list<VisitIssue>("/admin/visits/issues"),
  resolveVisit: (jobId: string, outcome: "REBOOK" | "CLOSE_VERIFIED", note?: string) => api.post(`/admin/visits/${jobId}/resolve`, { outcome, note }).then(unwrap),

  rent: list<RentRow>("/admin/payments/rent"),
  releaseRent: (id: string, reason: string) => api.post(`/admin/payments/rent/${id}/release`, { reason, renterConfirmed: true }).then(unwrap),
  ledger: list<LedgerRow>("/admin/payments/ledger"),
  failedTransfers: list<FailedTransfer>("/admin/payments/failed"),

  disputes: list<DisputeRow>("/admin/disputes"),
  resolveDispute: (id: string, outcome: "NO_REFUND" | "FULL_REFUND" | "PROPERTY_FIX_REQUIRED" | "REQUEST_EVIDENCE" | "DISMISSED", note: string) => api.post(`/admin/disputes/${id}/resolve`, { outcome, note }).then(unwrap),
  referrals: list<ReferralRow>("/admin/referrals"),
  decideReferral: (id: string, action: "CLEAR" | "VOID", reason?: string) => api.post(`/admin/referrals/${id}/decision`, { action, reason }).then(unwrap),
  tickets: list<Ticket>("/admin/tickets"),
  replyTicket: (id: string, response: string, status: "IN_PROGRESS" | "RESOLVED" | "CLOSED") => api.post(`/admin/tickets/${id}/reply`, { response, status }).then(unwrap),
};
