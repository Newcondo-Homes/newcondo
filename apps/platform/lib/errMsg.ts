/* ============================================================
   errMsg — always give the toast a STRING.

   Sonner renders `description` as a React child. If it receives an object it
   throws:

       Objects are not valid as a React child
       (found: object with keys {code, message, stack, originalMessage})

   …which crashes the whole dashboard layout, because the Toaster sits above
   the page in the tree. A failed photo upload should show a message, not take
   the app down.

   `(e as Error).message` is not enough: our apiClient throws a PLAIN OBJECT,
   not an Error, and AWS/Smithy failures surface as
   { code, message, stack, originalMessage } where `message` can itself be an
   object. This walks whatever it's given until it finds a real string.
   ============================================================ */

export function errMsg(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (e == null) return fallback;
  if (typeof e === "string") return e || fallback;

  if (typeof e === "object") {
    const o = e as Record<string, unknown>;
    // Order matters: `error` and `message` are what our API returns, the
    // Smithy-specific keys come last so a friendly message wins over a raw one.
    for (const k of ["error", "message", "originalMessage", "description", "detail", "code"]) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) return v;
      // One level of nesting — e.g. { message: { message: "…" } }.
      if (v && typeof v === "object") {
        const inner = errMsg(v, "");
        if (inner) return inner;
      }
    }
  }

  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
