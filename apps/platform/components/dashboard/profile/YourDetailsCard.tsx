"use client";

/* ============================================================
   YourDetailsCard — the Profile tab's identity card.

   Reads the AUTHORITATIVE profile (GET /auth/profile), not the session. JWT
   claims are minted at sign-in and refreshed only on update(), so a settings
   page driven by the session can show a name the user changed minutes ago on
   another device.

   TWO TIERS, because the fields are not equally dangerous:

     name           → Save. Cosmetic, so no friction.
     email / phone  → password, then a code sent to the NEW value, then commit.

   Email and phone are password-RESET channels: whoever controls them controls
   the account. So changing one must prove (a) it is really the owner, not
   someone on an unlocked laptop — the password — and (b) that the new address
   or number actually reaches them — the code. The value is parked server-side
   and committed only after the code verifies, so a typo can never leave the
   account pointing at a mailbox its owner cannot read.
   ============================================================ */

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { errMsg } from "@/lib/errMsg";
import { Card, CardH, DBtn, Banner, StatusBadge } from "@/components/dashboard/primitives";
import { Modal } from "@/components/dashboard/Modal";
import { Field, inputCls } from "@/components/dashboard/NCSelect";
import { initialsOf, displayName } from "@/lib/dashboard/format";
import { ROLE_LABEL } from "@/components/dashboard/Sidebar";
import * as papi from "@/lib/api/profile-settings";
import type { ProfileRecord } from "@/lib/api/profile-settings";
import * as api from "@/lib/api/dashboard";
import type { Role } from "@/lib/dashboard/data";

const joined = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : "—";

export function YourDetailsCard({ role, fallback }: { role: Role; fallback: { name: string; email: string } }) {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Which sensitive field is being changed, if any.
  const [changing, setChanging] = useState<null | "email" | "phone">(null);

  const load = async () => {
    if (!api.isLiveBackend) { setLoading(false); return; }
    try {
      const p = await papi.getProfile();
      setProfile(p);
      setName(p.name ?? "");
    } catch (e) {
      toast.error("Couldn't load your profile", { description: errMsg(e, "Please refresh.") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const shownName = displayName(profile?.name ?? fallback.name, profile?.email ?? fallback.email);
  const shownEmail = profile?.email ?? fallback.email;
  const dirty = name.trim() !== (profile?.name ?? "").trim() && name.trim().length > 0;

  const saveName = async () => {
    setSavingName(true);
    try {
      if (api.isLiveBackend) await papi.updateProfileFields({ name: name.trim() });
      else await new Promise((r) => setTimeout(r, 700));
      setProfile((p) => (p ? { ...p, name: name.trim() } : p));
      toast.success("Name updated");
    } catch (e) {
      toast.error("Couldn't save your name", { description: errMsg(e, "Please try again.") });
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardH title="Your details" />
        <div className="h-[260px] animate-pulse rounded-2xl bg-surface-sunken" />
      </Card>
    );
  }

  return (
    <Card>
      <CardH title="Your details" />

      <div className="mb-4 flex items-center gap-3.5">
        <div className="grid size-14 flex-none place-items-center rounded-full bg-ink text-lg font-bold text-cream">
          {initialsOf(profile?.name ?? fallback.name, shownEmail)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-[16px] font-bold">{shownName}</div>
          {/* //TODO: joined at is not showing */}
          <div className="text-[13px] text-text-tertiary">
            {ROLE_LABEL[role]} · joined {joined(profile?.createdAt)}
          </div>
        </div>
      </div>

      {/* ---- name: cheap, saves in place ---- */}
      <Field label="Full name" hint="Written exactly as you enter it — we never reorder it.">
        <input className={inputCls()} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
      </Field>
      {dirty && (
        <div className="mb-3.5">
          <DBtn sm onClick={saveName} disabled={savingName}>
            {savingName ? <><Icon name="loader" size={13} className="animate-spin" />Saving…</> : <><Icon name="check" size={13} />Save name</>}
          </DBtn>
        </div>
      )}

      {/* ---- email + phone: read-only here, changed through the verified flow ---- */}
      <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
        <ReadOnlyContact
          label="Email"
          value={shownEmail}
          verified={!!profile?.emailVerified}
          onChange={() => setChanging("email")}
        />
        <ReadOnlyContact
          label="Phone"
          value={profile?.phone ?? "Not added yet"}
          verified={!!profile?.phoneVerified}
          onChange={() => setChanging("phone")}
        />
      </div>

      <div className="mt-3">
        <Banner icon="shield-check">
          Your email and phone are how we reset your password and send payment receipts, so changing
          either needs your password and a confirmation code.
        </Banner>
      </div>

      <AnimatePresence>
        {changing && (
          <ContactChangeModal
            key={changing}
            field={changing}
            current={changing === "email" ? shownEmail : profile?.phone ?? ""}
            onClose={() => setChanging(null)}
            onDone={async () => { setChanging(null); await load(); }}
          />
        )}
      </AnimatePresence>
    </Card>
  );
}

function ReadOnlyContact({
  label, value, verified, onChange,
}: { label: string; value: string; verified: boolean; onChange: () => void }) {
  return (
    <div className="mb-3.5">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-[13px] font-semibold text-text-primary">{label}</label>
        <button
          type="button"
          onClick={onChange}
          className="flex items-center gap-1 text-[12.5px] font-semibold text-green-dark transition-colors hover:cursor-pointer hover:text-ink"
        >
          <Icon name="pencil-line" size={12} />Change
        </button>
      </div>
      <div className="flex items-center gap-2 rounded-[14px] border border-nc-border bg-surface-sunken/60 px-4 py-3">
        <span className="min-w-0 flex-1 truncate text-[14.5px] text-text-primary">{value}</span>
        {verified
          ? <StatusBadge s="VERIFIED">Verified</StatusBadge>
          : <StatusBadge s="PENDING_MARKING">Unverified</StatusBadge>}
      </div>
    </div>
  );
}

/* ---------------- the two-step change ---------------- */
function ContactChangeModal({
  field, current, onClose, onDone,
}: {
  field: "email" | "phone";
  current: string;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [step, setStep] = useState<"enter" | "code">("enter");
  const [value, setValue] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isEmail = field === "email";
  const label = isEmail ? "email address" : "phone number";

  /* Step 1 sends the code to the value being CLAIMED — that is what proves the
     new mailbox or number reaches this person. Nothing is written yet: the
     OTPCode row (keyed by the new value) IS the parked change, so the live
     email/phone keeps working until the code is confirmed. */
  const start = async () => {
    setBusy(true); setErr(null);
    try {
      await papi.sendContactOtp(value.trim().toLowerCase(), field);
      setStep("code");
    } catch (e) {
      setErr(errMsg(e, "Couldn't send the code."));
    } finally {
      setBusy(false);
    }
  };

  /* Step 2 commits. The server verifies the password (proving it is the owner,
     not just an open session) and then the OTP, re-checks uniqueness, and only
     then writes — stamping emailVerified/phoneVerified, since the code proved
     the new value. */
  const commit = async () => {
    setBusy(true); setErr(null);
    try {
      const v = value.trim().toLowerCase();
      if (isEmail) await papi.commitEmailChange({ email: v, otp: code.trim(), password: password || undefined });
      else await papi.commitPhoneChange({ phone: v, otp: code.trim(), password: password || undefined });
      toast.success(`${isEmail ? "Email" : "Phone number"} updated`);
      await onDone();
    } catch (e) {
      setErr(errMsg(e, "That didn't work."));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await papi.resendContactOtp(value.trim().toLowerCase(), field);
      toast.success("New code sent");
    } catch (e) {
      setErr(errMsg(e, "Couldn't resend the code."));
    }
  };

  return (
    <Modal
      title={step === "enter" ? `Change your ${label}` : `Confirm your new ${label}`}
      sub={step === "enter" ? `Currently ${current || "not set"}` : `We sent a 6-digit code to ${value}`}
      onClose={onClose}
      footer={
        step === "enter" ? (
          <>
            <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
            <DBtn onClick={start} disabled={busy || !value.trim()}>
              {busy ? <><Icon name="loader" size={14} className="animate-spin" />Sending…</> : <>Send code<Icon name="arrow-right" size={14} /></>}
            </DBtn>
          </>
        ) : (
          <>
            <DBtn variant="line" onClick={() => setStep("enter")}>Back</DBtn>
            <DBtn onClick={commit} disabled={busy || code.trim().length < 6}>
              {busy ? <><Icon name="loader" size={14} className="animate-spin" />Confirming…</> : <><Icon name="check" size={14} />Confirm change</>}
            </DBtn>
          </>
        )
      }
    >
      {err && (
        <div className="mb-3 rounded-[14px] border border-danger/20 bg-danger/[0.07] px-4 py-3 text-[13.5px] font-medium leading-snug text-danger">
          {err}
        </div>
      )}

      {step === "enter" ? (
        <>
          <Field label={`New ${label}`}>
            <input
              className={inputCls()}
              type={isEmail ? "email" : "tel"}
              inputMode={isEmail ? "email" : "tel"}
              autoComplete={isEmail ? "email" : "tel"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={isEmail ? "you@example.com" : "0803 000 0000"}
            />
          </Field>
          <Banner icon="info">
            Nothing changes until you enter the code. Your current {label} keeps working until then.
          </Banner>
          {!isEmail && (
            <div className="mt-3">
              <Banner tone="warn" icon="triangle-alert">
                SMS delivery isn&rsquo;t live yet, so this code goes to your email for now.
              </Banner>
            </div>
          )}
        </>
      ) : (
        <>
          <Field label="6-digit code">
            <input
              className={cx(inputCls(), "text-center font-mono text-[20px] tracking-[0.3em]")}
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
            />
          </Field>
          {/* Left OPTIONAL, not required: social-only accounts have no password
              to check, and the server decides whether one is needed. Making it
              mandatory here would lock Google/Facebook users out entirely. */}
          <Field label="Your password" hint="Confirms it's really you. Leave blank if you signed up with Google or Facebook.">
            <input
              className={inputCls()}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </Field>
          <button
            type="button"
            onClick={resend}
            className="text-[13px] font-semibold text-green-dark transition-colors hover:cursor-pointer hover:text-ink"
          >
            Didn&rsquo;t get it? Resend code
          </button>
        </>
      )}
    </Modal>
  );
}
