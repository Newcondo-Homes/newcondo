// backend/shared/src/constants/vendorsPublic.ts
// ============================================================
// The CLIENT-SAFE half of the vendor-network constants. Import-free, so it
// can be re-exported from constants/frontend.ts (the `./constants` subpath)
// for apps/vendors and apps/platform — same rules as that file.
//
// ⚠️ No vendor economics here. Per-visit costs come from VENDOR_COSTS and
// stay in constants/vendors.ts (backend only), exactly like frontend.ts
// keeps VENDOR_COSTS out of the client. Vendors see their own fee per job
// from the API, never the price table.
// ============================================================

export type VendorServiceType = "FUMIGATION" | "WASTE_MANAGEMENT" | "INSPECTION";
export type VendorKind = "COMPANY" | "INDIVIDUAL";
export type VendorProviderType =
  | "FUMIGATION_COMPANY" | "FUMIGATION_PERSONNEL"
  | "HOUSE_INSPECTOR"
  | "WASTE_COMPANY" | "WASTE_WORKER";
export type VendorReleaseMode = "INSTANT" | "END_OF_DAY";
export type ReminderContactRole = "TENANT" | "LISTING_AGENT" | "OWNER";

export const VENDOR_SERVICE_TYPES: VendorServiceType[] = ["FUMIGATION", "WASTE_MANAGEMENT", "INSPECTION"];

export const VENDORS_PUBLIC = {
  services: {
    FUMIGATION: { label: "Fumigation", minPhotos: 2, reminderCalls: true, defaultDailyCapacity: 4, defaultMaxClients: 60 },
    INSPECTION: { label: "Inspection", minPhotos: 4, reminderCalls: true, defaultDailyCapacity: 6, defaultMaxClients: 80 },
    // One WASTE job = one month of bin-emptying for the compound. Never rung.
    WASTE_MANAGEMENT: { label: "Waste pickup", minPhotos: 1, reminderCalls: false, defaultDailyCapacity: 25, defaultMaxClients: 300 },
  } as Record<VendorServiceType, { label: string; minPhotos: number; reminderCalls: boolean; defaultDailyCapacity: number; defaultMaxClients: number }>,

  providerTypes: {
    FUMIGATION_COMPANY: { label: "Fumigation company", kind: "COMPANY", services: ["FUMIGATION"] },
    FUMIGATION_PERSONNEL: { label: "Fumigation personnel", kind: "INDIVIDUAL", services: ["FUMIGATION"] },
    HOUSE_INSPECTOR: { label: "House inspector", kind: "INDIVIDUAL", services: ["INSPECTION"] },
    WASTE_COMPANY: { label: "Waste company", kind: "COMPANY", services: ["WASTE_MANAGEMENT"] },
    WASTE_WORKER: { label: "Waste worker", kind: "INDIVIDUAL", services: ["WASTE_MANAGEMENT"] },
  } as Record<VendorProviderType, { label: string; kind: VendorKind; services: VendorServiceType[] }>,

  /** Services a vendor may add on top of its primary type. Admin verifies licences. */
  addableServices: { FUMIGATION: ["INSPECTION"], INSPECTION: ["FUMIGATION"], WASTE_MANAGEMENT: [] } as Record<VendorServiceType, VendorServiceType[]>,

  /** Fridays and Sundays are kept free for Jumu'ah and church. Owners narrow
   *  this per property; they can never widen it. */
  hours: {
    timezone: "Africa/Lagos",
    /** 0 = Sunday … 6 = Saturday */
    allowedDays: [1, 2, 3, 4, 6] as number[],
    startMinute: 9 * 60,
    endMinute: 17 * 60,
    minWindowMinutes: 120,
    slotMinutes: { FUMIGATION: 120, INSPECTION: 90, WASTE_MANAGEMENT: 30 } as Record<VendorServiceType, number>,
  },

  codes: {
    length: 6,
    qrPrefix: "NCV1",
    /** Big modules for weak cameras: lowest error correction + large scale. */
    qr: { errorCorrectionLevel: "L" as const, scale: 14, margin: 4 },
  },

  matching: { defaultRadiusKm: 8, maxRadiusKm: 25 },

  payout: { defaultReleaseMode: "INSTANT" as VendorReleaseMode, endOfDayHour: 18 },

  appUrl: "https://vendors.newcondo.homes",
};

export const providerServices = (type: VendorProviderType): VendorServiceType[] => [...VENDORS_PUBLIC.providerTypes[type].services];

export const isServiceDay = (weekday: number): boolean => VENDORS_PUBLIC.hours.allowedDays.includes(weekday);

/** Clamp an owner's chosen availability into the allowed hours. */
export function normaliseWindow(w: { days: number[]; startMinute: number; endMinute: number }) {
  const h = VENDORS_PUBLIC.hours;
  const days = [...new Set(w.days)].filter(isServiceDay).sort((a, b) => a - b);
  const start = Math.max(h.startMinute, Math.min(w.startMinute, h.endMinute - h.minWindowMinutes));
  const end = Math.min(h.endMinute, Math.max(w.endMinute, start + h.minWindowMinutes));
  return { days: days.length ? days : [...h.allowedDays], startMinute: start, endMinute: end };
}

export const minuteLabel = (m: number): string => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
