"use client";

/* Tenant-invite onboarding — the ONLY way renters get an account.
   Route: /tenant-invite/[token] — each link is single-use, 14-day expiry,
   and specific to one lister + property [+ flat] (property-service
   tenantService). Flow:
     1. GET /api/v1/properties/tenant-invites/:token  (public) → context
     2. Account details → POST /auth/register { ...fields, inviteToken }
        (auth-service consumes the token via acceptTenantInvite — the
        Tenancy row is what makes the tenant appear in the lister's
        dashboard, who is notified instantly over SSE)
     3. Done → sign in
   Preview mode (no NEXT_PUBLIC_API_URL): renders with sample context. */
import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast, Toaster } from "@newcondo/ui";
import { validateTenantInvite, isLiveBackend } from "@/lib/api/dashboard";

interface InviteCtx { property: { title: string; location: string }; inviter: { name: string; role: string }; flatLabel?: string; }
const PREVIEW_CTX: InviteCtx = { property: { title: "2-bedroom apartment, Trans Amadi", location: "Trans Amadi, Port Harcourt" }, inviter: { name: "Emeka Obi", role: "AGENT" }, flatLabel: "Flat 1" };

export default function TenantInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [ctx, setCtx] = useState<InviteCtx | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [step, setStep] = useState(0); // 0 welcome · 1 details · 2 done
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!isLiveBackend) { setCtx(PREVIEW_CTX); return; }
    validateTenantInvite(token).then(setCtx).catch((e) => setInvalid((e as Error).message || "This invite link is not valid or has expired."));
  }, [token]);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const submit = async () => {
    if (!f.name.trim() || !/\S+@\S+\.\S+/.test(f.email) || f.password.length < 8) {
      toast.error("Check your details", { description: "Full name, a valid email and a password of at least 8 characters are required." });
      return;
    }
    setBusy(true);
    try {
      if (isLiveBackend) {
        // POST /api/v1/auth/register with inviteToken — auth-service creates the
        // RENTER account and consumes the invite atomically (single-use).
        const apiClient = (await import("@/lib/api/client")).default;
        await apiClient.post("/auth/register", { ...f, role: "RENTER", inviteToken: token });
      } else {
        await new Promise((r) => setTimeout(r, 1500));
      }
      setStep(2);
      toast.success("Welcome to NewCondo", { description: `${ctx?.inviter.name} has been notified that you joined.` });
    } catch (e) {
      toast.error("Could not create your account", { description: (e as Error).message });
    } finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-nc-background p-5 font-sans text-text-primary">
      <Toaster />
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] rounded-[28px] border border-border-hair bg-surface p-7 shadow-card">
        <div className="mb-5 flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.04em]">
          <Image src="/assets/logo-mark-dark.png" alt="" width={26} height={26} />newcondo
        </div>
        {invalid ? (<>
          <h1 className="m-0 text-[22px] font-bold tracking-[-0.03em]">This link doesn&rsquo;t work</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{invalid} Ask your property owner or agent to send a fresh invite — links are single-use and expire after 14 days.</p>
        </>) : !ctx ? (
          <div className="flex flex-col gap-2.5 py-2">{[64, 44, 44].map((h, i) => <div key={i} className="animate-pulse rounded-xl bg-surface-sunken" style={{ height: h }} />)}</div>
        ) : step === 0 ? (<>
          <h1 className="m-0 text-[23px] font-bold leading-tight tracking-[-0.03em]">You&rsquo;ve been invited to manage your tenancy on NewCondo</h1>
          <div className="mt-4 rounded-2xl bg-surface-sunken p-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 flex-none place-items-center rounded-xl bg-ink text-cream"><Icon name="home" size={18} /></span>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold">{ctx.property.title}{ctx.flatLabel ? ` · ${ctx.flatLabel}` : ""}</div>
                <div className="mt-0.5 text-[12.5px] text-text-tertiary">{ctx.property.location} · invited by {ctx.inviter.name} ({ctx.inviter.role === "AGENT" ? "listing agent" : "property owner"})</div>
              </div>
            </div>
          </div>
          <ul className="mt-4 flex list-none flex-col gap-2.5 p-0 text-[13.5px] text-text-secondary">
            {[["receipt", "Pay rent through escrow — protected for 24 hours after every payment"], ["wrench", "Raise maintenance requests that are documented, not lost on WhatsApp"], ["bell", "Get notified before every fumigation, waste or inspection visit"]].map(([ic, t]) => (
              <li key={ic} className="flex items-start gap-2.5"><Icon name={ic} size={16} className="mt-0.5 flex-none text-green-dark" />{t}</li>
            ))}
          </ul>
          <button onClick={() => setStep(1)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream transition-colors hover:bg-black">
            Set up my account<Icon name="arrow-right" size={15} strokeWidth={2.2} />
          </button>
        </>) : step === 1 ? (<>
          <h1 className="m-0 text-[21px] font-bold tracking-[-0.03em]">Your details</h1>
          <p className="mb-4 mt-1.5 text-[13px] text-text-tertiary">For {ctx.property.title}{ctx.flatLabel ? ` · ${ctx.flatLabel}` : ""}. Verification (NIN/BVN) comes later, inside your dashboard.</p>
          {([["name", "Full name", "text", "Chiamaka Eze"], ["email", "Email", "email", "you@example.com"], ["phone", "Phone", "tel", "0803 000 0000"], ["password", "Password", "password", "At least 8 characters"]] as const).map(([k, label, type, ph]) => (
            <label key={k} className="mb-3 block">
              <span className="mb-1.5 block text-[13px] font-semibold tracking-[-0.01em]">{label}</span>
              <input type={type} placeholder={ph} value={f[k]} onChange={(e) => set(k, e.target.value)}
                className="w-full rounded-2xl border border-nc-border bg-surface px-3.5 py-3 text-[14.5px] outline-none transition-shadow placeholder:text-text-tertiary focus:border-ink focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)]" />
            </label>
          ))}
          <button disabled={busy} onClick={submit} className={cx("mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream transition-colors hover:bg-black", busy && "opacity-60")}>
            {busy ? "Creating your account…" : "Create account & join"}
          </button>
          <p className="mb-0 mt-3 text-center text-[11.5px] leading-normal text-text-tertiary">By continuing you accept NewCondo&rsquo;s <Link href="/terms" className="font-semibold text-text-secondary">terms</Link>. Your invite is single-use and tied to this property.</p>
        </>) : (<>
          <div className="flex flex-col items-center py-4 text-center">
            <span className="mb-4 grid size-14 place-items-center rounded-full bg-green-wash text-green-dark"><Icon name="check" size={26} strokeWidth={2.5} /></span>
            <h1 className="m-0 text-[21px] font-bold tracking-[-0.03em]">You&rsquo;re in</h1>
            <p className="mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-text-secondary">Your tenancy at {ctx.property.title} is linked. {ctx.inviter.name} can now see you in their dashboard.</p>
            <Link href="/login" className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-cream no-underline transition-colors hover:bg-black">
              Sign in to your dashboard<Icon name="arrow-right" size={14} strokeWidth={2.2} />
            </Link>
          </div>
        </>)}
      </motion.div>
    </div>
  );
}
