"use client";

/* ============================================================
   components/dashboard/profile/DeleteAccountCard.tsx

   The entry point, at the very bottom of Profile & Settings. Two states:

     normal     — a plain, honest card. Not hidden behind three menus (Meta
                  requires the route to be findable), not styled as a scary red
                  zone either: deleting your account is a right, not a mistake.
     scheduled  — the account is already in the grace window. The card becomes
                  the countdown and the way back.

   Mount in app/(dashboard)/profile/page.tsx under YourDetailsCard:
     <DeleteAccountCard email={profile.email} />
   ============================================================ */

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { DBtn } from "@/components/dashboard/primitives";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { errMsg } from "@/lib/errMsg";
import { cancelAccountDeletion, getDeletionStatus, type DeletionStatus } from "@/lib/api/account-deletion";
import { DeleteAccountModal } from "./DeleteAccountModal";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
const daysLeft = (iso: string) =>
  Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));

export function DeleteAccountCard({ email }: { email: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<DeletionStatus | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { getDeletionStatus().then(setStatus).catch(() => {}); }, []);

  async function restore() {
    setBusy(true);
    try {
      await cancelAccountDeletion();
      toast.success("Your account is active again");
      setStatus({ ...(status as DeletionStatus), scheduled: false });
      router.refresh();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  }

  if (status?.scheduled && status.erasureDate) {
    return (
      <section className="rounded-[20px] border border-danger/30 bg-surface p-5 max-sm:p-4">
        <div className="flex items-start gap-3">
          <Icon name="clock" size={18} className="mt-[3px] shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <h3 className="m-0 text-[16px] font-bold tracking-[-0.02em]">
              Your account is deleted in {daysLeft(status.erasureDate)} days
            </h3>
            <p className="mb-0 mt-1.5 text-[13.5px] leading-[1.55] text-text-secondary [text-wrap:pretty]">
              Everything is erased on <b className="text-ink">{fmtDate(status.erasureDate)}</b> and can't be recovered after
              that. Until then you can bring the account back exactly as it was.
            </p>
            {status.confirmationCode && (
              <p className="mb-0 mt-2 font-mono text-[12px] text-text-tertiary">Ref {status.confirmationCode}</p>
            )}
            <div className="mt-3.5">
              <DBtn variant="dark" disabled={busy} onClick={restore}>
                {busy ? "Restoring…" : "Restore my account"}
              </DBtn>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-[20px] border border-border-hair bg-surface p-5 max-sm:p-4">
        <h3 className="m-0 text-[16px] font-bold tracking-[-0.02em]">Delete your account</h3>
        <p className="mb-0 mt-1.5 max-w-[62ch] text-[13.5px] leading-[1.55] text-text-secondary [text-wrap:pretty]">
          Closes your account and erases your personal data — your name, contact details, identity documents and
          property files. Records we have to keep by law are kept without your name. You have 21 days to change your mind.
        </p>
        <div className="mt-3.5 flex flex-wrap items-center gap-3">
          <DBtn variant="line" onClick={() => setOpen(true)}>
            <Icon name="trash-2" size={15} />Delete account
          </DBtn>
          <a href="/privacy#deletion" className="text-[13px] font-semibold text-text-secondary underline underline-offset-4 hover:text-ink">
            What we keep, and why
          </a>
        </div>
      </section>
      <AnimatePresence>
        {open && <DeleteAccountModal email={email} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
