// backend/shared/src/money/kobo.ts
// ============================================================
// Money arithmetic. The ledger stores INTEGER KOBO as BigInt — never floats.
// Existing Payment rows store naira Decimals; convert at the boundary with
// these helpers and nowhere else.
// ============================================================

export type Kobo = bigint;

/** ₦ (number | Decimal | string) → kobo. Rounds half-up at the kobo, which is
 *  exact for every amount Flutterwave can charge (2 decimal places). */
export function toKobo(naira: number | string | { toString(): string }): Kobo {
  const n = typeof naira === "number" ? naira : Number(naira.toString());
  if (!Number.isFinite(n)) throw new Error(`toKobo: not a number (${String(naira)})`);
  return BigInt(Math.round(n * 100));
}

/** kobo → ₦ number for display / Flutterwave payloads. */
export const toNaira = (k: Kobo): number => Number(k) / 100;

/** Floor to a whole unit (default ₦1 = 100 kobo). Rounding always favours
 *  Newcondo — a share is floored and the remainder stays with the platform. */
export const floorTo = (k: Kobo, unitKobo: Kobo = 100n): Kobo =>
  k >= 0n ? (k / unitKobo) * unitKobo : -((-k + unitKobo - 1n) / unitKobo) * unitKobo;

/** amount × rate, floored to the kobo. Rate is a plain decimal (0.2 = 20%). */
export function mulRate(k: Kobo, rate: number): Kobo {
  if (rate < 0 || rate > 1) throw new Error(`mulRate: rate out of range (${rate})`);
  // 1e6 fixed-point keeps 0.175-style rates exact.
  return (k * BigInt(Math.round(rate * 1_000_000))) / 1_000_000n;
}

export const minKobo = (...xs: Kobo[]): Kobo => xs.reduce((a, b) => (b < a ? b : a));
export const maxKobo = (...xs: Kobo[]): Kobo => xs.reduce((a, b) => (b > a ? b : a));

export const formatKobo = (k: Kobo): string =>
  `₦${toNaira(k).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
