"use client";

/* Payments (OWNER) / Commissions (AGENT) / My Rentals (RENTER).
   Escrow card with 24h countdown, filterable history (filter persists),
   row click → PaymentDetailModal, renter rental card → RentalModal.
   Mobile: table becomes tappable card rows. */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatusBadge, Card, CardH, Row, Thumb, Tabs, EmptyState, SkeletonRows, Countdown, Meter, KV, Banner } from "@/components/dashboard/primitives";
import { usePersistedTab } from "@/hooks/dashboard/usePersistedTab";
import { useIsMobile } from "@/hooks/useIsMobile";
import { usePayments, usePendingEscrow, useRenterRental } from "@/hooks/dashboard/useDashboardData";
import { PaymentDetailModal } from "@/components/dashboard/payments/PaymentDetailModal";
import { RentalModal } from "@/components/dashboard/payments/RentalModal";
import { ngn, signNgn } from "@/lib/dashboard/format";
import type { Tx, TxType } from "@/lib/dashboard/data";

const KINDS: Record<string, string> = { all: "All", RENT_IN: "Rent", COMMISSION: "Commissions", MARKING: "Marking", WITHDRAW: "Withdrawals", FEE: "Fees" };

export default function PaymentsPage() {
  const { role } = useRole();
  const isMobile = useIsMobile();
  const payments = usePayments(role);
  const escrow = usePendingEscrow(role);
  const rental = useRenterRental();
  const [filter, setFilter] = usePersistedTab("nc-pay-filter-" + role, "all");
  const [detail, setDetail] = useState<Tx | null>(null);
  const [rentalOpen, setRentalOpen] = useState(false);
  const title = role === "AGENT" ? "Commissions" : role === "RENTER" ? "My Rentals" : "Payments";
  if (payments.isLoading) return (<><PageHead title={title} sub="Loading…" /><SkeletonRows n={5} h={58} /></>);
  const rows = payments.data ?? [];
  const present = ["all", ...Object.keys(KINDS).filter((k) => k !== "all" && rows.some((r) => r.type === (k as TxType)))];
  const shown = rows.filter((r) => filter === "all" || r.type === filter);
  const sub = role === "AGENT" ? "Listing commissions, sub-agent splits and marking payouts — held 24h, then released."
    : role === "RENTER" ? "Your rentals and every payment you make — escrowed with a 24-hour confirmation window."
    : "Rent lands in escrow, clears the renter's 24-hour window, then releases to your account minus the platform commission.";
  return (
    <>
      <PageHead title={title} sub={sub} />
      {role === "RENTER" && rental.data && (
        <Card tight className="mb-4">
          <CardH pad title="Your rentals" right={<span className="text-[12px] text-text-tertiary">tap for details &amp; actions</span>} />
          <Row onClick={() => setRentalOpen(true)}>
            <Thumb icon="home" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{rental.data.property} · {rental.data.flat}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-text-tertiary">
                <StatusBadge s="CONFIRMED">Active tenancy</StatusBadge><span>till {rental.data.till} · agent {rental.data.agent}</span>
              </div>
            </div>
            <Icon name="chevron-right" size={15} className="text-text-tertiary" />
          </Row>
        </Card>
      )}
      {(escrow.data ?? []).map((e) => (
        <Card key={e.id} className="mb-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="m-0 flex flex-wrap items-center gap-2.5 text-[16.5px] font-bold tracking-[-0.02em]"><Icon name="lock" size={17} />In escrow — {e.property} ({e.flat})<StatusBadge s="IN_ESCROW" /></h3>
            <Countdown hoursLeft={e.hoursLeft} />
          </div>
          <div className="mb-3.5"><Meter warn pct={((24 - e.hoursLeft) / 24) * 100} /></div>
          <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
            <div>
              <KV k="Renter" v={`${e.renter} · identity verified`} />
              <KV k="Amount held" v={ngn(e.amount)} mono />
              <KV k="Platform commission (15% Elite)" v={`−${ngn(e.amount * 0.15)}`} mono />
              <KV k="You receive" v={<span className="text-green-dark">{ngn(e.amount * 0.85)}</span>} mono />
            </div>
            <Banner icon="info">The renter has 24 hours to visit and confirm the property matches the listing. If the window passes quietly, the money releases automatically — the flat has already been locked against double-booking.</Banner>
          </div>
        </Card>
      ))}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={filter} onChange={setFilter} items={present.map((k) => [k, KINDS[k]] as [string, string])} />
        <DBtn variant="line" sm onClick={() => toast.promise(new Promise((res) => setTimeout(res, 1200)), { loading: "Preparing statement…", success: "Statement exported. TODO(backend): GET /api/payments/export", error: "Export failed" })}>
          <Icon name="download" size={14} />Export
        </DBtn>
      </div>
      <Card tight>
        {shown.length === 0 ? <EmptyState icon="receipt" title="No transactions" sub="Payments will appear here as they happen." />
        : isMobile ? shown.map((r) => (
          <Row key={r.id} onClick={() => setDetail(r)}>
            <Thumb size={44} icon="receipt" />
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-semibold tracking-[-0.01em]">{r.desc}</div>
              <div className="mt-1 text-[12.5px] text-text-tertiary">{r.date}{r.note && ` · ${r.note}`}</div>
            </div>
            <div className="flex-none text-right">
              <span className={"font-mono text-[13px] font-semibold " + (r.amount > 0 ? "text-green-dark" : "")}>{signNgn(r.amount)}</span>
              <div className="mt-1"><StatusBadge s={r.status} /></div>
            </div>
          </Row>
        )) : (
          <table className="w-full border-collapse">
            <thead><tr>
              {["Date", "Description", "Amount", "Status", ""].map((h, i) => (
                <th key={h + i} className={"border-b border-border-hair px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary" + (i === 2 ? " text-right" : "")}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} onClick={() => setDetail(r)} className="cursor-pointer border-b border-border-hair transition-colors last:border-b-0 hover:bg-surface-sunken">
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-[12.5px] text-text-tertiary">{r.date}</td>
                  <td className="px-4 py-3 text-[13.5px]"><div className="font-semibold">{r.desc}</div>{r.note && <div className="mt-0.5 text-[12px] text-text-tertiary">{r.note}</div>}</td>
                  <td className="px-4 py-3 text-right"><span className={"font-mono text-[13px] font-semibold " + (r.amount > 0 ? "text-green-dark" : "")}>{signNgn(r.amount)}</span></td>
                  <td className="px-4 py-3"><StatusBadge s={r.status} /></td>
                  <td className="px-4 py-3"><Icon name="chevron-right" size={14} className="text-text-tertiary" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <AnimatePresence>
        {detail && <PaymentDetailModal key="pd" row={detail} role={role} onClose={() => setDetail(null)} />}
        {rentalOpen && <RentalModal key="rm" onClose={() => setRentalOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
