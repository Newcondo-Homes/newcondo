// backend/vendor-service/src/utils/visitCode.ts
// Visit codes: 6 random digits, stored only as HMAC-SHA256(secret, jobId:code)
// so a database leak can't be replayed at a property. The QR carries
// "NCV1.{jobId}.{code}" — the vendor app decodes it and submits the same code.
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { VENDORS } from "@newcondo/backend-shared";

function secret(): string {
  const s = process.env.VISIT_CODE_SECRET || process.env.JWT_SECRET;
  if (!s) throw new Error("VISIT_CODE_SECRET (or JWT_SECRET) must be set");
  return s;
}

export const newVisitCode = (): string =>
  String(randomInt(0, 10 ** VENDORS.codes.length)).padStart(VENDORS.codes.length, "0");

export const hashVisitCode = (jobId: string, code: string): string =>
  createHmac("sha256", secret()).update(`${jobId}:${code}`).digest("hex");

export function codeMatches(jobId: string, code: string, hash: string): boolean {
  const a = Buffer.from(hashVisitCode(jobId, code), "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export const qrPayload = (jobId: string, code: string): string => `${VENDORS.codes.qrPrefix}.${jobId}.${code}`;

/** Accepts a raw 6-digit code or a scanned QR payload; returns the code. */
export function extractCode(input: string, jobId: string): string | null {
  const s = input.trim();
  if (new RegExp(`^\\d{${VENDORS.codes.length}}$`).test(s)) return s;
  const [prefix, id, code] = s.split(".");
  return prefix === VENDORS.codes.qrPrefix && id === jobId && /^\d+$/.test(code ?? "") ? code : null;
}
