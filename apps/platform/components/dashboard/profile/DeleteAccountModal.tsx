"use client";

/* ============================================================
   components/dashboard/profile/DeleteAccountModal.tsx

   The delete dialog. Four steps, and the order is the argument:

     1. WHAT HAPPENS  — what goes, what stays, when. Role-specific, with real
                        counts pulled from the preview. If there are blockers we
                        stop here and show them instead of a confirm button.
     2. WHY           — reason picker. Optional, skippable, and never a gate.
     3. CONFIRM       — password (or emailed code for social-only accounts) plus
                        the typed phrase. Two independent proofs, because a live
                        session on an unlocked laptop is not consent.
     4. DONE          — the date, the reference, and the way back.

   Deliberately NOT here: a "we're sad to see you go" screen, a discount offer,
   or a pre-ticked "pause instead". The take-listings-down alternative is
   offered once, in step 1, as a plain link.
   ============================================================ */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@newcondo/auth/client";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn } from "@/components/dashboard/primitives";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { cx } from "@/lib/cx";
import { errMsg } from "@/lib/errMsg";
import { ACCOUNT_DELETION } from "@/lib/constants/business";
import {
  getDeletionPreview, requestAccountDeletion, sendDeletionOtp,
  type DeletionPreview,
} from "@/lib/api/account-deletion";

const fmtDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

/* What is destroyed, per role — mirrors accountAnonymization.service.ts exactly.
   If that file changes, this list changes with it. */
function erasedItems(p: DeletionPreview): string[] {
  const base = [
    "Your name, email address, phone number, date of birth and home address",
    "Your BVN and every identity document you uploaded",
    "Your Facebook and Google sign-in links",
    "Your saved bank accounts and payout details",
  ];
  if (p.role === "OWNER")
    return [
      ...base,
      `All ${p.summary.photos} property photos and every ownership document you uploaded`,
      "The exact address and GPS boundary of your marked properties",
      p.summary.properties > 0
        ? `${p.summary.properties} propert${p.summary.properties === 1 ? "y" : "ies"} — closed, and any with no payment history removed entirely`
        : "Your draft listings",
    ];
  if (p.role === "AGENT")
    return [
      ...base,
      `Your promotion and share links${p.summary.listingsAsAgent ? `, and your name on ${p.summary.listingsAsAgent} listing${p.summary.listingsAsAgent === 1 ? "" : "s"} you manage` : ""}`,
      "Your marking availability, service areas and reliability score",
    ];
  return [...base, "Your saved searches, enquiries and unused invitations"];
}

export function DeleteAccountModal({ email, onClose }: { email: string; onClose: () => void }) {
  const router = useRouter();
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [phrase, setPhrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ code: string; date: string } | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  /* The backend already deleted every Session and RefreshToken row, so other
     devices are dead. THIS device still holds a valid NextAuth cookie, and a
     router.push("/login") does not clear it — middleware sees a live session and
     bounces straight back to the dashboard, which is the bug. signOut() with
     redirect:true clears the cookie server-side and only then navigates. */
  const finishAndSignOut = async () => {
    setSigningOut(true);
    try {
      localStorage.removeItem("nc-dash-role");
    } catch {}
    try {
      await signOut({ callbackUrl: "/login?deleted=1", redirect: true });
    } catch {
      // Last resort: a hard navigation still leaves the cookie, but middleware
      // will refuse the deactivated account on the next request.
      window.location.href = "/login?deleted=1";
    }
  };
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // A failed preview must NOT close the dialog. Closing on error is why this
    // flashed open and vanished with only a toast: the user clicked a
    // destructive action and got no explanation of what happened. Show the
    // failure in place, with a retry.
    getDeletionPreview()
      .then(setPreview)
      .catch((e) => setLoadError(errMsg(e)));
  }, []);

  function retry() {
    setLoadError(null);
    getDeletionPreview()
      .then(setPreview)
      .catch((e) => setLoadError(errMsg(e)));
  }

  const phraseOk = phrase === ACCOUNT_DELETION.confirmPhrase;
  const proofOk = preview?.reauth === "PASSWORD" ? password.length > 0 : otp.trim().length >= 4;

  async function submit() {
    if (!phraseOk || !proofOk) return;
    setBusy(true);
    try {
      const r = await requestAccountDeletion({
        password: preview?.reauth === "PASSWORD" ? password : undefined,
        otp: preview?.reauth === "OTP" ? otp.trim() : undefined,
        reason: reason || undefined,
        reasonNote: note.trim() || undefined,
        confirmPhrase: phrase,
      });
      setReceipt({ code: r.confirmationCode, date: r.anonymizeAfter });
      setStep(4);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <Modal title="We couldn't load your account details" onClose={onClose}
        sub="Nothing has changed — your account is untouched."
        footer={<>
          <DBtn variant="line" onClick={onClose}>Close</DBtn>
          <DBtn variant="dark" onClick={retry}>Try again</DBtn>
        </>}>
        <div className="flex flex-col gap-3.5">
          <div className="rounded-2xl border border-border-hair bg-surface-sunken px-4 py-3.5 text-[13.5px] leading-[1.55] text-text-secondary">
            Before we close an account we check what would be deleted and whether anything is still open — an active
            tenancy, a payment still settling, money owed to you. We couldn&rsquo;t complete that check, so we haven&rsquo;t
            started anything.
            <div className="mt-2.5 font-mono text-[12px] text-text-tertiary">{loadError}</div>
          </div>
          <p className="mb-0 text-[13px] leading-[1.55] text-text-tertiary">
            You can also delete your account by emailing{" "}
            <a href="mailto:info@newcondo.homes" className="font-semibold text-ink underline underline-offset-4">info@newcondo.homes</a>{" "}
            from this address — we action verified requests within 30 days.
          </p>
        </div>
      </Modal>
    );
  }

  if (!preview) {
    return (
      <Modal title="Delete account" onClose={onClose}>
        <div className="h-40 animate-pulse rounded-2xl bg-surface-sunken" />
      </Modal>
    );
  }

  const erasureDate = fmtDate(new Date(Date.now() + preview.graceDays * 86400000));

  /* ---------- blocked ---------- */
  if (preview.blockers.length > 0 && step < 4) {
    return (
      <Modal title="Not yet — a few things are still open" onClose={onClose}
        sub="We can close your account once these are settled. Each one belongs to somebody else as well as you."
        footer={<DBtn variant="line" onClick={onClose}>Close</DBtn>}>
        <div className="flex flex-col gap-3">
          {preview.blockers.map((b) => (
            <div key={b.code} className="rounded-2xl border border-border-hair bg-surface-sunken p-4">
              <div className="flex items-start gap-3">
                <Icon name="alert-circle" size={18} className="mt-[2px] shrink-0 text-danger" />
                <div className="min-w-0">
                  <div className="text-[14.5px] font-semibold">{b.title}</div>
                  <p className="mb-0 mt-1 text-[13.5px] leading-[1.55] text-text-secondary [text-wrap:pretty]">{b.detail}</p>
                  <button onClick={() => router.push(b.fix)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink underline underline-offset-4">
                    {b.fixLabel}<Icon name="arrow-right" size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <p className="mb-0 mt-1 text-[13px] leading-[1.55] text-text-tertiary">
            You can still hide everything in the meantime — take your listings down from My Properties, or email{" "}
            <a href="mailto:info@newcondo.homes" className="font-semibold text-ink underline underline-offset-4">info@newcondo.homes</a> if
            you think one of these is wrong.
          </p>
        </div>
      </Modal>
    );
  }

  /* ---------- 1. what happens ---------- */
  if (step === 1) {
    return (
      <Modal title="Delete your account" onClose={onClose} wide
        sub={`You'll be signed out today. Nothing is erased for ${preview.graceDays} days — sign in before ${erasureDate} and everything comes back.`}
        footer={<>
          <button onClick={onClose} className="mr-auto text-left text-[13.5px] font-semibold text-text-secondary underline underline-offset-4 hover:text-ink max-sm:mr-0">
            {preview.role === "RENTER" ? "Keep my account" : "Just hide my listings instead"}
          </button>
          <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
          <DBtn variant="danger" onClick={() => setStep(2)}>Continue</DBtn>
        </>}>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <section className="rounded-2xl border border-border-hair bg-surface p-4">
            <div className="mb-2.5 flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-danger">
              <Icon name="trash-2" size={15} />Erased on {erasureDate}
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {erasedItems(preview).map((t) => (
                <li key={t} className="flex gap-2 text-[13.5px] leading-[1.5] text-text-secondary">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-danger" />{t}
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-border-hair bg-surface-sunken p-4">
            <div className="mb-2.5 flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              <Icon name="archive" size={15} />Kept, without your name
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {preview.retained.map((t) => (
                <li key={t} className="flex gap-2 text-[13.5px] leading-[1.5] text-text-secondary">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-text-tertiary" />{t}
                </li>
              ))}
            </ul>
            <p className="mb-0 mt-3 border-t border-border-hair pt-3 text-[12.5px] leading-[1.5] text-text-tertiary">
              Those records are destroyed after {preview.retentionMonths} months, except where tax or anti-money-laundering
              law requires longer. <a href="/privacy#deletion" className="font-semibold text-ink underline underline-offset-4">Privacy Policy §13</a>
            </p>
          </section>
        </div>

        {preview.summary.referralCredits > 0 && (
          <div className="mt-3.5 rounded-2xl border border-warn-line/40 bg-warn-wash px-4 py-3 text-[13.5px] leading-[1.5] text-text-secondary">
            You have <b className="font-mono text-ink">₦{preview.summary.referralCredits.toLocaleString("en-NG")}</b> in referral
            credits. Credits are not transferable and are lost when the account closes. (Referral earnings owed to you in
            cash are different — those have to be paid out before you can delete.)
          </div>
        )}
      </Modal>
    );
  }

  /* ---------- 2. reason ---------- */
  if (step === 2) {
    return (
      <Modal title="Why are you leaving?" onClose={onClose} sub="Optional, and it doesn't change anything about your request."
        footer={<>
          <DBtn variant="ghost" onClick={() => setStep(1)} className="mr-auto max-sm:mr-0">Back</DBtn>
          <DBtn variant="line" onClick={() => setStep(3)}>Skip</DBtn>
          <DBtn variant="danger" onClick={() => setStep(3)}>Continue</DBtn>
        </>}>
        <div className="flex flex-col gap-2">
          {ACCOUNT_DELETION.reasons.map((r) => (
            <button key={r} onClick={() => setReason(r)}
              className={cx("flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-[14px] transition-colors",
                reason === r ? "border-ink bg-surface-sunken font-semibold" : "border-border-hair bg-surface hover:bg-surface-sunken")}>
              {r}{reason === r && <Icon name="check" size={16} />}
            </button>
          ))}
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Anything else you want us to know (optional)"
            className="mt-1 w-full resize-none rounded-2xl border border-border-hair bg-surface px-4 py-3 text-[14px] outline-none placeholder:text-text-tertiary focus:border-border-strong" />
        </div>
      </Modal>
    );
  }

  /* ---------- 3. confirm ---------- */
  if (step === 3) {
    return (
      <Modal title="Confirm it's you" onClose={onClose}
        sub={preview.reauth === "PASSWORD"
          ? "Two proofs, because this can't be undone after the window closes."
          : preview.hasOAuth
            ? `Your account signs in with Facebook or Google, so we'll email a code to ${email}.`
            : `Your account doesn't have a password, so we'll email a code to ${email}.`}
        footer={<>
          <DBtn variant="ghost" onClick={() => setStep(2)} className="mr-auto max-sm:mr-0">Back</DBtn>
          <DBtn variant="danger" disabled={!phraseOk || !proofOk || busy} onClick={submit}>
            {busy ? "Closing account…" : "Delete my account"}
          </DBtn>
        </>}>
        <div className="flex flex-col gap-3.5">
          {preview.reauth === "PASSWORD" ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-semibold text-text-secondary">Your password</span>
              <input type="password" value={password} autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-border-hair bg-surface px-4 py-3 text-[15px] outline-none focus:border-border-strong" />
            </label>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between text-[13px] font-semibold text-text-secondary">
                Emailed code
                <button onClick={() => sendDeletionOtp(email).then(() => toast.success("Code sent")).catch((e) => toast.error(errMsg(e)))}
                  className="font-semibold text-ink underline underline-offset-4">Send code</button>
              </span>
              <input inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="000000"
                className="w-full rounded-2xl border border-border-hair bg-surface px-4 py-3 font-mono text-[18px] tracking-[0.3em] outline-none focus:border-border-strong" />
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-text-secondary">
              Type <span className="font-mono text-ink">{ACCOUNT_DELETION.confirmPhrase}</span> to confirm
            </span>
            <input value={phrase} onChange={(e) => setPhrase(e.target.value)} autoCapitalize="characters"
              className={cx("w-full rounded-2xl border bg-surface px-4 py-3 font-mono text-[15px] outline-none",
                phrase && !phraseOk ? "border-danger" : "border-border-hair focus:border-border-strong")} />
          </label>

          <div className="rounded-2xl bg-surface-sunken px-4 py-3 text-[13px] leading-[1.55] text-text-secondary">
            Erasure runs on <b className="text-ink">{erasureDate}</b>. Until then, signing in restores everything.
            We'll email you 14, 7 and 1 day before.
          </div>
        </div>
      </Modal>
    );
  }

  /* ---------- 4. done ---------- */
  return (
    <Modal title="Your account is closed" onClose={finishAndSignOut}
      sub={`You're signed out now. Nothing is erased until ${receipt ? fmtDate(receipt.date) : erasureDate}.`}
      footer={<DBtn variant="dark" disabled={signingOut} onClick={finishAndSignOut}>
        {signingOut ? "Signing out…" : "Done"}
      </DBtn>}>
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-border-hair bg-surface-sunken px-4 py-3.5">
          <div className="flex items-center justify-between gap-3 border-b border-border-hair pb-2.5 text-[13px] text-text-secondary">
            Permanent erasure<span className="font-semibold text-ink">{receipt ? fmtDate(receipt.date) : erasureDate}</span>
          </div>
          <div className="flex items-center justify-between gap-3 pt-2.5 text-[13px] text-text-secondary">
            Reference<span className="truncate font-mono text-[12.5px] text-ink">{receipt?.code}</span>
          </div>
        </div>
        <p className="mb-0 text-[13.5px] leading-[1.55] text-text-secondary">
          We've emailed a confirmation. Changed your mind? Sign in with the same details before that date and your account
          comes back exactly as it was.
        </p>
      </div>
    </Modal>
  );
}
