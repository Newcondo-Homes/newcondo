// backend/shared/src/referrals/__tests__/fees.test.ts — Flutterwave fee maths.
// Run with the referral tests:  npm test  (tsx --test src/referrals/__tests__/*.test.ts)
import test from "node:test";
import assert from "node:assert/strict";
import { withProcessingFee, flutterwaveCollectionCost, transferFeeFor, payoutBreakdown, minWithdrawalNaira, refundBreakdown } from "../../constants/fees";

test("gross-up always leaves Newcondo the full base, fee is whole naira", () => {
  for (const base of [1, 99, 1_000, 9_700, 9_800, 9_999, 10_000, 10_500, 20_000, 25_000, 1_224_000, 6_850_000]) {
    const c = withProcessingFee(base);
    assert.equal(Number.isInteger(c.processingFeeNaira), true, `fee integer for ${base}`);
    assert.ok(c.totalNaira - flutterwaveCollectionCost(c.totalNaira) >= base - 1e-9, `net ≥ base for ${base}`);
    // minimal: one naira less would not cover it
    if (c.processingFeeNaira > 0) assert.ok(c.totalNaira - 1 - flutterwaveCollectionCost(c.totalNaira - 1) < base, `minimal for ${base}`);
  }
});

test("fixtures", () => {
  // ₦10,500 Essential: 2.15% of 10,8xx + ₦50 stamp
  const e = withProcessingFee(10_500);
  assert.equal(e.processingFeeNaira, 282);
  assert.equal(e.totalNaira, 10_782);
  // ₦20,000 broadcast marking
  assert.equal(withProcessingFee(20_000).processingFeeNaira, 491);
  // tiny amounts still round UP to ₦1
  assert.equal(withProcessingFee(5).processingFeeNaira, 1);
  // just under the stamp line stays under it
  assert.equal(withProcessingFee(9_700).totalNaira < 10_000, true);
});

test("transfer fees incl. VAT, rounded up", () => {
  assert.equal(transferFeeFor(5_000), 11);
  assert.equal(transferFeeFor(5_001), 27);
  assert.equal(transferFeeFor(50_000), 27);
  assert.equal(transferFeeFor(50_001), 54);
});

test("payout picks the tier that leaves the recipient the most", () => {
  assert.deepEqual(payoutBreakdown(5_010), { requestedNaira: 5_010, feeNaira: 11, receiveNaira: 4_999 });
  assert.deepEqual(payoutBreakdown(50_020), { requestedNaira: 50_020, feeNaira: 27, receiveNaira: 49_993 });
  assert.deepEqual(payoutBreakdown(100_000), { requestedNaira: 100_000, feeNaira: 54, receiveNaira: 99_946 });
  assert.equal(minWithdrawalNaira(), 111);
});

test("rent refund: rent − reversal fee − transfer fee, all rounded up", () => {
  const r = refundBreakdown(1_000_000);
  assert.equal(r.reversalFeeNaira, 21_550); // 2% × 1.075 + ₦50 stamp
  assert.equal(r.transferFeeNaira, 54);
  assert.equal(r.refundNaira, 978_396);
  assert.equal(r.refundCostNaira, 21_604);
  const small = refundBreakdown(4_000);
  assert.equal(small.reversalFeeNaira, 86);
  assert.equal(small.transferFeeNaira, 11);
  assert.equal(small.refundNaira, 3_903);
});
