"use client";

/* Wallet & Accounts.
   MONEY CORE (Oct 2026): Newcondo runs ONE central account. A user's balance
   is their ledger wallet inside it (available · pending · locked), not a
   Flutterwave virtual account. Layout: stats → [owner] plans & billing →
   wallet activity (ledger) + bank accounts → pay-by-transfer + auto-payout.
   When per-user virtual accounts are enabled server-side, the funding card
   shows the user's own NUBAN instead — no change here.
   API: GET /payments/wallet · /wallet/ledger · /wallet/funding-account ·
   POST /payments/wallet/withdraw · PATCH /payments/wallet/auto-payout. */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatCard, Card, CardH, KV, Banner, EmptyState, SkeletonRows } from "@/components/dashboard/primitives";
import { Modal } from "@/components/dashboard/Modal";
import { Field, inputCls } from "@/components/dashboard/NCSelect";
import * as api from "@/lib/api/dashboard";
import { useWallet, useBankAccounts, useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import { FundingAccountCard, WalletStatementCard } from "@/components/dashboard/wallet/WalletLedger";
import { BillingSummaryCard } from "@/components/dashboard/billing/BillingSummaryCard";
import type { WalletV2 } from "@/lib/api/money";
import { BankAccountsCard, ChangeBankFlow } from "@/components/dashboard/wallet/BankAccounts";
import { ngn } from "@/lib/dashboard/format";
import { payoutBreakdown, minWithdrawalNaira, transferFeeFor } from "@/lib/constants/business";
import type { BankAccount, Wallet } from "@/lib/dashboard/data";

const MODES = [["OFF", "Manual only"], ["INSTANT", "As soon as funds unlock"], ["WEEKLY", "Every Friday"], ["MONTHLY", "Last day of the month"]] as const;

export default function WalletPage() {
  const router = useRouter();
  const { role } = useRole();
  const wallet = useWallet(role);
  const bankAccounts = useBankAccounts(role);
  const cache = useCacheUpdate();
  const [modal, setModal] = useState<null | "withdraw" | "changeBank">(null);
  if (role === "RENTER") {
    return <EmptyState icon="wallet" title="Your wallet unlocks with Premium" sub="Premium renters get a virtual wallet — created automatically on upgrade — for referral credits and marking-job earnings."
      action={<DBtn onClick={() => router.push("/profile")}>Upgrade to Premium</DBtn>} />;
  }
  if (wallet.isLoading || bankAccounts.isLoading) return (<><PageHead title="Wallet & Accounts" sub="Loading…" /><SkeletonRows n={3} h={100} /></>);
  const w = wallet.data! as Wallet & Partial<WalletV2>;
  const banks = bankAccounts.data ?? [];
  const defaultBank = banks.find((b) => b.isDefault);
  const bankLabel = defaultBank ? `${defaultBank.bankName} ••${defaultBank.accountNumber.slice(-4)}` : "no payout account";
  const updateBanks = (fn: (l: BankAccount[]) => BankAccount[]) => cache.update<BankAccount[]>(["bank-accounts", role], fn);
  const setAuto = (mode: Wallet["autoPayout"]) => {
    // PATCH /api/v1/payments/wallet/auto-payout { mode } — optimistic cache keeps it instant
    if (api.isLiveBackend) api.setAutoPayoutApi(mode).catch(() => toast.error("Could not save auto-payout — try again"));
    cache.update<Wallet>(["wallet", role], (x) => ({ ...x, autoPayout: mode }));
    toast.success("Auto-payout updated", { description: mode === "OFF" ? "You'll withdraw manually." : `Available funds transfer to ${bankLabel} ${mode.toLowerCase()}.` });
  };
  return (
    <>
      <PageHead title="Wallet & Accounts" sub={w.note ?? "Escrowed funds unlock after each confirmation window, then move to your bank account — manually or automatically."}
        actions={<DBtn disabled={w.available <= 0} onClick={() => setModal("withdraw")}><Icon name="landmark" size={15} />Withdraw</DBtn>} />
      <div className="mb-4 grid grid-cols-4 gap-4 max-[1060px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-2.5">
        <StatCard label="Available to withdraw" value={ngn(w.available)} icon="wallet" mono sub={"to " + bankLabel} />
        <StatCard label="Locked (in escrow / holds)" value={ngn(w.locked)} icon="lock" mono sub="releases after confirmation windows" />
        <StatCard label="Pending" value={ngn(w.pending ?? 0)} icon="clock" mono sub="credited, unlocks on confirmation" />
        <StatCard label="Bank accounts" value={banks.length} icon="landmark" sub={defaultBank ? `default: ${defaultBank.bankName}` : "add one to withdraw"} />
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 max-[860px]:grid-cols-1">
        <div className="flex flex-col gap-4">
          {role === "OWNER" && <BillingSummaryCard />}
          <WalletStatementCard />
          <BankAccountsCard role={role} accounts={banks} update={updateBanks} />
        </div>
        <div className="flex flex-col gap-4 self-start">
        <FundingAccountCard />
        <Card>
          <CardH title="Auto-payout" />
          <p className="mb-3.5 mt-0 text-[13px] leading-normal text-text-tertiary">Move available funds to your bank automatically — as soon as they unlock, or on a schedule.</p>
          {MODES.map(([m, label]) => (
            <button key={m} onClick={() => setAuto(m)}
              className={cx("mb-2 flex w-full items-center justify-between rounded-2xl border px-3.5 py-[11px] text-left transition-all",
                w.autoPayout === m ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-nc-border hover:border-ink")}>
              <b className="text-[13.5px]">{label}</b>
              {w.autoPayout === m && <Icon name="check" size={16} strokeWidth={2.5} className="text-green-dark" />}
            </button>
          ))}
          <div className="my-4 h-px bg-border-hair" />
          <KV k="Payout account" v={bankLabel} />
          <button className="mt-1.5 text-[13px] font-semibold text-green-dark hover:text-ink" onClick={() => setModal("changeBank")}>
            Change payout account
          </button>
        </Card>
        </div>
      </div>
      <AnimatePresence>
        {modal === "withdraw" && <WithdrawModal key="w" wallet={w} bankLabel={bankLabel} onClose={() => setModal(null)}
          onDone={(amt) => cache.update<Wallet>(["wallet", role], (x) => ({ ...x, available: x.available - amt }))} />}
        {modal === "changeBank" && <ChangeBankFlow key="cb" accounts={banks} update={updateBanks} onClose={() => setModal(null)} />}
      </AnimatePresence>
    </>
  );
}

function WithdrawModal({ wallet, bankLabel, onClose, onDone }: { wallet: Wallet; bankLabel: string; onClose: () => void; onDone: (amt: number) => void }) {
  const [amt, setAmt] = useState("");
  const [err, setErr] = useState<string | null>(null);
  // Flutterwave's transfer fee comes out of the payout (constants/fees.ts) —
  // the same breakdown the backend applies when it sends the transfer.
  const min = minWithdrawalNaira();
  const breakdown = +amt > 0 ? payoutBreakdown(+amt) : null;
  const submit = () => {
    const n = +amt;
    if (!n || n <= 0) { setErr("Enter an amount"); return; }
    if (n < min) { setErr(`The minimum withdrawal is ${ngn(min)}`); return; }
    if (n > wallet.available) { setErr(`You can withdraw up to ${ngn(wallet.available)}`); toast.error("Amount exceeds available balance"); return; }
    onClose(); onDone(n);
    // POST /api/v1/payments/wallet/withdraw { amount } — backend re-checks the
    // balance, creates a PENDING WITHDRAWAL Payment, fires the Flutterwave
    // transfer to the DEFAULT bank account; the transfer webhook settles it.
    const doWithdraw = api.isLiveBackend ? api.withdrawApi(n) : new Promise((res) => setTimeout(res, 2000));
    toast.promise(doWithdraw, {
      loading: `Sending ${ngn(payoutBreakdown(n).receiveNaira)} to ${bankLabel} — Flutterwave transfer initiated…`,
      success: "Withdrawal on its way — transfers usually land within minutes. You'll get an email receipt.",
      error: "Transfer failed — your balance was not touched",
    });
  };
  return (
    <Modal title="Withdraw to bank" sub={`Available: ${ngn(wallet.available)} · destination ${bankLabel}`} onClose={onClose}
      footer={<><DBtn variant="line" onClick={onClose}>Cancel</DBtn><DBtn onClick={submit}>Withdraw</DBtn></>}>
      <Field label="Amount (₦)" error={err}>
        <input className={inputCls(!!err)} type="number" placeholder="0" value={amt} autoFocus onChange={(e) => { setAmt(e.target.value); setErr(null); }} />
      </Field>
      <div className="flex gap-2">
        {[0.25, 0.5, 1].map((f) => (
          <DBtn key={f} variant="line" sm onClick={() => { setAmt(String(Math.floor(wallet.available * f))); setErr(null); }}>{f === 1 ? "All" : f * 100 + "%"}</DBtn>
        ))}
      </div>
      {breakdown && (
        <div className="mt-4 rounded-2xl bg-surface-sunken px-4 py-1">
          <KV k="From your wallet" v={ngn(breakdown.requestedNaira)} mono />
          <KV k="Flutterwave transfer fee" v={`− ${ngn(breakdown.feeNaira)}`} mono />
          <KV k="Arrives in your bank" v={ngn(breakdown.receiveNaira)} mono />
        </div>
      )}
      <div className="mt-4"><Banner icon="info">Flutterwave charges {ngn(transferFeeFor(5_000))}, {ngn(transferFeeFor(50_000))} or {ngn(transferFeeFor(50_001))} per transfer depending on the amount (VAT included). It&rsquo;s taken from the amount you withdraw. Withdrawals always go to your default bank account; locked funds can&rsquo;t be withdrawn until their confirmation window closes.</Banner></div>
    </Modal>
  );
}
