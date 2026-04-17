/**
 * POST /api/payments/refund
 *
 * Initiates a full or partial refund for a completed transaction.
 * Omit `amount` to refund the full transaction value.
 *
 * Body: { transactionId: string; amount?: number }
 *
 * Responses:
 *   200 – { status, message, data }
 *   400 – { error: string }
 *   500 – { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  initiateRefund,
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

  const { transactionId, amount } = (body ?? {}) as Record<string, unknown>;

  if (!transactionId || typeof transactionId !== 'string') {
    return NextResponse.json(
      { error: '`transactionId` is required and must be a string' },
      { status: 400 }
    );
  }

  if (amount !== undefined) {
    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: '`amount` must be a positive number when provided' },
        { status: 400 }
      );
    }
  }

  try {
    const result = await initiateRefund(
      transactionId,
      typeof amount === 'number' ? amount : undefined
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FlutterwaveServerError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }
    console.error('[payments/refund] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}