"use client";

/* Tenant-invite onboarding — the ONLY way renters get an account.
   Route: /tenant-invite/[token] — single-use, 14-day expiry, tied to one
   lister + property (property-service tenantService).
   Rules implemented here:
   · Picking a flat is OPTIONAL for the lister when creating the link, but
     COMPULSORY for the renter here (when the property has multiple units
     and the link didn't pin one).
   · New renter → account form (name, email, phone, password, T&Cs) →
     POST /auth/register { inviteToken, unitLabel }.
   · Existing renter (former tenant elsewhere) → "I already have an account"
     → sign in, then POST /properties/tenant-invites/accept { token, unitLabel }.
   Either way the Rental row is created server-side, so the house loads
   automatically in the renter's Dashboard and My Rentals, and the lister
   is notified (SSE + email). */
import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast, Toaster } from "@/components/ui/sonner";
import { validateTenantInvite, isLiveBackend } from "@/lib/api/dashboard";

interface InviteCtx {
  property: { title: string; location: string };
  inviter: { name: string; role: string };
  flatLabel?: string | null;
  units?: { label: string; status: string }[];
}
const PREVIEW_CTX: InviteCtx = {
  property: { title: "2-bedroom apartment, Trans Amadi", location: "Trans Amadi, Port Harcourt" },
  inviter: { name: "Emeka Obi", role: "AGENT" }, flatLabel: null,
  units: [{ label: "Flat 1", status: "VACANT" }, { label: "Flat 2", status: "VACANT" }, { label: "Flat 3", status: "OCCUPIED" }],
};
const inputCls = "w-full rounded-2xl border border-nc-border bg-surface px-3.5 py-3 text-[14.5px] outline-none transition-shadow placeholder:text-text-tertiary focus:border-ink focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)]";

export default function TenantInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [ctx, setCtx] = useState<InviteCtx | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  // steps: welcome → flat (if needed) → details | signin → done
  const [step, setStep] = useState<"welcome" | "flat" | "details" | "signin" | "done">("welcome");
  const [unit, setUnit] = useState("");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", terms: false });
  const [login, setLogin] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!isLiveBackend) { setCtx(PREVIEW_CTX); return; }
    validateTenantInvite(token).then((d) => setCtx(d as InviteCtx)).catch((e) => setInvalid((e as Error).message || "This invite link is not valid or has expired."));
  }, [token]);
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  // Flat pick is compulsory for the renter when the link didn't pin one and the property has several units.
  const needsFlatPick = !!ctx && !ctx.flatLabel && (ctx.units?.length ?? 0) > 1;
  const chosenFlat = ctx?.flatLabel ?? unit;
  const afterWelcome = (dest: "details" | "signin") => setStep(needsFlatPick ? "flat" : dest);
  const [flatDest, setFlatDest] = useState<"details" | "signin">("details");

  const finish = () => { setStep("done"); toast.success("Welcome to Newcondo", { description: `${ctx?.inviter.name} has been notified. Your rental is already in your dashboard.` }); };
  const submitNew = async () => {
    if (needsFlatPick && !chosenFlat) { toast.error("Choose your flat first"); setStep("flat"); return; }
    if (!f.name.trim() || !/\S+@\S+\.\S+/.test(f.email) || f.password.length < 8) { toast.error("Check your details", { description: "Full name, a valid email and a password of at least 8 characters are required." }); return; }
    if (!f.terms) { toast.error("Accept the terms to continue"); return; }
    setBusy(true);
    try {
      if (isLiveBackend) {
        // Registers the RENTER account and consumes the invite atomically —
        // the Rental row created server-side auto-loads the house in their dashboard.
        const apiClient = (await import("@/lib/api/client")).default;
        await apiClient.post("/auth/register", { name: f.name, email: f.email, phone: f.phone, password: f.password, role: "RENTER", inviteToken: token, unitLabel: chosenFlat || undefined });
      } else await new Promise((r) => setTimeout(r, 1500));
      finish();
    } catch (e) { toast.error("Could not create your account", { description: (e as Error).message }); }
    finally { setBusy(false); }
  };
  const submitExisting = async () => {
    if (needsFlatPick && !chosenFlat) { toast.error("Choose your flat first"); setStep("flat"); return; }
    if (!/\S+@\S+\.\S+/.test(login.email) || !login.password) { toast.error("Enter your email and password"); return; }
    setBusy(true);
    try {
      if (isLiveBackend) {
        // Sign in, then consume the invite with the existing account —
        // POST /properties/tenant-invites/accept creates the Rental row.
        const { signIn } = await import("next-auth/react");
        const res = await signIn("credentials", { email: login.email, password: login.password, redirect: false });
        if (res?.error) throw new Error("Email or password is not correct");
        const apiClient = (await import("@/lib/api/client")).default;
        await apiClient.post("/properties/tenant-invites/accept", { token, unitLabel: chosenFlat || undefined });
      } else await new Promise((r) => setTimeout(r, 1300));
      finish();
    } catch (e) { toast.error("Could not link your tenancy", { description: (e as Error).message }); }
    finally { setBusy(false); }
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
        ) : step === "welcome" ? (<>
          <h1 className="m-0 text-[23px] font-bold leading-tight tracking-[-0.03em]">You&rsquo;ve been invited to manage your tenancy on Newcondo</h1>
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
          <button onClick={() => { setFlatDest("details"); afterWelcome("details"); }} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream transition-colors hover:bg-black">
            Set up my account<Icon name="arrow-right" size={15} strokeWidth={2.2} />
          </button>
          <button onClick={() => { setFlatDest("signin"); afterWelcome("signin"); }} className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-full border border-nc-border-strong bg-surface py-3.5 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-soft">
            I already have a Newcondo account
          </button>
        </>) : step === "flat" ? (<>
          <h1 className="m-0 text-[21px] font-bold tracking-[-0.03em]">Which flat is yours?</h1>
          <p className="mb-4 mt-1.5 text-[13px] leading-normal text-text-tertiary">This building has multiple flats — pick yours so rent and maintenance reconcile to the right one. This is required.</p>
          {(ctx.units ?? []).map((u) => (
            <button key={u.label} disabled={u.status === "OCCUPIED"} onClick={() => setUnit(u.label)}
              className={cx("mb-2 flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all",
                u.status === "OCCUPIED" ? "cursor-default opacity-50 border-nc-border" : unit === u.label ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-nc-border hover:border-ink")}>
              <span className="grid size-10 flex-none place-items-center rounded-xl bg-surface-sunken text-ink"><Icon name="home" size={16} /></span>
              <span className="flex-1 text-[14px] font-semibold">{u.label}</span>
              {u.status === "OCCUPIED" ? <span className="text-[11.5px] font-semibold text-text-tertiary">Occupied</span>
                : unit === u.label && <Icon name="check" size={16} strokeWidth={2.5} className="text-green-dark" />}
            </button>
          ))}
          <button disabled={!unit} onClick={() => setStep(flatDest)}
            className={cx("mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream transition-colors hover:bg-black", !unit && "opacity-50")}>
            Continue<Icon name="arrow-right" size={15} strokeWidth={2.2} />
          </button>
        </>) : step === "details" ? (<>
          <h1 className="m-0 text-[21px] font-bold tracking-[-0.03em]">Your details</h1>
          <p className="mb-4 mt-1.5 text-[13px] text-text-tertiary">For {ctx.property.title}{chosenFlat ? ` · ${chosenFlat}` : ""}. Verification (NIN/BVN) comes later, inside your dashboard.</p>
          {([["name", "Full name", "text", "Chiamaka Eze"], ["email", "Email", "email", "you@example.com"], ["phone", "Phone", "tel", "0803 000 0000"], ["password", "Password", "password", "At least 8 characters"]] as const).map(([k, label, type, ph]) => (
            <label key={k} className="mb-3 block">
              <span className="mb-1.5 block text-[13px] font-semibold tracking-[-0.01em]">{label}</span>
              <input type={type} placeholder={ph} value={f[k] as string} onChange={(e) => set(k, e.target.value)} className={inputCls} />
            </label>
          ))}
          <label className="mb-1 flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-relaxed text-text-secondary">
            <input type="checkbox" checked={f.terms} onChange={(e) => set("terms", e.target.checked)} className="mt-0.5 size-4 accent-[#131313]" />
            <span>I accept Newcondo&rsquo;s <Link href="/terms" className="font-semibold text-text-primary">terms of service</Link> and <Link href="/privacy" className="font-semibold text-text-primary">privacy policy</Link>.</span>
          </label>
          <button disabled={busy} onClick={submitNew} className={cx("mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream transition-colors hover:bg-black", busy && "opacity-60")}>
            {busy ? "Creating your account…" : "Create account & join"}
          </button>
          <button onClick={() => setStep("signin")} className="mt-2.5 w-full text-center text-[12.5px] font-semibold text-text-secondary hover:text-ink">Already have an account? Sign in instead</button>
        </>) : step === "signin" ? (<>
          <h1 className="m-0 text-[21px] font-bold tracking-[-0.03em]">Sign in to link your tenancy</h1>
          <p className="mb-4 mt-1.5 text-[13px] leading-normal text-text-tertiary">Were you a tenant on Newcondo before? Sign in — {ctx.property.title}{chosenFlat ? ` (${chosenFlat})` : ""} will be added to your dashboard automatically.</p>
          <label className="mb-3 block"><span className="mb-1.5 block text-[13px] font-semibold">Email</span>
            <input type="email" placeholder="you@example.com" value={login.email} onChange={(e) => setLogin((x) => ({ ...x, email: e.target.value }))} className={inputCls} /></label>
          <label className="mb-3 block"><span className="mb-1.5 block text-[13px] font-semibold">Password</span>
            <input type="password" placeholder="Your password" value={login.password} onChange={(e) => setLogin((x) => ({ ...x, password: e.target.value }))} className={inputCls} /></label>
          <button disabled={busy} onClick={submitExisting} className={cx("mt-1 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream transition-colors hover:bg-black", busy && "opacity-60")}>
            {busy ? "Linking your tenancy…" : "Sign in & link tenancy"}
          </button>
          <button onClick={() => setStep("details")} className="mt-2.5 w-full text-center text-[12.5px] font-semibold text-text-secondary hover:text-ink">New here? Create an account instead</button>
        </>) : (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="mb-4 grid size-14 place-items-center rounded-full bg-green-wash text-green-dark"><Icon name="check" size={26} strokeWidth={2.5} /></span>
            <h1 className="m-0 text-[21px] font-bold tracking-[-0.03em]">You&rsquo;re in</h1>
            <p className="mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-text-secondary">{ctx.property.title}{chosenFlat ? ` (${chosenFlat})` : ""} is now in your dashboard under My Rentals. {ctx.inviter.name} can see your tenancy too.</p>
            <Link href="/dashboard" className="mt-5 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-cream no-underline transition-colors hover:bg-black">
              Open my dashboard<Icon name="arrow-right" size={14} strokeWidth={2.2} />
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
