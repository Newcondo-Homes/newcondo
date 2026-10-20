// apps/vendors/lib/constants.ts
// Shim over backend-shared's `./constants` subpath (constants/frontend.ts),
// the same client door apps/platform uses — never the package barrel, which
// drags ioredis/pg into the browser bundle. Only the client-safe half of the
// vendor constants is reachable here (no cost table).
export { VENDORS_PUBLIC as VENDORS, VENDOR_SERVICE_TYPES, minuteLabel, isServiceDay, providerServices, NG_BANKS } from "@newcondo/backend-shared/constants";
export type { VendorServiceType, VendorProviderType, VendorReleaseMode } from "@newcondo/backend-shared/constants";

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
export const koboToNaira = (k: string | number) => Number(k) / 100;
const TZ = "Africa/Lagos";
export const fmtDay = (iso: string) => new Date(iso).toLocaleDateString("en-NG", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-NG", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false });
export const isTodayLagos = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ }) === new Date().toLocaleDateString("en-CA", { timeZone: TZ });
