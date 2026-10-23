// backend/admin-service/src/utils/tokens.ts
// Opaque URL tokens: 32 random bytes, base64url. Only the sha256 is stored.
import { randomBytes, createHash, timingSafeEqual } from "crypto";

export const newToken = () => { const raw = randomBytes(32).toString("base64url"); return { raw, hash: sha256(raw) }; };
export const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
export const sameHash = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
