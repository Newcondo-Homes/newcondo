/**
 * GET /api/payments/banks?country=NG
 *
 * Returns Flutterwave's list of supported banks for a given country.
 * Country defaults to "NG" (Nigeria) when the query param is omitted.
 *
 * Responses:
 *   200 – Array<{ id: number; code: string; name: string }>
 *   400 – { error: string }
 *   500 – { error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getSupportedBanks,
  FlutterwaveServerError,
} from '@/lib/api/flutterwave-server';

/** ISO 3166-1 alpha-2 codes accepted by Flutterwave's /banks endpoint. */
const SUPPORTED_COUNTRIES = new Set(['NG', 'GH', 'KE', 'UG', 'TZ', 'ZA', 'RW']);

export async function GET(req: NextRequest) {
  const country = (
    req.nextUrl.searchParams.get('country') ?? 'NG'
  ).toUpperCase();

  if (!SUPPORTED_COUNTRIES.has(country)) {
    return NextResponse.json(
      {
        error: `Unsupported country "${country}". Accepted values: ${[...SUPPORTED_COUNTRIES].join(', ')}`,
      },
      { status: 400 }
    );
  }

  try {
    const banks = await getSupportedBanks(country);
    return NextResponse.json(banks);
  } catch (err) {
    if (err instanceof FlutterwaveServerError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }
    console.error('[payments/banks] Unexpected error:', err);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}