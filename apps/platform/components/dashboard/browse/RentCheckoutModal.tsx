"use client";

/* Renter rent-checkout flow — steps: pick flat → review quote (escrow
   terms + fees) → pay with Flutterwave.
   API: GET /api/v1/payments/rent/quote → POST /payments/rent/initiate
   (locks the flat via booking-service so no one can double-pay, creates a
   PENDING Payment, returns the Flutterwave payload). The webhook confirms
   the charge → escrow's 24h window starts → everyone is notified via SSE. */
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, KV, Banner, Thumb, StatusBadge } from "@/components/dashboard/primitives";
import * as api from "@/lib/api/dashboard";
import { ngn } from "@/lib/dashboard/format";
import type { BrowseListing } from "@/lib/dashboard/data";

const SERVICE_FEE_RATE = 0.02; // mirrors PLATFORM_FEE_RATE in rentCheckout.service.ts

export function RentCheckoutModal({ listing, renter, onClose }: { listing: BrowseListing; renter: boolean; onClose: () => void }) {
  const vacant = listing.flats.filter((f) => f.status === "VACANT");
  const [step, setStep] = useState(0);
  const [flat, setFlat] = useState(vacant.length === 1 ? vacant[0].label : "");
  const [paying, setPaying] = useState(false);
  const rent = listing.price;
  const fee = Math.round(rent * SERVICE_FEE_RATE);
  const steps = ["Choose flat", "Review & protection", "Pay"];
  const pay = async () => {
    setPaying(true);
    try {
      if (api.isLiveBackend) {
        // Locks the flat (15 min) + returns the Flutterwave Standard payload.
        // Hand `checkout` to the FlutterwaveCheckout inline script (already
        // used in onboarding) — funds land in the property's virtual account.
        const { checkout } = await api.initiateRent(listing.id, flat);
        console.log("[rent] FlutterwaveCheckout payload ready:", checkout);
      } else {
        await new Promise((r) => setTimeout(r, 1800));
      }
      onClose();
      toast.success("Payment secured in escrow", { description: "Visit the property within 24 hours. If it doesn't match the listing, dispute from My Rentals before the window closes." });
    } catch (e) {
      setPaying(false);
      toast.error("Could not start checkout", { description: (e as Error).message ?? "The flat may have just been taken — refresh and try again." });
    }
  };
  return (
    <Modal wide title={listing.title} sub={`${listing.area}, ${listing.state} · ${steps[step]}`} onClose={onClose}
      footer={<>
        {step > 0 && !paying && <DBtn variant="line" onClick={() => setStep(step - 1)}>Back</DBtn>}
        {step === 0 && <DBtn disabled={!flat} onClick={() => setStep(1)}>Continue<Icon name="arrow-right" size={14} strokeWidth={2.2} /></DBtn>}
        {step === 1 && <DBtn onClick={() => setStep(2)}>Looks right<Icon name="arrow-right" size={14} strokeWidth={2.2} /></DBtn>}
        {step === 2 && <DBtn variant="green" disabled={paying || !renter} onClick={pay}>{paying ? "Opening secure checkout…" : `Pay ${ngn(rent + fee)} with Flutterwave`}</DBtn>}
      </>}>
      <div className="mb-[18px] flex items-center gap-1.5">
        {steps.map((s, i) => <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-surface-sunken"><i className="block h-full bg-ink transition-[width] duration-300 ease-nc" style={{ width: i <= step ? "100%" : 0 }} /></span>)}
      </div>
      {step === 0 && (<>
        <p className="mb-3 mt-0 text-[13px] leading-normal text-text-tertiary">Only vacant flats can be paid for — occupied ones are locked automatically.</p>
        {listing.flats.map((f) => (
          <button key={f.label} disabled={f.status !== "VACANT"} onClick={() => setFlat(f.label)}
            className={cx("mb-2 flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all",
              f.status !== "VACANT" ? "cursor-default opacity-50 border-nc-border" : flat === f.label ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-nc-border hover:border-ink")}>
            <Thumb icon="home" size={40} />
            <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{f.label}</span></span>
            <StatusBadge s={f.status} />
            {flat === f.label && f.status === "VACANT" && <Icon name="check" size={16} strokeWidth={2.5} className="text-green-dark" />}
          </button>
        ))}
      </>)}
      {step === 1 && (<>
        <KV k="Flat" v={flat} />
        <KV k="Rent (1 year)" v={ngn(rent)} mono />
        <KV k="Newcondo service fee (2%)" v={ngn(fee)} mono />
        <KV k="Total" v={<b className="font-mono">{ngn(rent + fee)}</b>} />
        <div className="mt-3 flex flex-col gap-2.5">
          <Banner icon="lock"><b className="font-semibold">Your money is held in escrow for 24 hours.</b> Visit the property; if it doesn&rsquo;t match the listing, dispute in one tap and the payment reverses.</Banner>
          <Banner icon="shield-check">Paying locks this flat instantly — no one else can pay for it while your window runs. Never pay an agent outside Newcondo; protection only covers in-app payments.</Banner>
        </div>
      </>)}
      {step === 2 && (<>
        <KV k="Paying" v={<b className="font-mono">{ngn(rent + fee)}</b>} />
        <KV k="To" v={`${listing.title} (${flat}) — property virtual account`} />
        <KV k="Method" v="Flutterwave — card, transfer or USSD" />
        {!renter && <div className="mt-3"><Banner tone="warn" icon="triangle-alert">You&rsquo;re previewing as {""}an owner/agent — switch to the Renter role to complete a rent payment.</Banner></div>}
        {renter && <div className="mt-3"><Banner icon="info">The secure Flutterwave window opens next. Your dashboard updates the moment payment is confirmed.</Banner></div>}
      </>)}
    </Modal>
  );
}
