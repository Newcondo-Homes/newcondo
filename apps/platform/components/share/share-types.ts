/* ============================================================
   Types for the public shared-property page.
   ============================================================ */

export interface PropertyImage {
  url: string;
  isPrimary: boolean;
  altText?: string | null;
}

export interface SharedProperty {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  price: number | string;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  /** e.g. "95 m²" */
  area?: string;
  features?: string[];
  propertyType: string;
  isAvailable: boolean;
  isOwnerListing: boolean;
  isVerified?: boolean;
  /** decimal degrees, for the verified-location map tag */
  lat?: number;
  lng?: number;
  photoCount?: number;
  images?: PropertyImage[];
  owner?: {
    name?: string | null;
  };
}

/** ₦ with thousands separators, naira by default. */
export function formatPrice(value: number | string, currency = "NGN"): string {
  const n = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(Number.isFinite(n) ? n : 0);
}
