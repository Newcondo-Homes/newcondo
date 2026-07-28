// backend/payment-service/src/lib/unitLock.ts
// ============================================================
// Anti-double-booking lock, implemented locally so payment-service does NOT
// depend on @newcondo/booking-service (that import was unresolvable and is
// unnecessary — this is 20 lines of Redis).
//
// SET NX EX is atomic: exactly one renter can hold a unit's checkout lock.
// Release is compare-and-delete via Lua so a late release can never unlock
// someone else's checkout. The DB mirror (PropertyUnit.isPaymentLocked /
// paymentLockExpiry) is written by rentCheckout so read paths see it too.
// ============================================================
import { redis } from "@newcondo/backend-shared";

const key = (propertyId: string, unitNumber: string) => `lock:unit:${propertyId}:${unitNumber}`;

export async function acquireUnitLock(
  propertyId: string,
  unitNumber: string,
  holderId: string,
  ttlSeconds: number
): Promise<{ acquired: boolean }> {
  const ok = await redis.set(key(propertyId, unitNumber), holderId, "EX", ttlSeconds, "NX");
  return { acquired: ok === "OK" };
}

export async function releaseUnitLock(propertyId: string, unitNumber: string, holderId: string): Promise<void> {
  const lua = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;
  await redis.eval(lua, 1, key(propertyId, unitNumber), holderId);
}
