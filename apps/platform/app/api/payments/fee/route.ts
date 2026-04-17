/**
 * GET /api/payments/fee?amount=5000&currency=NGN
 *
 * Returns the Flutterwave fee breakdown for a given amount and currency.
 * Currency defaults to "NGN" when omitted.
 *
 * Responses:
 *   200 – { charge_amount, fee, merchant_fee, flutterwave_fee }
 *   400 – { error: string }
 *   500 – { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getTransactionFee,
  FlutterwaveServerError,
} from '@/lib/api/flutterwave-server';

const SUPPORTED_CURRENCIES = new Set(['NGN', 'USD', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'RWF']);

export async function GET(req: NextRequest) {
  const rawAmount = req.nextUrl.searchParams.get('amount');
  const currency = (
    req.nextUrl.searchParams.get('currency') ?? 'NGN'
  ).toUpperCase();

  if (!rawAmount) {
    return NextResponse.json(
      { error: '`amount` query parameter is required' },
      { status: 400 }
    );
  }

  const amount = Number(rawAmount);

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json(
      { error: '`amount` must be a positive number' },
      { status: 400 }
    );
  }

  if (!SUPPORTED_CURRENCIES.has(currency)) {
    return NextResponse.json(
      {
        error: `Unsupported currency "${currency}". Accepted values: ${[...SUPPORTED_CURRENCIES].join(', ')}`,
      },
      { status: 400 }
    );
  }

  try {
    const fee = await getTransactionFee(amount, currency);
    return NextResponse.json(fee);
  } catch (err) {
    if (err instanceof FlutterwaveServerError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }
    console.error('[payments/fee] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}