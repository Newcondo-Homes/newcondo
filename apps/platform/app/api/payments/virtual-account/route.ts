/**
 * POST /api/payments/virtual-account
 *
 * Creates a permanent Flutterwave virtual account for a customer.
 *
 * Body:
 *   {
 *     email:       string   (required)
 *     firstName:   string   (required)
 *     lastName:    string   (required)
 *     phoneNumber: string   (required)
 *     bankCode?:   string   (defaults to "044" — Access Bank)
 *     duration?:   number
 *     frequency?:  number
 *   }
 *
 * Responses:
 *   200 – { status, message, data }
 *   400 – { error: string }
 *   500 – { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createVirtualAccount,
  FlutterwaveServerError,
  type CreateVirtualAccountInput,
} from '@/lib/api/flutterwave-server';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateBody(
  body: unknown
): { data: CreateVirtualAccountInput } | { error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Request body must be a JSON object' };
  }

  const b = body as Record<string, unknown>;

  const requiredStrings: Array<keyof CreateVirtualAccountInput> = [
    'email',
    'firstName',
    'lastName',
    'phoneNumber',
  ];

  for (const field of requiredStrings) {
    if (!b[field] || typeof b[field] !== 'string') {
      return { error: `\`${field}\` is required and must be a non-empty string` };
    }
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(b.email as string)) {
    return { error: '`email` must be a valid email address' };
  }

  if (b.duration !== undefined && typeof b.duration !== 'number') {
    return { error: '`duration` must be a number when provided' };
  }

  if (b.frequency !== undefined && typeof b.frequency !== 'number') {
    return { error: '`frequency` must be a number when provided' };
  }

  return {
    data: {
      email: b.email as string,
      firstName: b.firstName as string,
      lastName: b.lastName as string,
      phoneNumber: b.phoneNumber as string,
      bankCode: b.bankCode as string | undefined,
      duration: b.duration as number | undefined,
      frequency: b.frequency as number | undefined,
    },
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

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

  const validated = validateBody(body);

  if ('error' in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const result = await createVirtualAccount(validated.data);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FlutterwaveServerError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }
    console.error('[payments/virtual-account] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}