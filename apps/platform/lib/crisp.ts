/* ============================================================
   Crisp live-chat SDK wrapper.

   A thin, typed layer over the Crisp JS SDK (https://crisp.chat).
   Everything the app touches goes through here so the rest of the
   codebase never pokes at the raw `window.$crisp` command queue.

   How Crisp persistence works (important for the requirements):
   -----------------------------------------------------------------
   Crisp stores the visitor's session + full conversation history in
   the BROWSER itself (localStorage, keyed by the website id). So a
   visitor who reloads, or comes back tomorrow on the same device,
   keeps their chat history automatically — we don't manage it.

   • Anonymous visitors  → Crisp's own browser-stored session.
   • Registered users     → we additionally pin the session to a stable
     CRISP_TOKEN_ID derived from their account id, so their history
     follows the account (and we pre-fill their name/email/phone in
     the Crisp dashboard via setIdentity()).

   "New chat" → resetChat() wipes the current conversation and starts a
   fresh session (Crisp `session:reset`), clearing the saved history.

   👉 SETUP: set NEXT_PUBLIC_CRISP_WEBSITE_ID in your env (see
   .env.local.example). Without it, the chat silently no-ops.
   ============================================================ */

/* The Crisp command queue is an array you push tuples onto; once l.js
   loads it swaps in a real object with the same push() signature plus
   get()/is()/off(). We model the parts we use. */
type CrispCommand = unknown[];

interface CrispQueue extends Array<CrispCommand> {
  push: (command: CrispCommand) => number;
  get?: (namespace: string) => unknown;
  is?: (state: string) => boolean;
}

declare global {
  interface Window {
    $crisp?: CrispQueue;
    CRISP_WEBSITE_ID?: string;
    CRISP_TOKEN_ID?: string;
    CRISP_RUNTIME_CONFIG?: Record<string, unknown>;
  }
}

const SCRIPT_ID = "crisp-sdk";
const SCRIPT_SRC = "https://client.crisp.chat/l.js";

/** The website id from env, or "" when unconfigured. */
export function getWebsiteId(): string {
  return process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID?.trim() || "";
}

/** True when a website id is present (and so chat can actually boot). */
export function isCrispConfigured(): boolean {
  return getWebsiteId().length > 0;
}

/** Safe push onto the Crisp queue (no-ops on the server / before boot). */
export function crispPush(command: CrispCommand): void {
  if (typeof window === "undefined") return;
  window.$crisp?.push(command);
}

/**
 * Inject the Crisp script exactly once and start the session. Optionally
 * pins the session to a stable token (for signed-in users). Returns true
 * if Crisp is (or is being) loaded, false when unconfigured.
 */
export function loadCrisp(opts?: { tokenId?: string }): boolean {
  if (typeof window === "undefined") return false;
  const websiteId = getWebsiteId();
  if (!websiteId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[crisp] NEXT_PUBLIC_CRISP_WEBSITE_ID is not set — live chat is disabled. " +
          "Add it to .env.local to enable the chat bubble."
      );
    }
    return false;
  }

  // Pin the session to the user's account (must be set BEFORE l.js runs).
  if (opts?.tokenId) window.CRISP_TOKEN_ID = opts.tokenId;

  window.$crisp = window.$crisp || ([] as unknown as CrispQueue);
  window.CRISP_WEBSITE_ID = websiteId;

  if (document.getElementById(SCRIPT_ID)) return true; // already injected

  const s = document.createElement("script");
  s.id = SCRIPT_ID;
  s.src = SCRIPT_SRC;
  s.async = true;
  document.head.appendChild(s);
  return true;
}

/* ---- Visibility -------------------------------------------------- */
/* We supply our own launcher (the NewCondo bubble), so Crisp's default
   launcher stays hidden until there's something the user should see. */
export function hideDefaultLauncher(): void {
  crispPush(["do", "chat:hide"]);
}
export function showDefaultLauncher(): void {
  crispPush(["do", "chat:show"]);
}

/* ---- Open / close ------------------------------------------------ */
export function openChat(): void {
  crispPush(["do", "chat:show"]);
  crispPush(["do", "chat:open"]);
}
export function closeChat(): void {
  crispPush(["do", "chat:close"]);
}

/**
 * Start a brand-new conversation: clears the current session + its
 * locally-saved history, then re-opens a fresh chat. This is what the
 * "New chat" control calls.
 */
export function resetChat(): void {
  crispPush(["do", "session:reset"]);
}

/* ---- Identity pre-fill ------------------------------------------- */
export interface CrispIdentity {
  name?: string;
  email?: string;
  phone?: string;
  /** Arbitrary key/value pairs surfaced on the Crisp conversation. */
  data?: Record<string, string>;
}

/** Pre-fill the visitor's identity in the Crisp dashboard. */
export function setIdentity(identity: CrispIdentity): void {
  if (identity.email) crispPush(["set", "user:email", [identity.email]]);
  if (identity.name) crispPush(["set", "user:nickname", [identity.name]]);
  if (identity.phone) crispPush(["set", "user:phone", [identity.phone]]);
  if (identity.data) {
    const pairs = Object.entries(identity.data).map(([k, v]) => [k, v]);
    if (pairs.length) crispPush(["set", "session:data", [pairs]]);
  }
}

/* ---- Events ------------------------------------------------------ */
type CrispEvent =
  | "session:loaded"
  | "message:received"
  | "message:sent"
  | "chat:opened"
  | "chat:closed";

/** Subscribe to a Crisp event. */
export function onCrisp(event: CrispEvent, handler: (...args: unknown[]) => void): void {
  crispPush(["on", event, handler]);
}

/** Best-effort read of the current unread message count. */
export function getUnreadCount(): number {
  if (typeof window === "undefined") return 0;
  const n = window.$crisp?.get?.("chat:unread:count");
  return typeof n === "number" ? n : 0;
}
