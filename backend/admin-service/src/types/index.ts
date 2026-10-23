// backend/admin-service/src/types/index.ts — DTOs shared with apps/admin (no Express imports).
import type { AdminRole, AdminScope } from "@newcondo/backend-shared";

export interface Page<T> { rows: T[]; total: number; page: number; pageSize: number }

export interface ImpersonationDTO { id: string; targetUserId: string; targetName: string; targetRole: string; reason: string; expiresAt: string; platformUrl: string | null }
export interface StaffMeDTO { id: string; name: string; email: string; role: AdminRole; scopes: AdminScope[]; impersonating: ImpersonationDTO | null }
export interface StaffRowDTO {
  id: string; name: string | null; email: string; role: AdminRole; granted: string[]; revoked: string[];
  status: "ACTIVE" | "FROZEN" | "INVITED"; lastActiveAt: string | null; inviteExpiresAt: string | null; device: string | null; isSelf: boolean;
}

export interface UserRowDTO {
  id: string; name: string | null; email: string; phone: string | null; role: string; plan: string | null; planStatus: string | null;
  verification: string; status: "ACTIVE" | "SUSPENDED"; joinedAt: string; lastSeenAt: string | null; lastDevice: string | null; lastCity: string | null;
}
export interface UserDetailDTO extends UserRowDTO {
  area: string | null; referredBy: string | null; activeDevices30: number; activeDays30: number; actions30: number;
  walletAvailableKobo: string; walletPendingKobo: string; suspendedReason: string | null; isFieldMarker: boolean;
  idDocuments: { type: string; status: string; numberMasked: string | null }[];
  devices: { id: string; label: string | null; city: string | null; firstSeenAt: string; lastSeenAt: string; activeDays: number; signedOut: boolean }[];
  properties: { id: string; title: string; relation: "OWNER" | "AGENT"; status: string; public: boolean }[];
  rentals: { id: string; property: string; unit: string | null; status: string; since: string }[];
}
export interface ApprovalDTO {
  id: string; kind: "IDENTITY" | "LISTING"; who: { id: string; name: string | null; role: string; verification: string };
  label: string; propertyId: string | null; submittedAt: string; note: string | null;
  documents: { id: string; type: string; side: string | null; numberMasked: string | null; url: string | null }[];
  marking?: { method: string | null; markedBy: string | null; snapshotUrl: string | null; maskUrl: string | null; boundaryVerified: boolean } | null;
  blockers: string[]; // why it can't be approved yet (shown; Approve disabled)
}
export interface RentRowDTO {
  id: string; ref: string; tenant: string; tenantId: string; property: string; propertyId: string | null; unit: string | null;
  amountKobo: string; status: "IN_ESCROW" | "DISPUTED" | "RELEASED" | "REFUNDED" | "PENDING" | "FAILED" | "CANCELLED";
  paidAt: string | null; escrowEndsAt: string | null; disputeId: string | null;
  split: { ownerKobo: string; listingAgentKobo: string; subAgentKobo: string; newcondoKobo: string } | null;
  parties: { owner: string | null; listingAgent: string | null; subAgent: string | null };
}
