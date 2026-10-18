"use client";

/* ============================================================
   BillingSummaryCard — the owner's whole bill, property by property.
   Shown on Wallet & Accounts. Next bill = Σ active lines at their scheduled
   tier, minus nothing (referral credit is applied at charge time and shows
   on the invoice). API: GET /payments/billing/summary
   ============================================================ */
import { useRouter } from "next/navigation";
import { Card, CardH, Row, Thumb, StatusBadge, EmptyState, SkeletonRows } from "@/components/dashboard/primitives";
import { Icon } from "@/components/ui/icon";
import { useBillingSummary } from "@/hooks/dashboard/useDashboardData";
import { ngn } from "@/lib/dashboard/format";

const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short" }) : "—");

export function BillingSummaryCard() {
  const router = useRouter();
  const { data, isLoading } = useBillingSummary();
  if (isLoading) return <Card><SkeletonRows n={3} h={44} /></Card>;
  if (!data) return null;
  return (
    <Card tight>
      <CardH pad title="Plans & billing" right={<span className="font-mono text-[13px] font-semibold">{ngn(data.nextBillNaira)}<span className="font-sans text-[11.5px] font-normal text-text-tertiary"> on {day(data.periodEnd)}</span></span>} />
      {data.reservedSeat && (
        <Row>
          <Thumb icon="sparkles" />
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold">{data.reservedSeat.name} — unused</div>
            <div className="mt-0.5 text-[12.5px] text-text-tertiary">Your first property will use the plan you paid for at sign-up.</div>
          </div>
        </Row>
      )}
      {data.lines.map((l) => (
        <Row key={l.propertyId} onClick={() => router.push(`/properties/${l.propertyId}`)}>
          <Thumb icon="building-2" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold">{l.title}</div>
            <div className="mt-0.5 text-[12.5px] text-text-tertiary">
              {l.name}{l.nextPlan ? ` → ${l.nextPlan.name} at renewal` : ""}{l.included ? " · sign-up plan" : ""}
            </div>
          </div>
          <div className="flex flex-none items-center gap-2.5">
            <span className={l.cancelAtPeriodEnd ? "font-mono text-[13px] text-text-tertiary line-through" : "font-mono text-[13px] font-semibold"}>{ngn(l.amountNaira)}</span>
            {l.cancelAtPeriodEnd ? <StatusBadge s="PENDING">Stopping</StatusBadge> : l.status === "PENDING_PAYMENT" ? <StatusBadge s="PENDING">Unpaid</StatusBadge> : null}
            <Icon name="chevron-right" size={14} className="text-text-tertiary" />
          </div>
        </Row>
      ))}
      {data.withoutPlan.map((p) => (
        <Row key={p.propertyId} onClick={() => router.push(`/properties/${p.propertyId}`)}>
          <Thumb icon="building-2" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold">{p.title}</div>
            <div className="mt-0.5 text-[12.5px] text-text-tertiary">No plan — off the market</div>
          </div>
          <span className="flex-none text-[13px] font-semibold text-green-dark">Choose plan</span>
        </Row>
      ))}
      {!data.lines.length && !data.withoutPlan.length && !data.reservedSeat && (
        <EmptyState icon="building-2" title="No properties on a plan" sub="List a property to put it on a plan." />
      )}
      <div className="border-t border-border-hair px-4 py-3 text-[12px] text-text-tertiary">
        Billed {data.cycle === "ANNUAL" ? "yearly" : "monthly"}{data.savedCard?.last4 ? ` to ${data.savedCard.brand ?? "card"} •••• ${data.savedCard.last4}` : ""}. Each property has its own tier; stopping one lowers the next bill and keeps the property.
      </div>
    </Card>
  );
}
