/**
 * POST /api/payments/verify
 *
 * Verifies a Flutterwave transaction server-side using the secret key.
 * Called by your client after the popup callback fires, so you can
 * confirm payment status before releasing value.
 *
 * Body: { transactionId: string }
 *
 * Responses:
 *   200 – { status, message, data }
 *   400 – { error: string }
 *   500 – { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  verifyTransaction,
  FlutterwaveServerError,
} from '@/lib/api/flutterwave-server';

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON' },
      { status: 400 }
    );
  }

  const { transactionId } = (body ?? {}) as Record<string, unknown>;

  if (!transactionId || typeof transactionId !== 'string') {
    return NextResponse.json(
      { error: '`transactionId` is required and must be a string' },
      { status: 400 }
    );
  }

  try {
    const result = await verifyTransaction(transactionId);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FlutterwaveServerError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }
    console.error('[payments/verify] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}