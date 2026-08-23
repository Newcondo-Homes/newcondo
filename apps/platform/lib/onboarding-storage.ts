/* ============================================================
   Onboarding persistence

   THE PROBLEM THIS SOLVES
   Onboarding is the one flow where leaving the browser is REQUIRED: we email
   a verification code, so the user must switch to their mail app to read it.
   On mobile that means the tab is backgrounded and — on iOS especially — often
   discarded outright to reclaim memory. React state dies with it, so they came
   back to an empty form and started over. Some users never got past this.

   WHAT IS PERSISTED, AND WHERE — the split is deliberate:

     localStorage   phase · role · name · email · phone · plan id
                    Survives a full browser quit, which is what the user asked
                    for. None of it is a credential; it is the same information
                    they are about to publish on a listing.

     sessionStorage password only
                    Survives reloads and app-switching within the same tab
                    (which covers the go-read-the-email case), but is gone the
                    moment the browser is closed. A plaintext password sitting
                    in localStorage indefinitely is a real risk: shared phones,
                    XSS, and browser-profile sync all read it. Session scope
                    keeps the convenience without the durable liability.

   So a cold restart restores the whole flow and re-asks ONLY for the password.
   That is a deliberate trade: one field re-typed instead of a stored secret.

   TTL: 24h. An abandoned half-onboarding shouldn't resurrect a week later with
   a stale OTP and a plan price that may have changed.
   ============================================================ */

// import { UserType } from "@/types/api";

// const KEY = "nc.onboarding.v1";
// const PW_KEY = "nc.onboarding.pw.v1";
// const TTL_MS = 24 * 60 * 60 * 1000;

// /** Phases worth resuming into. `payment` is excluded on purpose — see load(). */
// export type SavedPhase = "register" | "verify" | "details" | "plan";

// export interface SavedOnboarding {
//   phase: SavedPhase;
//   /** Which sub-step of the form they reached, so we don't bounce them back. */
//   formStep?: "user-type" | "details";
//   role?: UserType;
//   name?: string;
//   email?: string;
//   phone?: string;
//   agreeToTerms?: boolean;
//   /** Plan id only — the price/feature list is re-read from source, never trusted from storage. */
//   planId?: string;
//   /** When the current OTP was issued, so we can avoid re-sending a live code. */
//   otpSentAt?: number;
//   updatedAt: number;
// }

// const canUse = () => typeof window !== "undefined";

// /** Merge a partial patch into whatever is already stored. */
// export function saveOnboarding(patch: Partial<Omit<SavedOnboarding, "updatedAt">>): void {
//   if (!canUse()) return;
//   try {
//     const current = readRaw() ?? ({} as SavedOnboarding);
//     const next: SavedOnboarding = { ...current, ...patch, updatedAt: Date.now() };
//     localStorage.setItem(KEY, JSON.stringify(next));
//   } catch {
//     // Private mode / quota / disabled storage — persistence is an enhancement,
//     // never a requirement. The flow must still work without it.
//   }
// }

// /** Password lives in sessionStorage only — see the header. */
// export function savePassword(password: string): void {
//   if (!canUse()) return;
//   try {
//     if (password) sessionStorage.setItem(PW_KEY, password);
//     else sessionStorage.removeItem(PW_KEY);
//   } catch {}
// }

// export function loadPassword(): string {
//   if (!canUse()) return "";
//   try {
//     return sessionStorage.getItem(PW_KEY) ?? "";
//   } catch {
//     return "";
//   }
// }

// function readRaw(): SavedOnboarding | null {
//   if (!canUse()) return null;
//   try {
//     const raw = localStorage.getItem(KEY);
//     if (!raw) return null;
//     const parsed = JSON.parse(raw) as SavedOnboarding;
//     if (!parsed?.updatedAt || Date.now() - parsed.updatedAt > TTL_MS) {
//       clearOnboarding();
//       return null;
//     }
//     return parsed;
//   } catch {
//     return null;
//   }
// }

// export function loadOnboarding(): SavedOnboarding | null {
//   const saved = readRaw();
//   if (!saved) return null;
//   // Never resume straight into `payment`: that phase mounts PaymentProcessing,
//   // which immediately registers and charges. Re-entering it from storage could
//   // fire a second charge for someone who simply reopened the tab. Resuming at
//   // `plan` costs them one tap and makes a duplicate charge impossible.
//   if ((saved.phase as string) === "payment") saved.phase = "plan";
//   return saved;
// }

// export function clearOnboarding(): void {
//   if (!canUse()) return;
//   try {
//     localStorage.removeItem(KEY);
//     sessionStorage.removeItem(PW_KEY);
//   } catch {}
// }

// /**
//  * True when the stored OTP is still likely valid (codes last 10 min), so a
//  * resume should NOT trigger a fresh send. Re-sending would invalidate the code
//  * the user just went to their inbox to fetch — the exact thing this fixes.
//  */
// export function otpStillFresh(otpSentAt?: number): boolean {
//   if (!otpSentAt) return false;
//   return Date.now() - otpSentAt < 9 * 60 * 1000;
// }


/* ============================================================
   Onboarding persistence — post register-first

   WHAT CHANGED, AND WHY THE PASSWORD IS GONE

   The original ask was "persist the password securely". Encrypting it in
   localStorage would not have been secure: the decryption runs in the same
   browser, from the same bundle, with no user input, so the key has to sit
   somewhere the page can read. Anything able to read the ciphertext can read
   the key beside it. That is obfuscation, not encryption.

   So we removed the need instead. Registration now happens at form submit
   rather than after payment, so the password is transmitted once and never
   held anywhere on the client. A user who quits the browser mid-onboarding
   comes back to a live session and the OTP step — no password field, which is
   exactly the outcome that was wanted.

   WHAT THIS FILE STILL DOES: it remembers the PRE-REGISTRATION form only —
   what they typed before an account existed. Once registered, the server is
   authoritative (GET /auth/onboarding-state) and this cache is ignored.

   Nothing here is a credential. 24h TTL so an abandoned attempt does not
   resurrect a week later against a code that expired in ten minutes.
   ============================================================ */

import { UserType } from "@/types/api";

const KEY = "nc.onboarding.v2";
const TTL_MS = 24 * 60 * 60 * 1000;

export interface SavedOnboarding {
  /** Which half of the form they reached, so we don't re-ask the role. */
  formStep?: "user-type" | "details";
  role?: UserType;
  name?: string;
  email?: string;
  phone?: string;
  agreeToTerms?: boolean;
  /** Plan id only — price and features are always re-read from source. */
  planId?: string;
  updatedAt: number;
}

const canUse = () => typeof window !== "undefined";

export function saveOnboarding(patch: Partial<Omit<SavedOnboarding, "updatedAt">>): void {
  if (!canUse()) return;
  try {
    const current = loadOnboarding() ?? ({} as SavedOnboarding);
    localStorage.setItem(KEY, JSON.stringify({ ...current, ...patch, updatedAt: Date.now() }));
  } catch {
    // Private mode, quota, storage disabled. Persistence is an enhancement —
    // the flow must work identically without it.
  }
}

export function loadOnboarding(): SavedOnboarding | null {
  if (!canUse()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedOnboarding;
    if (!parsed?.updatedAt || Date.now() - parsed.updatedAt > TTL_MS) {
      clearOnboarding();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearOnboarding(): void {
  if (!canUse()) return;
  try {
    localStorage.removeItem(KEY);
    // v1 stored a password in sessionStorage. Remove it on sight so anyone
    // mid-flow during the deploy doesn't keep a stale secret in their browser.
    sessionStorage.removeItem("nc.onboarding.pw.v1");
    localStorage.removeItem("nc.onboarding.v1");
  } catch {}
}
