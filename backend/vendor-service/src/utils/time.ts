// backend/vendor-service/src/utils/time.ts
// Lagos wall-clock helpers. Nigeria is UTC+1 all year (no DST), so a fixed
// offset is exact and avoids pulling a timezone library into the backend.
import { VENDORS, isServiceDay } from "@newcondo/backend-shared";

const OFFSET_MIN = 60;
const DAY_MS = 86_400_000;

export interface LagosParts { y: number; m: number; d: number; weekday: number; minute: number }

export function lagosParts(at: Date): LagosParts {
  const t = new Date(at.getTime() + OFFSET_MIN * 60_000);
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), weekday: t.getUTCDay(), minute: t.getUTCHours() * 60 + t.getUTCMinutes() };
}

/** Lagos (y, m, d, minuteOfDay) → UTC instant. */
export const lagosInstant = (y: number, m: number, d: number, minute: number): Date =>
  new Date(Date.UTC(y, m, d, 0, minute) - OFFSET_MIN * 60_000);

/** "2026-10-19" in Lagos. */
export function lagosDayKey(at: Date): string {
  const p = lagosParts(at);
  return `${p.y}-${String(p.m + 1).padStart(2, "0")}-${String(p.d).padStart(2, "0")}`;
}

export const sameLagosDay = (a: Date, b: Date): boolean => lagosDayKey(a) === lagosDayKey(b);

export const addDays = (at: Date, n: number): Date => new Date(at.getTime() + n * DAY_MS);

/** End of service hours on the Lagos day of `at` — visit codes expire here. */
export function serviceDayEnd(at: Date): Date {
  const p = lagosParts(at);
  return lagosInstant(p.y, p.m, p.d, VENDORS.hours.endMinute);
}

/** The first Lagos day on/after `from` that is an allowed service day AND in
 *  the owner's chosen days. Returns the day's midnight (Lagos) as an instant. */
export function nextAllowedDay(from: Date, ownerDays: number[]): Date {
  for (let i = 0; i < 14; i++) {
    const p = lagosParts(addDays(from, i));
    if (isServiceDay(p.weekday) && ownerDays.includes(p.weekday)) return lagosInstant(p.y, p.m, p.d, 0);
  }
  const p = lagosParts(from);
  return lagosInstant(p.y, p.m, p.d, 0);
}

export const startOfLagosDay = (at: Date): Date => { const p = lagosParts(at); return lagosInstant(p.y, p.m, p.d, 0); };
