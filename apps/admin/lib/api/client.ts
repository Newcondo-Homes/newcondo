// apps/admin/lib/api/client.ts
// ONE axios instance → combined-backend (/api/v1). Attaches the session's
// backend JWT (minted by @newcondo/auth's jwt callback, signed with
// JWT_SECRET) as a Bearer token. Staff identity + scopes are resolved
// server-side on every call by requireStaff.
//
// Errors are re-thrown as ApiError with `.status`, so the shell can tell
// "not staff" (403) from "backend down" (no status) and say so on screen.
"use client";
import axios, { AxiosError } from "axios";
import { getSession, signOut } from "@newcondo/auth/client";

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
/** Non-null when the env is wrong — shown by the shell instead of silently calling the admin app itself. */
export const API_URL_PROBLEM = !API_URL
  ? "NEXT_PUBLIC_API_URL is not set in apps/admin/.env.local"
  : !/^https?:\/\//.test(API_URL) ? `NEXT_PUBLIC_API_URL must be absolute (got “${API_URL}”)` : null;

export class ApiError extends Error {
  constructor(message: string, public status: number | null, public url?: string) { super(message); this.name = "ApiError"; }
}

const api = axios.create({ baseURL: API_URL || "http://invalid.local", timeout: 20_000 });

let cachedToken: { value: string; at: number } | null = null;
async function token(): Promise<string | undefined> {
  if (cachedToken && Date.now() - cachedToken.at < 60_000) return cachedToken.value;
  const s = (await getSession()) as { accessToken?: string } | null;
  if (s?.accessToken) cachedToken = { value: s.accessToken, at: Date.now() };
  return s?.accessToken;
}

api.interceptors.request.use(async (cfg) => {
  if (API_URL_PROBLEM) throw new ApiError(API_URL_PROBLEM, null);
  const t = await token();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

let signingOut = false;
api.interceptors.response.use(undefined, async (err: AxiosError<{ message?: string; code?: string }>) => {
  if (err instanceof ApiError) return Promise.reject(err);
  const status = err.response?.status ?? null;
  const url = `${err.config?.baseURL ?? ""}${err.config?.url ?? ""}`;
  // Session revoked / expired: sign out once (never on public pages, which send no token).
  const hadToken = !!(err.config?.headers as Record<string, unknown> | undefined)?.Authorization;
  if (status === 401 && hadToken && !signingOut) { signingOut = true; cachedToken = null; await signOut({ redirectTo: "/login" }); }
  if (status === null) return Promise.reject(new ApiError(`Can’t reach the NewCondo API at ${API_URL}. Is combined-backend running?`, null, url));
  return Promise.reject(new ApiError(err.response?.data?.message ?? err.message, status, url));
});

export default api;
export const unwrap = <T,>(r: { data: { data: T } }): T => {
  if (!r || typeof r.data !== "object" || r.data === null || !("data" in r.data)) {
    throw new ApiError("The API returned an unexpected response — check NEXT_PUBLIC_API_URL points at combined-backend (…/api/v1).", null);
  }
  return r.data.data;
};
