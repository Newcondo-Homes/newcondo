"use client";

/* ============================================================
   Wallet ledger UI — replaces the old "Virtual accounts" card.
   FundingAccountCard: where money goes in by bank transfer. In POOLED mode
     that's Newcondo's central account + the payment reference; in
     PER_USER_VA mode it's the user's own NUBAN. The copy comes from the API
     (MONEY_COPY), so flipping the mode changes this card with no UI edit.
   WalletStatementCard: every credit/debit on the user's wallet, from the
     ledger (paged, page numbers — no infinite scroll).
   API: GET /payments/wallet/funding-account · GET /payments/wallet/ledger?page=
   ============================================================ */
import { useState } from "react";
import { Card, CardH, Row, Thumb, KV, CopyField, EmptyState, SkeletonRows } from "@/components/dashboard/primitives";
import { cx } from "@/lib/cx";
import { useFundingAccount, useWalletStatement } from "@/hooks/dashboard/useDashboardData";
import { ngn } from "@/lib/dashboard/format";

const LABEL: Record<string, string> = {
  RENT_RELEASED: "Rent released", WITHDRAWAL_INITIATED: "Withdrawal", WITHDRAWAL_REVERSED: "Withdrawal reversed",
  WITHDRAWAL_SETTLED: "Withdrawal delivered", MARKING_HOLD: "Marking payout (held)", MARKING_RELEASED: "Marking payout",
  REFERRAL_OVERRIDE: "Founding Agent Override", OPENING_BALANCE: "Opening balance", ADJUSTMENT: "Adjustment",
};
const ICON: Record<string, string> = { RENT_RELEASED: "home", WITHDRAWAL_INITIATED: "landmark", WITHDRAWAL_REVERSED: "rotate-ccw", MARKING_HOLD: "lock", MARKING_RELEASED: "map-pin", REFERRAL_OVERRIDE: "gift" };

export function FundingAccountCard() {
  const { data, isLoading } = useFundingAccount();
  if (isLoading || !data) return <Card><SkeletonRows n={2} h={36} /></Card>;
  return (
    <Card>
      <CardH title={data.mode === "POOLED" ? "Pay by bank transfer" : "Your account number"} right={<span className="text-[12px] text-text-tertiary">{data.bankName}</span>} />
      <KV k="Account name" v={data.accountName} />
      <div className="my-2"><CopyField value={data.accountNumber} /></div>
      <p className="m-0 text-[12.5px] leading-normal text-text-tertiary">{data.note}</p>
      <p className="m-0 mt-1.5 text-[12px] text-text-tertiary">Max {ngn(data.perTransactionMaxNaira)} per transfer. Card payments at checkout need no reference.</p>
    </Card>
  );
}

export function WalletStatementCard() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useWalletStatement(page);
  const lines = data?.lines ?? [];
  return (
    <Card tight>
      <CardH pad title="Wallet activity" right={<span className="text-[12px] text-text-tertiary">every kobo, in order</span>} />
      {isLoading ? <div className="px-4 pb-4"><SkeletonRows n={3} h={44} /></div>
        : !lines.length ? <EmptyState icon="wallet" title="No activity yet" sub="Released rent, commissions and payouts appear here." />
        : lines.map((l) => (
          <Row key={l.id}>
            <Thumb icon={ICON[l.type] ?? "receipt"} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold">{LABEL[l.type] ?? l.type.replace(/_/g, " ").toLowerCase()}</div>
              <div className="mt-0.5 truncate text-[12.5px] text-text-tertiary">{l.memo ?? ""} · {new Date(l.at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}{l.bucket === "pending" ? " · locked" : ""}</div>
            </div>
            <span className={cx("flex-none font-mono text-[13px] font-semibold", l.amount > 0 ? "text-green-dark" : "text-text-primary")}>{l.amount > 0 ? "+" : "−"}{ngn(Math.abs(l.amount))}</span>
          </Row>
        ))}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 border-t border-border-hair px-4 py-3">
          {Array.from({ length: data.totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map((n) => (
            <button key={n} onClick={() => setPage(n)} className={cx("min-w-8 rounded-full px-2.5 py-1 text-[12.5px] font-semibold", n === page ? "bg-ink text-cream" : "text-text-secondary hover:bg-surface-sunken")}>{n}</button>
          ))}
        </div>
      )}
    </Card>
  );
}
