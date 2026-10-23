// backend/shared/src/utils/callReminder.ts
// ============================================================
// "Flash" reminder calls — ring a phone until someone picks up, then hang up.
// Used by vendor-service before fumigation / inspection visits so someone is
// at the property to hand the vendor the visit code. No message is played:
// the caller ID is Newcondo's saved number, which is the reminder.
//
// Provider: Africa's Talking Voice (Nigerian numbers, NGN billing).
//   1. placeCall()  → POST https://voice.africastalking.com/call
//   2. AT calls VOICE_CALLBACK_URL when the call is ANSWERED (isActive=1).
//      Our handler answers with an EMPTY <Response/>, which ends the call
//      immediately — "cut on pickup". (combined-backend routes/vendors.ts)
//   3. AT calls again when the session ends (isActive=0, hangupCause, duration).
//
// Env:  CALL_REMINDER_PROVIDER = africastalking | log   (default: log)
//       AT_USERNAME, AT_API_KEY, AT_VOICE_NUMBER (+234…)
// The "log" provider never dials — safe for local dev and staging.
// ============================================================
import axios from "axios";

export interface PlacedCall { provider: string; providerCallId: string | null; }
export interface CallReminderProvider { name: string; placeCall(toE164: string): Promise<PlacedCall>; }

/** 0803… / 234803… / +234803… → +234803… ; null when it isn't a NG mobile. */
export function toNigerianE164(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const d = phone.replace(/\D/g, "");
  const local = d.startsWith("234") ? d.slice(3) : d.startsWith("0") ? d.slice(1) : d;
  return /^[789][01]\d{8}$/.test(local) ? `+234${local}` : null;
}

const logProvider: CallReminderProvider = {
  name: "log",
  async placeCall(to) {
    console.log(`[callReminder:log] would ring ${to}`);
    return { provider: "log", providerCallId: `log-${Date.now()}` };
  },
};

const africasTalking: CallReminderProvider = {
  name: "africastalking",
  async placeCall(to) {
    const { AT_USERNAME, AT_API_KEY, AT_VOICE_NUMBER } = process.env;
    if (!AT_USERNAME || !AT_API_KEY || !AT_VOICE_NUMBER) throw new Error("Africa's Talking voice is not configured");
    const body = new URLSearchParams({ username: AT_USERNAME, from: AT_VOICE_NUMBER, to });
    const res = await axios.post("https://voice.africastalking.com/call", body.toString(), {
      headers: { apiKey: AT_API_KEY, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15_000,
    });
    const entry = res.data?.entries?.[0];
    if (!entry || entry.status !== "Queued") throw new Error(`Call not queued: ${entry?.status ?? res.data?.errorMessage ?? "unknown"}`);
    return { provider: "africastalking", providerCallId: entry.sessionId ?? null };
  },
};

export function getCallReminderProvider(): CallReminderProvider {
  return process.env.CALL_REMINDER_PROVIDER === "africastalking" ? africasTalking : logProvider;
}

/** The XML that ends an answered call at once. */
export const HANG_UP_XML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
