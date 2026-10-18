"use client";

/* ============================================================
   ChoosePlanModal — put ONE property on a service tier.
   Tiers and prices come from subscriptionPlans.ts (via the constants shim);
   the amount due NOW comes from the backend quote, prorated to the days left
   in the owner's billing period (₦0 when it rides on the onboarding seat).
   Pay path: saved subscription card first (server-side tokenized charge);
   if there's no card or it's declined, the Flutterwave Inline modal opens
   with the payload the backend returned. Either way the NC-PSUB-* webhook
   is what activates the line — the client only refreshes the cache.
   API: GET /payments/billing/properties/:id/quote?tier= ·
        POST /payments/billing/properties/:id/plan { tier }
   ============================================================ */
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@newcondo/ui";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, KV, Banner } from "@/components/dashboard/primitives";
import { SUBSCRIPTION_PLANS, OWNER_TIER_ORDER, formatRate } from "@/lib/constants/business";
import { useFlutterwaveInline } from "@/hooks/useFlutterwaveInline";
import * as money from "@/lib/api/money";
import { ngn } from "@/lib/dashboard/format";
import type { FlutterwavePayload } from "@/types/flutterwave";

export function ChoosePlanModal({ propertyId, title, current, mode = "start", onClose }: {
  propertyId: string;
  title: string;
  /** current tier code, for "change tier" */
  current?: string;
  /** start = choose + pay now · change = schedule for next renewal */
  mode?: "start" | "change";
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { open } = useFlutterwaveInline();
  const [tier, setTier] = useState<money.Tier>((current?.replace("_ANNUAL", "") as money.Tier) ?? "OWNER_PLUS");
  const [quote, setQuote] = useState<money.PlanQuote | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setQuote(null); setErr(null);
    money.quotePropertyPlan(propertyId, tier).then((q) => live && setQuote(q)).catch((e) => live && setErr(e?.message ?? "Couldn't price this plan"));
    return () => { live = false; };
  }, [propertyId, tier]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["billing"] });
    qc.invalidateQueries({ queryKey: ["properties", "mine"] });
    qc.invalidateQueries({ queryKey: ["wallet"] });
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === "change") {
        const r = await money.changePropertyTier(propertyId, tier);
        toast.success("Tier change scheduled", { description: `${title} moves to ${SUBSCRIPTION_PLANS[tier].name} from ${r.effectiveFrom ? new Date(r.effectiveFrom).toDateString() : "your next renewal"}. Next bill ${ngn(r.nextBillNaira)}.`, duration: 7000 });
        refresh(); onClose(); return;
      }
      const r = await money.startPropertyPlan(propertyId, tier);
      if (r.status === "ACTIVE") {
        toast.success(`${title} is on ${SUBSCRIPTION_PLANS[tier].name}`, { description: r.chargedNaira > 0 ? `${ngn(r.chargedNaira)} charged to your saved card for the rest of this period.` : "Included until your next renewal.", duration: 7000 });
        refresh(); onClose(); return;
      }
      if (r.savedCardFailure) toast.warning(r.savedCardFailure, { duration: 7000 });
      onClose();
      await open({
        payload: r.checkout as unknown as FlutterwavePayload,
        onSuccess: () => {
          toast.success("Payment received", { description: "Activating the plan — this takes a few seconds.", duration: 7000 });
          // The webhook activates the line; refresh twice to catch it.
          setTimeout(refresh, 2500); setTimeout(refresh, 8000);
        },
        onClose: () => toast.info("Checkout closed", { description: "No money was taken. Choose a plan any time from this property.", duration: 6000 }),
        onError: (e) => toast.error("Payment didn't go through", { description: e.message, duration: 7000 }),
      });
    } catch (e) {
      const msg = (e as { message?: string })?.message ?? "Something went wrong";
      setErr(msg);
      toast.error("Couldn't update the plan", { description: msg, duration: 7000 });
    } finally {
      setBusy(false);
    }
  };

  const spec = SUBSCRIPTION_PLANS[tier];
  const cta = mode === "change"
    ? `Switch at next renewal`
    : quote?.dueNowNaira ? `Pay ${ngn(quote.totalDueNaira)}${quote.savedCard?.last4 ? ` with •••• ${quote.savedCard.last4}` : ""}` : "Add plan";

  return (
    <Modal title={mode === "change" ? "Change this property's tier" : "Choose a plan for this property"} sub={title} onClose={onClose}
      footer={<><DBtn variant="line" onClick={onClose}>Cancel</DBtn><DBtn disabled={busy || !quote || (mode === "change" && current?.startsWith(tier))} onClick={submit}>{busy ? "Working…" : cta}</DBtn></>}>
      <div className="flex flex-col gap-2.5">
        {OWNER_TIER_ORDER.map((code) => {
          const p = SUBSCRIPTION_PLANS[code];
          const on = tier === code;
          return (
            <button key={code} type="button" onClick={() => setTier(code as money.Tier)}
              className={cx("flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition-all", on ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-nc-border hover:border-ink")}>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[14.5px] font-semibold">{p.name}{p.badge && <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10.5px] font-bold text-text-secondary">{p.badge}</span>}</div>
                <div className="mt-0.5 text-[12.5px] leading-snug text-text-tertiary">{p.tagline} · {formatRate(p.commissionRate)} commission</div>
              </div>
              <div className="flex flex-none items-center gap-2">
                <span className="font-mono text-[13.5px] font-semibold">{ngn(p.amountNaira)}<span className="font-sans text-[11.5px] font-normal text-text-tertiary">{p.unitLabel.replace("/property", "")}</span></span>
                {on && <Icon name="check" size={16} strokeWidth={2.5} className="text-green-dark" />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-2xl bg-surface-sunken px-4 py-1">
        {quote ? (<>
          {mode === "start" && <KV k="Due now" v={quote.usesOnboardingSeat ? "₦0 — uses the plan you paid for at sign-up" : quote.dueNowNaira ? `${ngn(quote.dueNowNaira)} for the days left this period` : "₦0 — starts free until renewal"} mono />}
          {mode === "start" && quote.processingFeeNaira > 0 && <KV k={quote.processingFeeLabel} v={ngn(quote.processingFeeNaira)} mono />}
          {mode === "start" && quote.processingFeeNaira > 0 && <KV k="Total now" v={ngn(quote.totalDueNaira)} mono />}
          <KV k="Next bill (all properties)" v={`${ngn(quote.nextBillNaira)} + processing`} mono />
          <KV k={mode === "change" ? "Takes effect" : "Renews"} v={quote.periodEnd ? new Date(quote.periodEnd).toDateString() : "—"} />
        </>) : !err && <div className="py-3 text-[13px] text-text-tertiary">Pricing {spec.name}…</div>}
      </div>
      {err && <div className="mt-3"><Banner tone="warn" icon="triangle-alert">{err}</Banner></div>}
      <p className="mb-0 mt-3 text-[12px] leading-normal text-text-tertiary">
        {mode === "change"
          ? "Tier changes apply from your next renewal, so you're never billed twice for one month. Commission on rent follows the tier."
          : "Each property has its own plan. You only pay for the days left in this billing period; after that it's billed with your other properties. Plan fees are non-refundable."}
      </p>
    </Modal>
  );
}
