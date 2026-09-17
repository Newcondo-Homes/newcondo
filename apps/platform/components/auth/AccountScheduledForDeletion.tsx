"use client";

/* ============================================================
   components/auth/AccountScheduledForDeletion.tsx

   Where a deactivated account lands after a correct sign-in. The credentials
   were right, so this is NOT an error screen — it's the restore path, and it is
   the only page a PENDING_DELETION session may reach.

   Two states:
     • inside the window  → restore, one button.
     • already erased     → say so plainly and offer a fresh signup. There is
       nothing to restore and pretending otherwise wastes their time.

   Wire from the login result:
     if (res.accountState === "PENDING_DELETION") → render this
     if (res.error === "ACCOUNT_ERASED")          → render this with erased
   ============================================================ */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { errMsg } from "@/lib/errMsg";
import { cancelAccountDeletion } from "@/lib/api/account-deletion";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

export function AccountScheduledForDeletion({
  erasureDate, erased = false, onSignOut,
}: { erasureDate?: string; erased?: boolean; onSignOut: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const days = erasureDate ? Math.max(0, Math.ceil((new Date(erasureDate).getTime() - Date.now()) / 86400000)) : 0;

  async function restore() {
    setBusy(true);
    try {
      await cancelAccountDeletion();
      toast.success("Welcome back");
      router.push("/dashboard");
    } catch (e) { toast.error(errMsg(e)); setBusy(false); }
  }

  return (
    <div className="mx-auto flex w-full max-w-[440px] flex-col items-center px-5 py-12 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken">
        <Icon name={erased ? "shield-check" : "clock"} size={22} />
      </div>

      {erased ? (
        <>
          <h1 className="m-0 text-[26px] font-bold leading-[1.1] tracking-[-0.035em]">This account was deleted</h1>
          <p className="mb-0 mt-3 text-[14.5px] leading-[1.6] text-text-secondary [text-wrap:pretty]">
            We permanently erased the personal data on this account at your request, so there is nothing left to sign in
            to. You're welcome to create a new account with this email address.
          </p>
          <button onClick={() => router.push("/onboarding")}
            className="mt-6 w-full rounded-full bg-ink px-6 py-3.5 text-[14.5px] font-semibold text-cream transition-all active:scale-[0.97]">
            Create a new account
          </button>
        </>
      ) : (
        <>
          <h1 className="m-0 text-[26px] font-bold leading-[1.1] tracking-[-0.035em]">
            Your account is scheduled for deletion
          </h1>
          <p className="mb-0 mt-3 text-[14.5px] leading-[1.6] text-text-secondary [text-wrap:pretty]">
            Everything is erased {days === 0 ? "today" : `in ${days} day${days === 1 ? "" : "s"}`}
            {erasureDate && <> — on <b className="text-ink">{fmtDate(erasureDate)}</b></>}. Restore it now and your
            properties, payments and history come back exactly as they were. Your listings stay hidden until you switch
            them back on.
          </p>
          <button onClick={restore} disabled={busy}
            className="mt-6 w-full rounded-full bg-ink px-6 py-3.5 text-[14.5px] font-semibold text-cream transition-all active:scale-[0.97] disabled:opacity-55">
            {busy ? "Restoring…" : "Restore my account"}
          </button>
          <button onClick={onSignOut} className="mt-3 text-[13.5px] font-semibold text-text-secondary underline underline-offset-4 hover:text-ink">
            No — continue with the deletion
          </button>
          <p className="mb-0 mt-6 text-[12.5px] leading-[1.55] text-text-tertiary">
            Didn't ask for this? Restore the account and change your password — someone else may have access.
          </p>
        </>
      )}
    </div>
  );
}
