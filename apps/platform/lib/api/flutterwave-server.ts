/**
 * flutterwave-server.ts — SERVER-ONLY helper.
 *
 * Never import this file from a Client Component or any file that is
 * part of the browser bundle. It reads FLUTTERWAVE_SECRET_KEY from
 * process.env and makes direct calls to api.flutterwave.com.
 */

import { env } from '@/lib/env';

const BASE_URL = 'https://api.flutterwave.com/v3';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FlutterwaveApiError {
  status: 'error';
  message: string;
  code?: number;
}

export interface VerifyTransactionResult {
  status: string;
  message: string;
  data: Record<string, unknown>;
}

export interface VirtualAccountResult {
  status: string;
  message: string;
  data: Record<string, unknown>;
}

export interface BankListResult {
  id: number;
  code: string;
  name: string;
}

export interface RefundResult {
  status: string;
  message: string;
  data: Record<string, unknown>;
}

export interface TransactionFeeResult {
  charge_amount: number;
  fee: number;
  merchant_fee: number;
  flutterwave_fee: number;
}

export interface CreateVirtualAccountInput {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  bankCode?: string;
  duration?: number;
  frequency?: number;
}

// ─── Shared fetch wrapper ────────────────────────────────────────────────────

async function flwFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${env.FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const json = await response.json();

  if (!response.ok) {
    const message: string =
      json?.message ?? `Flutterwave API error — HTTP ${response.status}`;
    throw new FlutterwaveServerError(message, response.status);
  }

  return json as T;
}

// ─── Custom error ─────────────────────────────────────────────────────────────

export class FlutterwaveServerError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'FlutterwaveServerError';
    this.statusCode = statusCode;
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

/** Verify a completed transaction by its Flutterwave transaction ID. */
export async function verifyTransaction(
  transactionId: string
): Promise<VerifyTransactionResult> {
  return flwFetch<VerifyTransactionResult>(
    `/transactions/${encodeURIComponent(transactionId)}/verify`
  );
}

/**
 * Create a permanent virtual account for a customer.
 * `bankCode` defaults to Access Bank (044).
 */
export async function createVirtualAccount(
  data: CreateVirtualAccountInput
): Promise<VirtualAccountResult> {
  const txRef = `VA_${Date.now()}_${Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0')}`;

  return flwFetch<VirtualAccountResult>('/virtual-account-numbers', {
    method: 'POST',
    body: JSON.stringify({
      email: data.email,
      is_permanent: true,
      bvn: null,
      tx_ref: txRef,
      firstname: data.firstName,
      lastname: data.lastName,
      phonenumber: data.phoneNumber,
      narration: 'NewCondo Virtual Account',
      bank_code: data.bankCode ?? '044',
      ...(data.duration !== undefined && { duration: data.duration }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
    }),
  });
}

/** Fetch the list of supported banks for a given country (default NG). */
export async function getSupportedBanks(
  country = 'NG'
): Promise<BankListResult[]> {
  const result = await flwFetch<{ data: BankListResult[] }>(
    `/banks/${encodeURIComponent(country)}`
  );
  return result.data ?? [];
}

/**
 * Initiate a full or partial refund.
 * Omit `amount` to refund the full transaction value.
 */
export async function initiateRefund(
  transactionId: string,
  amount?: number
): Promise<RefundResult> {
  return flwFetch<RefundResult>(
    `/transactions/${encodeURIComponent(transactionId)}/refund`,
    {
      method: 'POST',
      body: JSON.stringify({ ...(amount !== undefined && { amount }) }),
    }
  );
}

/** Get the fee breakdown for a given amount and currency (default NGN). */
export async function getTransactionFee(
  amount: number,
  currency = 'NGN'
): Promise<TransactionFeeResult> {
  const params = new URLSearchParams({
    amount: String(amount),
    currency,
  });
  const result = await flwFetch<{ data: TransactionFeeResult }>(
    `/transactions/fee?${params.toString()}`
  );
  return result.data;
}