// apps/platform/lib/env.ts
// Centralised, type-safe environment variable access with runtime validation.
// Import this instead of accessing process.env directly anywhere in the app.

const getRequired = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getOptional = (key: string, fallback = ''): string => {
  return process.env[key] ?? fallback;
};

export const env = {
  // ── Flutterwave ──────────────────────────────────────────────────────────
  // Public key is safe to expose to the browser (prefixed with NEXT_PUBLIC_)
  // NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: getRequired('NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY'),
  NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: getOptional('NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY'),

  // Secret key must NEVER be sent to the browser — server-side only
  // FLUTTERWAVE_SECRET_KEY: getRequired('FLUTTERWAVE_SECRET_KEY'),
  FLUTTERWAVE_SECRET_KEY: getOptional('FLUTTERWAVE_SECRET_KEY'),

  FLUTTERWAVE_WEBHOOK_HASH: getOptional('FLUTTERWAVE_WEBHOOK_HASH'),

  // ── App ──────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: getOptional('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
  NODE_ENV: getOptional('NODE_ENV', 'development') as 'development' | 'test' | 'production',

  // ── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: getRequired('DATABASE_URL'),
  DIRECT_URL: getOptional('DIRECT_URL'),

  // ── Auth ─────────────────────────────────────────────────────────────────
  NEXTAUTH_SECRET: getRequired('NEXTAUTH_SECRET'),
  NEXTAUTH_URL: getOptional('NEXTAUTH_URL', 'http://localhost:3000'),
} as const;

export type Env = typeof env;