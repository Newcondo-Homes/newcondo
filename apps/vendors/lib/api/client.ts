// apps/vendors/lib/api/client.ts
// ONE axios instance → combined-backend (/api/v1). Attaches the session's
// backend JWT (minted by @newcondo/auth's jwt callback, signed with
// JWT_SECRET) as a Bearer token. No secrets live in the browser; vendor
// identity is resolved server-side from that token by requireVendor.
"use client";
import axios, { AxiosError } from "axios";
import { getSession, signOut } from "@newcondo/auth/client";

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL, timeout: 20_000 });

let cachedToken: { value: string; at: number } | null = null;
const TOKEN_TTL_MS = 10 * 60_000;

/** Called by VendorDataProvider with the token from the server session, so the
 *  first requests skip the /api/auth/session round trip. */
export function primeAccessToken(t: string | undefined) {
  if (t && cachedToken?.value !== t) cachedToken = { value: t, at: Date.now() };
}

async function token(): Promise<string | undefined> {
  if (cachedToken && Date.now() - cachedToken.at < TOKEN_TTL_MS) return cachedToken.value;
  const s = (await getSession()) as { accessToken?: string } | null;
  if (s?.accessToken) cachedToken = { value: s.accessToken, at: Date.now() };
  return s?.accessToken;
}

api.interceptors.request.use(async (cfg) => {
  const t = await token();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(undefined, async (err: AxiosError<{ message?: string }>) => {
  if (err.response?.status === 401) { cachedToken = null; await signOut({ redirectTo: "/login" }); }
  return Promise.reject(new Error(err.response?.data?.message ?? err.message));
});

export default api;
export const unwrap = <T,>(r: { data: { data: T } }): T => r.data.data;
