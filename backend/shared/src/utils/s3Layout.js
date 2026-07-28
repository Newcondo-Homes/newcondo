"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.s3Private = exports.s3Public = exports.PRIVATE_BUCKET = exports.PUBLIC_BUCKET = void 0;
// backend/shared/src/utils/s3Layout.ts
// ============================================================
// Canonical S3 object-key builders — the ONLY place bucket layout lives.
// Two buckets:
//   newcondo-public-assets      (listing images, avatars, marketing)
//   newcondo-private-documents  (identity, ownership/legal docs)
// Env: S3_PUBLIC_BUCKET, S3_PRIVATE_BUCKET (fall back to the names above).
// Use with presignUpload/presignDownload from ./s3Upload (pass bucket).
// ============================================================
const crypto_1 = require("crypto");
exports.PUBLIC_BUCKET = process.env.S3_PUBLIC_BUCKET ?? "newcondo-public-assets";
exports.PRIVATE_BUCKET = process.env.S3_PRIVATE_BUCKET ?? "newcondo-private-documents";
const slug = (s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const ext = (contentType) => contentType === "application/pdf" ? "pdf" : (contentType.split("/")[1] ?? "jpg");
const propRoot = (g) => `properties/${slug(g.country ?? "nigeria")}/${slug(g.state)}/${slug(g.city)}/${g.propertyId}`;
/* ---------- newcondo-public-assets ---------- */
exports.s3Public = {
    propertyPrimaryImage: (g, ct = "image/jpeg") => `${propRoot(g)}/images/primary/${(0, crypto_1.randomUUID)()}.${ext(ct)}`,
    propertyGalleryImage: (g, ct = "image/jpeg") => `${propRoot(g)}/images/gallery/${(0, crypto_1.randomUUID)()}.${ext(ct)}`,
    unitImage: (g, unitId, ct = "image/jpeg") => `${propRoot(g)}/images/units/${unitId}/${(0, crypto_1.randomUUID)()}.${ext(ct)}`,
    /* marking-job photos taken by the marking agent */
    markingBoundaryPhoto: (g, ct = "image/jpeg") => `${propRoot(g)}/marking/boundary/${(0, crypto_1.randomUUID)()}.${ext(ct)}`,
    markingRoomPhoto: (g, ct = "image/jpeg") => `${propRoot(g)}/marking/rooms/${(0, crypto_1.randomUUID)()}.${ext(ct)}`,
    userAvatar: (userId, ct = "image/jpeg") => `users/${userId}/avatar/${(0, crypto_1.randomUUID)()}.${ext(ct)}`,
    platformLogo: (name) => `platform/logos/${slug(name)}`,
    platformMarketing: (name) => `platform/marketing/${slug(name)}`,
};
exports.s3Private = {
    identityDoc: (userId, kind, side, ct = "image/jpeg") => `users/${userId}/identity/${kind}/${side ? side + "_" : ""}${(0, crypto_1.randomUUID)()}.${ext(ct)}`,
    businessRegistration: (userId) => `users/${userId}/business/registration/${(0, crypto_1.randomUUID)()}.pdf`,
    businessTaxCertificate: (userId) => `users/${userId}/business/tax-certificate/${(0, crypto_1.randomUUID)()}.pdf`,
    propertyOwnership: (g) => `${propRoot(g)}/ownership/${(0, crypto_1.randomUUID)()}.pdf`,
    propertyConsent: (g) => `${propRoot(g)}/consent/${(0, crypto_1.randomUUID)()}.pdf`,
    propertyUndertaking: (g) => `${propRoot(g)}/undertaking/${(0, crypto_1.randomUUID)()}.pdf`,
    propertyUtilityBill: (g) => `${propRoot(g)}/utility/${(0, crypto_1.randomUUID)()}.pdf`,
};
//# sourceMappingURL=s3Layout.js.map