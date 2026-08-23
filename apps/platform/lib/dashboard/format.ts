/** Money & misc formatters for the dashboard. */
export const ngn = (n: number) => "₦" + Math.abs(n).toLocaleString("en-NG");
export const signNgn = (n: number) => (n < 0 ? "−" : "+") + ngn(n);
export const hoursLabel = (h: number) => (h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h`);
export const minsLabel = (m: number) => `${Math.floor(m / 60)}h ${m % 60}m`;

/* ============================================================
   NAMES

   Nigerian names cannot be split into "first" and "last" reliably:

     • Ordering varies. "Okafor Chinedu" (surname first, common in formal and
       official contexts) and "Chinedu Okafor" are both normal, and nothing in
       the string says which is which.
     • Length varies. Three- and four-part names are ordinary — an Igbo given
       name plus a Christian name plus a surname, for instance.
     • Honorifics are common in typed input: Mr, Mrs, Chief, Dr, Engr, Barr,
       Alhaji, Hon, Pastor.

   So we NEVER reorder a name and never guess which part is the family name.
   We render it exactly as the person wrote it, and take initials from the
   first two meaningful parts IN WRITTEN ORDER. That is correct under every
   ordering convention, because it makes no claim about which part is which.

   (The old rule took first-word + LAST-word, which is a Western "First Last"
   assumption: for "Chinedu Chukwuemeka Okafor" it produced "CO", silently
   skipping the middle name, and for a surname-first name it inverted the
   initials people expect.)

   Where the name comes from, in every case, is the person's own writing:
     • email form → one "Full name" field, typed by them
     • Google     → `name`, the display name they set on their Google account
     • Facebook   → `name`, their profile name
   NextAuth persists only that single `name` string, so ordering is always
   theirs. Rendering it verbatim is both simplest and most respectful.
   ============================================================ */

const HONORIFICS = new Set([
  "mr", "mrs", "ms", "miss", "master", "dr", "prof", "engr", "engineer",
  "barr", "barrister", "arc", "arch", "chief", "alhaji", "alhaja", "hon",
  "honourable", "pastor", "rev", "reverend", "sir", "lady", "elder", "deacon",
  "evang", "evangelist", "amb", "ambassador", "capt", "col", "gen",
]);

/** Split a name into meaningful parts: no honorifics, no punctuation-only bits. */
function nameParts(name?: string | null): string[] {
  return (name ?? "")
    .replace(/[.,]/g, " ")
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .filter((w) => !HONORIFICS.has(w.toLowerCase()));
}

/**
 * Initials from the first two parts, in the order written.
 * "Chinedu Okafor" → CO · "Okafor Chinedu" → OC · "Mr Chinedu Okafor" → CO
 * Single name → its first two letters. No name → the email's first letter.
 */
export function initialsOf(name?: string | null, email?: string | null): string {
  const parts = nameParts(name);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const local = (email ?? "").split("@")[0];
  return (local || "?").slice(0, 1).toUpperCase();
}

/** Back-compat single-arg form used across the dashboard. */
export const initials = (name: string) => initialsOf(name);

/**
 * What to show as the person's name. Falls back to the email's local part
 * rather than any placeholder — showing someone else's name is worse than
 * showing a plain handle.
 */
export function displayName(name?: string | null, email?: string | null): string {
  const trimmed = (name ?? "").trim();
  if (trimmed) return trimmed;
  const local = (email ?? "").split("@")[0];
  return local || "Your account";
}

/** First name for greetings — the first part as written, honorifics dropped. */
export function greetingName(name?: string | null, email?: string | null): string {
  const parts = nameParts(name);
  if (parts.length) return parts[0];
  return displayName(name, email);
}
