// backend/vendor-service/src/types/index.ts
// HTTP DTOs — every service function declares an explicit return type built
// from these (Prisma 7 payload types can't be named across packages: TS2742).
// apps/vendors imports this file for its API types, so it must stay free of
// Express/Node types — the req.vendor augmentation lives in ./request.ts.
import type { VendorServiceType, VendorReleaseMode } from "@newcondo/backend-shared";

export interface VendorProfileDTO {
  id: string; name: string; kind: string; providerType: string; services: string[];
  contactName: string | null; email: string | null; phone: string | null; status: string; rating: number;
  capacityPerDay: number; maxClients: number; releaseMode: VendorReleaseMode;
  bank: { bankName: string | null; accountNumberMasked: string | null; accountName: string | null; verified: boolean };
  areas: { id: string; state: string; lga: string; area: string; radiusKm: number; clients: number }[];
}

export interface VendorJobDTO {
  id: string; ref: string; service: VendorServiceType; status: string;
  propertyId: string; property: string; address: string;
  scheduledFor: string | null; windowEnd: string | null;
  owner: { name: string; phoneMasked: string | null };
  occupant: { label: string; phoneMasked: string | null };
  agent: string | null; planType: string | null;
  cost: number; receive: number; photoCount: number; minPhotos: number;
  verifiedAt: string | null; verifiedVia: string | null;
  payout: "NONE" | "PROCESSING" | "BATCHED" | "PAID";
  paidOutAt: string | null; notes: string | null;
  reminders: { dayOffset: number; contactRole: string; status: string; at: string }[];
}

export interface VisitPhotoDTO { key: string; url: string; expiresAt: string }

export interface VendorClientDTO {
  assignmentId: string; propertyId: string; property: string; area: string; owner: string;
  planType: string; services: VendorServiceType[]; status: string; since: string;
  window: { days: number[]; startMinute: number; endMinute: number };
  nextVisit: string | null;
}

export interface VendorOverviewDTO {
  today: VendorJobDTO[];
  counts: { todayTotal: number; todayLeft: number; upcoming7d: number; pendingPaymentKobo: string; paidThisMonthKobo: string; pendingJobs: number };
}

export interface OwnerVisitDTO {
  jobId: string; propertyId: string; property: string; service: VendorServiceType; status: string;
  scheduledFor: string | null; windowEnd: string | null; vendor: string | null;
  canGenerateCode: boolean; codeActive: boolean;
}
