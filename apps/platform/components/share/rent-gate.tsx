"use client";

/* RentGate — the share-link rent flow (safety + compliance gate).
   A renter clicking "Rent this property" on /share/[shareCode]:
     1. account check — signed in? if not: sign in OR quick signup (BVN
        collected — Flutterwave needs it to mint their permanent virtual
        account, the escrow safety layer)
     2. flat pick (compulsory when the house has multiple vacant units)
     3. quote review (escrow terms) → Flutterwave inline checkout
   The shareCode rides into POST /payments/rent/initiate so a PROMO link's
   sub-agent is pinned on the Payment — commission attribution is exact.
   After the charge verifies (webhook): unit locks OCCUPIED, escrow's 24h
   window starts, owner/agent/renter all get SSE notifications + branded
   emails; the split pays out at release. Double-booking is blocked by the
   booking-service lock + isPaymentLocked mirror. */
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { useFlutterwaveInline } from "@/hooks/useFlutterwaveInline";
import * as api from "@/lib/api/dashboard";
import { ngn } from "@/lib/dashboard/format";
import { PAYMENTS } from "@/lib/constants/business";

export interface RentGateProperty {
  id: string; title: string; price: number; shareCode: string;
  units: { label: string; status: string; price?: number }[];
}
type Step = "account" | "signin" | "signup" | "flat" | "review" | "paying";
const inputCls = "w-full rounded-2xl border border-nc-border bg-surface px-3.5 py-3 text-[14.5px] outline-none transition-shadow placeholder:text-text-tertiary focus:border-ink focus:shadow-[0_0_0_4px_rgba(19,19,19,0.06)]";

export function RentGate({ property, signedIn, onClose }: { property: RentGateProperty; signedIn: boolean; onClose: () => void }) {
  const vacant = property.units.filter((u) => u.status === "VACANT" || u.status === "AVAILABLE");
  const [step, setStep] = useState<Step>(signedIn ? (vacant.length > 1 ? "flat" : "review") : "account");
  const [unit, setUnit] = useState(vacant.length === 1 ? vacant[0].label : "");
  const [login, setLogin] = useState({ email: "", password: "" });
  const [f, setF] = useState({ name: "", email: "", phone: "", bvn: "", password: "", terms: false });
  const [busy, setBusy] = useState(false);
  const flw = useFlutterwaveInline();
  const rent = vacant.find((u) => u.label === unit)?.price ?? property.price;
  const fee = Math.round(rent * PAYMENTS.renterServiceFeeRate);
  const afterAuth = () => setStep(vacant.length > 1 && !unit ? "flat" : "review");

  const doSignin = async () => {
    if (!/\S+@\S+\.\S+/.test(login.email) || !login.password) { toast.error("Enter your email and password"); return; }
    setBusy(true);
    try {
      if (api.isLiveBackend) {
        const { signIn } = await import("@newcondo/auth/client");
        const res = await signIn("credentials", { ...login, redirect: false });
        if (res?.error) throw new Error("Email or password is not correct");
        // Existing accounts may predate virtual accounts — ensure one exists
        // (backend is idempotent; asks for BVN with a 400 if missing).
        await api.ensureRenterVA().catch((e) => { throw new Error((e as Error).message || "We need your BVN to secure payments — add it in your profile."); });
      } else await new Promise((r) => setTimeout(r, 1000));
      afterAuth();
    } catch (e) { toast.error("Could not sign you in", { description: (e as Error).message }); }
    finally { setBusy(false); }
  };
  const doSignup = async () => {
    if (!f.name.trim() || !/\S+@\S+\.\S+/.test(f.email) || f.password.length < 8) { toast.error("Check your details", { description: "Name, a valid email and an 8+ character password are required." }); return; }
    if (!/^\d{11}$/.test(f.bvn)) { toast.error("BVN must be 11 digits", { description: "Flutterwave needs it to create your secure escrow account — it's never shared with the lister." }); return; }
    if (!f.terms) { toast.error("Accept the terms to continue"); return; }
    setBusy(true);
    try {
      if (api.isLiveBackend) {
        // Registers the renter AND provisions their Flutterwave virtual
        // account from the BVN (payment-service ensureRenterVirtualAccount).
        const apiClient = (await import("@/lib/api/client")).default;
        await apiClient.post("/auth/register", { name: f.name, email: f.email, phone: f.phone, password: f.password, bvn: f.bvn, role: "RENTER", viaShareCode: property.shareCode });
        const { signIn } = await import("@newcondo/auth/client");
        await signIn("credentials", { email: f.email, password: f.password, redirect: false });
      } else await new Promise((r) => setTimeout(r, 1400));
      toast.success("Account ready", { description: "Your secure escrow account has been created." });
      afterAuth();
    } catch (e) { toast.error("Could not create your account", { description: (e as Error).message }); }
    finally { setBusy(false); }
  };
  const pay = async () => {
    setStep("paying");
    try {
      if (api.isLiveBackend) {
        // Locks the unit server-side (409 if someone else is mid-checkout).
        const { checkout } = await api.initiateRent(property.id, unit || "Main unit", property.shareCode);
        flw.open({
          payload: checkout as never,
          onSuccess: () => { onClose(); toast.success("Payment secured in escrow", { description: "Visit the property within 24 hours. If it doesn't match the listing, dispute from My Rentals before the window closes." }); },
          onClose: () => { setStep("review"); toast.info("Checkout closed", { description: "The flat stays reserved for you for a few more minutes." }); },
          onError: (e) => { setStep("review"); toast.error("Payment didn't complete", { description: e.message }); },
        });
      } else {
        await new Promise((r) => setTimeout(r, 1800));
        onClose();
        toast.success("Payment secured in escrow", { description: "Owner, agent and Newcondo were notified; commission splits at release." });
      }
    } catch (e) {
      setStep("review");
      toast.error("Could not start checkout", { description: (e as Error).message || "The flat may have just been taken — refresh and try again." });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-5 backdrop-blur-sm max-sm:items-end max-sm:p-0" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-h-[92vh] w-[460px] max-w-full overflow-y-auto rounded-3xl bg-surface p-6 shadow-pop [scrollbar-width:none] max-sm:w-full max-sm:rounded-b-none [&::-webkit-scrollbar]:hidden">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-surface-sunken text-ink hover:bg-[#ECE9DE]"><Icon name="x" size={15} /></button>
        <h2 className="m-0 pr-8 text-[20px] font-bold tracking-[-0.03em]">{property.title}</h2>
        <p className="mb-4 mt-1 text-[13px] text-text-tertiary">
          {step === "account" || step === "signin" || step === "signup" ? "A Newcondo account is required to rent — it's what makes the escrow protection possible." : `${ngn(rent)}/year · escrow-protected`}
        </p>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
            {step === "account" && (<>
              <div className="mb-4 rounded-2xl bg-surface-sunken px-4 py-3.5 text-[13px] leading-relaxed text-text-secondary">
                <Icon name="shield-check" size={15} className="mr-1.5 inline text-green-dark" />
                For your safety and compliance, only verified accounts can pay rent. Your money goes into escrow — never directly to an agent.
              </div>
              <button onClick={() => setStep("signup")} className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream hover:bg-black">Create an account & rent<Icon name="arrow-right" size={15} strokeWidth={2.2} /></button>
              <button onClick={() => setStep("signin")} className="mt-2.5 w-full rounded-full border border-nc-border-strong py-3.5 text-[14px] font-semibold text-ink hover:bg-surface-soft">I already have an account</button>
            </>)}
            {step === "signin" && (<>
              <label className="mb-3 block"><span className="mb-1.5 block text-[13px] font-semibold">Email</span><input type="email" className={inputCls} placeholder="you@example.com" value={login.email} onChange={(e) => setLogin((x) => ({ ...x, email: e.target.value }))} /></label>
              <label className="mb-3 block"><span className="mb-1.5 block text-[13px] font-semibold">Password</span><input type="password" className={inputCls} placeholder="Your password" value={login.password} onChange={(e) => setLogin((x) => ({ ...x, password: e.target.value }))} /></label>
              <button disabled={busy} onClick={doSignin} className={cx("flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream hover:bg-black", busy && "opacity-60")}>{busy ? "Signing in…" : "Sign in & continue"}</button>
              <button onClick={() => setStep("signup")} className="mt-2.5 w-full text-center text-[12.5px] font-semibold text-text-secondary hover:text-ink">New here? Create an account</button>
            </>)}
            {step === "signup" && (<>
              {([["name", "Full name", "text", "Chiamaka Eze"], ["email", "Email", "email", "you@example.com"], ["phone", "Phone", "tel", "0803 000 0000"], ["bvn", "BVN", "tel", "11 digits"], ["password", "Password", "password", "At least 8 characters"]] as const).map(([k, label, type, ph]) => (
                <label key={k} className="mb-2.5 block">
                  <span className="mb-1.5 block text-[13px] font-semibold">{label}{k === "bvn" && <span className="ml-1.5 font-normal text-text-tertiary">— creates your secure escrow account</span>}</span>
                  <input type={type} inputMode={k === "bvn" ? "numeric" : undefined} maxLength={k === "bvn" ? 11 : undefined} placeholder={ph} value={f[k] as string}
                    onChange={(e) => setF((x) => ({ ...x, [k]: k === "bvn" ? e.target.value.replace(/\D/g, "") : e.target.value }))} className={inputCls} />
                </label>
              ))}
              <label className="mb-1 flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-relaxed text-text-secondary">
                <input type="checkbox" checked={f.terms} onChange={(e) => setF((x) => ({ ...x, terms: e.target.checked }))} className="mt-0.5 size-4 accent-[#131313]" />
                <span>I accept Newcondo&rsquo;s <Link href="/terms" className="font-semibold text-text-primary">terms</Link> and <Link href="/privacy" className="font-semibold text-text-primary">privacy policy</Link>. My BVN is used only to create my Flutterwave virtual account.</span>
              </label>
              <button disabled={busy} onClick={doSignup} className={cx("mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream hover:bg-black", busy && "opacity-60")}>{busy ? "Creating your account…" : "Create account & continue"}</button>
            </>)}
            {step === "flat" && (<>
              <p className="mb-3 mt-0 text-[13px] text-text-tertiary">Pick the flat you&rsquo;re renting — occupied ones are locked automatically.</p>
              {property.units.map((u) => {
                const open = u.status === "VACANT" || u.status === "AVAILABLE";
                return (
                  <button key={u.label} disabled={!open} onClick={() => setUnit(u.label)}
                    className={cx("mb-2 flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all", !open ? "cursor-default opacity-50 border-nc-border" : unit === u.label ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-nc-border hover:border-ink")}>
                    <span className="grid size-10 flex-none place-items-center rounded-xl bg-surface-sunken text-ink"><Icon name="home" size={16} /></span>
                    <span className="flex-1 text-[14px] font-semibold">{u.label}</span>
                    <span className="font-mono text-[12.5px] text-text-secondary">{ngn(u.price ?? property.price)}/yr</span>
                    {!open && <span className="text-[11px] font-semibold text-text-tertiary">Taken</span>}
                  </button>
                );
              })}
              <button disabled={!unit} onClick={() => setStep("review")} className={cx("mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream hover:bg-black", !unit && "opacity-50")}>Continue<Icon name="arrow-right" size={15} strokeWidth={2.2} /></button>
            </>)}
            {(step === "review" || step === "paying") && (<>
              {[["Flat", unit || "Main unit"], ["Rent (1 year)", ngn(rent)], [`Newcondo service fee (${PAYMENTS.renterServiceFeeRate * 100}%)`, ngn(fee)], ["Total", ngn(rent + fee)]].map(([k, v], i, a) => (
                <div key={k} className={cx("flex items-center justify-between gap-4 border-b border-border-hair py-2.5 text-[13.5px]", i === a.length - 1 && "border-b-0 font-bold")}>
                  <span className="text-text-tertiary">{k}</span><span className="font-mono font-semibold">{v}</span>
                </div>
              ))}
              <div className="mt-3 flex flex-col gap-2 text-[12.5px] leading-relaxed">
                <div className="rounded-xl bg-surface-sunken px-3.5 py-2.5 text-text-secondary"><Icon name="lock" size={13} className="mr-1.5 inline text-ink" />Held in escrow for 24 hours — visit the property; if it doesn&rsquo;t match, dispute and the payment reverses.</div>
                <div className="rounded-xl bg-green-wash px-3.5 py-2.5 text-green-dark"><Icon name="shield-check" size={13} className="mr-1.5 inline" />Paying locks this flat instantly — no one can double-book it while your window runs.</div>
              </div>
              <button disabled={step === "paying"} onClick={pay} className={cx("mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-green py-3.5 text-[14.5px] font-semibold text-white hover:bg-green-dark", step === "paying" && "opacity-60")}>
                {step === "paying" ? "Opening secure checkout…" : `Pay ${ngn(rent + fee)} with Flutterwave`}
              </button>
            </>)}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
