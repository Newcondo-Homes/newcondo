"use client";

/* ============================================================
   PropertyPlanCard — this property's service plan, on the property page.
   States: on a plan · stopping at period end · tier change queued ·
   awaiting payment · no plan (off the market until one is chosen).
   Owner-only: the plan is the owner's bill, so listing agents don't see it.
   API: GET /payments/billing/properties/:id · POST …/discontinue · …/resume
   ============================================================ */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@newcondo/ui";
import { Icon } from "@/components/ui/icon";
import { Card, CardH, KV, DBtn, Banner, StatusBadge, SkeletonRows } from "@/components/dashboard/primitives";
import { Modal } from "@/components/dashboard/Modal";
import { usePropertyPlan } from "@/hooks/dashboard/useDashboardData";
import * as money from "@/lib/api/money";
import { ngn } from "@/lib/dashboard/format";
import { ChoosePlanModal } from "./ChoosePlanModal";

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "the end of this period");

export function PropertyPlanCard({ propertyId, title }: { propertyId: string; title: string }) {
  const qc = useQueryClient();
  const plan = usePropertyPlan(propertyId);
  const [modal, setModal] = useState<null | "choose" | "change" | "stop">(null);
  const [busy, setBusy] = useState(false);

  if (plan.isLoading) return <Card><SkeletonRows n={2} h={34} /></Card>;
  const p = plan.data!;
  const l = p.line;
  const refresh = () => { qc.invalidateQueries({ queryKey: ["billing"] }); qc.invalidateQueries({ queryKey: ["properties", "mine"] }); };

  const stop = async () => {
    setBusy(true);
    try {
      const r = await money.discontinuePropertyPlan(propertyId);
      toast.success("Monthly service will stop", { description: `Services continue until ${day(r.endsAt)}. Your next bill: ${ngn(r.nextBillNaira)}. The property stays in your account.`, duration: 8000 });
      refresh(); setModal(null);
    } catch (e) {
      toast.error("Couldn't stop the plan", { description: (e as Error).message, duration: 7000 });
    } finally { setBusy(false); }
  };
  const resume = async () => {
    try {
      const r = await money.resumePropertyPlan(propertyId);
      toast.success("Plan resumed", { description: `It renews as normal. Next bill: ${ngn(r.nextBillNaira)}.`, duration: 7000 });
      refresh();
    } catch (e) { toast.error("Couldn't resume", { description: (e as Error).message, duration: 7000 }); }
  };

  return (
    <>
      <Card>
        <CardH title="Service plan" right={l ? <StatusBadge s={l.cancelAtPeriodEnd ? "PENDING" : l.status === "ACTIVE" ? "ACTIVE" : "PENDING"}>{l.cancelAtPeriodEnd ? "Stopping" : l.status === "ACTIVE" ? l.name : "Awaiting payment"}</StatusBadge> : <StatusBadge s="UNAVAILABLE">No plan</StatusBadge>} />
        {l && l.status === "ACTIVE" ? (<>
          <KV k="Tier" v={l.nextPlan ? `${l.name} → ${l.nextPlan.name} at renewal` : l.name} />
          <KV k="Price" v={`${ngn(l.amountNaira)}/month`} mono />
          <KV k={l.cancelAtPeriodEnd ? "Service ends" : "Renews"} v={day(p.periodEnd)} />
          {l.included && <p className="m-0 mt-1 text-[12px] text-text-tertiary">This property uses the plan you chose when you signed up.</p>}
          {l.cancelAtPeriodEnd ? (
            <div className="mt-3"><Banner icon="info" action={<DBtn sm onClick={resume}>Keep plan</DBtn>}>
              <b className="font-semibold">Stops on {day(p.periodEnd)}.</b>
              <div className="mt-0.5 text-[12.5px]">After that it's left out of your bill and taken off the market. Tenants and their rent aren't affected.</div>
            </Banner></div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <DBtn variant="line" sm onClick={() => setModal("change")}><Icon name="refresh-cw" size={13} />Change tier</DBtn>
              <DBtn variant="line" sm className="!text-danger" onClick={() => setModal("stop")}>Stop monthly service</DBtn>
            </div>
          )}
        </>) : l && l.status === "PENDING_PAYMENT" ? (
          <Banner tone="warn" icon="clock" action={<DBtn sm onClick={() => setModal("choose")}>Pay now</DBtn>}>
            <b className="font-semibold">Payment not finished.</b>
            <div className="mt-0.5 text-[12.5px]">The {l.name} plan starts as soon as the payment clears.</div>
          </Banner>
        ) : (
          <>
            <p className="m-0 mb-3 text-[13px] leading-normal text-text-secondary">
              {p.offPlan
                ? "Monthly service for this property was stopped. It stays in your account but is off the market until it has a plan again."
                : p.canUseSeat
                  ? "Your sign-up plan is still unused — put it on this property at no extra charge."
                  : "Each property has its own plan. Pick one to get fumigation, waste pickup and escrow rent collection, and to put it on the market."}
            </p>
            <DBtn className="w-full" onClick={() => setModal("choose")}><Icon name="shield-check" size={15} />{p.canUseSeat ? "Use my sign-up plan" : "Choose a plan"}</DBtn>
          </>
        )}
      </Card>
      <AnimatePresence>
        {(modal === "choose" || modal === "change") && (
          <ChoosePlanModal key={modal} propertyId={propertyId} title={title} mode={modal === "change" ? "change" : "start"} current={l?.planType} onClose={() => setModal(null)} />
        )}
        {modal === "stop" && (
          <Modal key="stop" title="Stop monthly service for this property?" sub={title} onClose={() => setModal(null)}
            footer={<><DBtn variant="line" onClick={() => setModal(null)}>Keep plan</DBtn><DBtn variant="danger" disabled={busy} onClick={stop}>{busy ? "Stopping…" : "Stop at period end"}</DBtn></>}>
            <ul className="m-0 flex list-none flex-col gap-2 p-0 text-[13.5px] leading-relaxed text-text-secondary">
              <li className="flex gap-2"><Icon name="check" size={15} className="mt-[3px] flex-none text-green-dark" />Services continue until {day(p.periodEnd)} — you've paid for this period.</li>
              <li className="flex gap-2"><Icon name="check" size={15} className="mt-[3px] flex-none text-green-dark" />From the next renewal it's left out of your bill.</li>
              <li className="flex gap-2"><Icon name="check" size={15} className="mt-[3px] flex-none text-green-dark" />The property, its marking, photos and tenants stay in your account.</li>
              <li className="flex gap-2"><Icon name="info" size={15} className="mt-[3px] flex-none text-text-tertiary" />It comes off the market until you choose a plan again. To remove it completely, delete the property.</li>
            </ul>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
