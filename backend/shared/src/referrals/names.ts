// backend/shared/src/referrals/names.ts
/** "Ada Okafor" → "Ada O." — the only form a referee/referrer name is shown in. */
export function maskName(full?: string | null): string {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A Newcondo member";
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}
