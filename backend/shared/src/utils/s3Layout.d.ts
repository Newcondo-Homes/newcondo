export declare const PUBLIC_BUCKET: string;
export declare const PRIVATE_BUCKET: string;
export interface PropertyGeo {
    country?: string;
    state: string;
    city: string;
    propertyId: string;
}
export declare const s3Public: {
    propertyPrimaryImage: (g: PropertyGeo, ct?: string) => string;
    propertyGalleryImage: (g: PropertyGeo, ct?: string) => string;
    unitImage: (g: PropertyGeo, unitId: string, ct?: string) => string;
    markingBoundaryPhoto: (g: PropertyGeo, ct?: string) => string;
    markingRoomPhoto: (g: PropertyGeo, ct?: string) => string;
    userAvatar: (userId: string, ct?: string) => string;
    platformLogo: (name: string) => string;
    platformMarketing: (name: string) => string;
};
export type IdentityDocKind = "nin" | "bvn" | "passport" | "voters-card" | "drivers-license" | "selfie";
export declare const s3Private: {
    identityDoc: (userId: string, kind: IdentityDocKind, side: "front" | "back" | null, ct?: string) => string;
    businessRegistration: (userId: string) => string;
    businessTaxCertificate: (userId: string) => string;
    propertyOwnership: (g: PropertyGeo) => string;
    propertyConsent: (g: PropertyGeo) => string;
    propertyUndertaking: (g: PropertyGeo) => string;
    propertyUtilityBill: (g: PropertyGeo) => string;
};
//# sourceMappingURL=s3Layout.d.ts.map