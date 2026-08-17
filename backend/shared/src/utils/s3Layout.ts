// backend/shared/src/utils/s3Layout.ts
// ============================================================
// Canonical S3 object-key builders — the ONLY place bucket layout lives.
// Two buckets:
//   newcondo-public-assets      (listing images, avatars, marketing)
//   newcondo-private-documents  (identity, ownership/legal docs)
// Env: S3_PUBLIC_BUCKET, S3_PRIVATE_BUCKET (fall back to the names above).
// Use with presignUpload/presignDownload from ./s3Upload (pass bucket).
// ============================================================
import { randomUUID } from "crypto";

// export const PUBLIC_BUCKET = process.env.S3_PUBLIC_BUCKET ?? "newcondo-public-assets";
// export const PRIVATE_BUCKET = process.env.S3_PRIVATE_BUCKET ?? "newcondo-private-documents";

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const ext = (contentType: string) => contentType === "application/pdf" ? "pdf" : (contentType.split("/")[1] ?? "jpg");

export interface PropertyGeo { country?: string; state: string; city: string; propertyId: string; }
const propRoot = (g: PropertyGeo) => `properties/${slug(g.country ?? "nigeria")}/${slug(g.state)}/${slug(g.city)}/${g.propertyId}`;

/* ---------- newcondo-public-assets ---------- */
export const s3Public = {
  propertyPrimaryImage: (g: PropertyGeo, ct = "image/jpeg") => `${propRoot(g)}/images/primary/${randomUUID()}.${ext(ct)}`,
  propertyGalleryImage: (g: PropertyGeo, ct = "image/jpeg") => `${propRoot(g)}/images/gallery/${randomUUID()}.${ext(ct)}`,
  unitImage: (g: PropertyGeo, unitId: string, ct = "image/jpeg") => `${propRoot(g)}/images/units/${unitId}/${randomUUID()}.${ext(ct)}`,
  /* marking-job photos taken by the marking agent */
  markingBoundaryPhoto: (g: PropertyGeo, ct = "image/jpeg") => `${propRoot(g)}/marking/boundary/${randomUUID()}.${ext(ct)}`,
  markingRoomPhoto: (g: PropertyGeo, ct = "image/jpeg") => `${propRoot(g)}/marking/rooms/${randomUUID()}.${ext(ct)}`,
  userAvatar: (userId: string, ct = "image/jpeg") => `users/${userId}/avatar/${randomUUID()}.${ext(ct)}`,
  platformLogo: (name: string) => `platform/logos/${slug(name)}`,
  platformMarketing: (name: string) => `platform/marketing/${slug(name)}`,
};

/* ---------- newcondo-private-documents ---------- */
export type IdentityDocKind = "nin" | "bvn" | "passport" | "voters-card" | "drivers-license" | "selfie";
export const s3Private = {
  identityDoc: (userId: string, kind: IdentityDocKind, side: "front" | "back" | null, ct = "image/jpeg") =>
    `users/${userId}/identity/${kind}/${side ? side + "_" : ""}${randomUUID()}.${ext(ct)}`,
  businessRegistration: (userId: string) => `users/${userId}/business/registration/${randomUUID()}.pdf`,
  businessTaxCertificate: (userId: string) => `users/${userId}/business/tax-certificate/${randomUUID()}.pdf`,
  propertyOwnership: (g: PropertyGeo) => `${propRoot(g)}/ownership/${randomUUID()}.pdf`,
  propertyConsent: (g: PropertyGeo) => `${propRoot(g)}/consent/${randomUUID()}.pdf`,
  propertyUndertaking: (g: PropertyGeo) => `${propRoot(g)}/undertaking/${randomUUID()}.pdf`,
  propertyUtilityBill: (g: PropertyGeo) => `${propRoot(g)}/utility/${randomUUID()}.pdf`,
};
