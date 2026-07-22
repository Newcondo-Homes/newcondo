"use client";

/* Wallet & Accounts.
   Layout: stats → virtual accounts (AUTO-created — read-only) + bank
   accounts (user-managed payout destinations) → auto-payout.
   Virtual-account model (confirmed against the codebase's
   propertyVirtualAccounts + markingVirtualAccountService): one MAIN VA per
   user created when their subscription activates (renters: on Premium
   upgrade), plus ONE PER MARKED PROPERTY — per-property VAs make rent
   reconciliation and escrow isolation automatic. There is deliberately no
   create-VA UI.
   API: GET /payments/wallet · POST /payments/wallet/withdraw ·
   PATCH /payments/wallet/auto-payout (payment-service wallet.service). */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatCard, Card, CardH, Row, Thumb, KV, Banner, EmptyState, SkeletonRows } from "@/components/dashboard/primitives";
import { Modal } from "@/components/dashboard/Modal";
import { Field, inputCls } from "@/components/dashboard/NCSelect";
import * as api from "@/lib/api/dashboard";
import { useWallet, useVirtualAccounts, useBankAccounts, useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import { BankAccountsCard, ChangeBankFlow } from "@/components/dashboard/wallet/BankAccounts";
import { ngn } from "@/lib/dashboard/format";
import type { BankAccount, Wallet } from "@/lib/dashboard/data";

const MODES = [["OFF", "Manual only"], ["INSTANT", "As soon as funds unlock"], ["WEEKLY", "Every Friday"], ["MONTHLY", "Last day of the month"]] as const;

export default function WalletPage() {
  const router = useRouter();
  const { role } = useRole();
  const wallet = useWallet(role);
  const vAccounts = useVirtualAccounts(role);
  const bankAccounts = useBankAccounts(role);
  const cache = useCacheUpdate();
  const [modal, setModal] = useState<null | "withdraw" | "changeBank">(null);
  if (role === "RENTER") {
    return <EmptyState icon="wallet" title="Your wallet unlocks with Premium" sub="Premium renters get a virtual wallet — created automatically on upgrade — for referral credits and marking-job earnings."
      action={<DBtn onClick={() => router.push("/profile")}>Upgrade to Premium</DBtn>} />;
  }
  if (wallet.isLoading || vAccounts.isLoading || bankAccounts.isLoading) return (<><PageHead title="Wallet & Accounts" sub="Loading…" /><SkeletonRows n={3} h={100} /></>);
  const w = wallet.data!;
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
      <PageHead title="Wallet & Accounts" sub="Escrowed funds unlock after each confirmation window, then move to your bank account — manually or automatically."
        actions={<DBtn disabled={w.available <= 0} onClick={() => setModal("withdraw")}><Icon name="landmark" size={15} />Withdraw</DBtn>} />
      <div className="mb-4 grid grid-cols-4 gap-4 max-[1060px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-2.5">
        <StatCard label="Available to withdraw" value={ngn(w.available)} icon="wallet" mono sub={"to " + bankLabel} />
        <StatCard label="Locked (in escrow / holds)" value={ngn(w.locked)} icon="lock" mono sub="releases after confirmation windows" />
        <StatCard label="Auto-payout" value={w.autoPayout === "OFF" ? "Off" : w.autoPayout.toLowerCase()} icon="refresh-cw" sub="change below" />
        <StatCard label="Bank accounts" value={banks.length} icon="landmark" sub={defaultBank ? `default: ${defaultBank.bankName}` : "add one to withdraw"} />
      </div>
      <div className="grid grid-cols-[1.6fr_1fr] gap-4 max-[860px]:grid-cols-1">
        <div className="flex flex-col gap-4">
          <Card tight>
            <CardH pad title="Virtual accounts" right={<span className="text-[12px] text-text-tertiary">auto-created by NewCondo · funds held here during windows</span>} />
            {(vAccounts.data ?? []).map((a) => (
              <Row key={a.id} onClick={() => toast.info("Account statement", { description: "Opens virtual-accounts/[id]/statements" })}>
                <Thumb icon="shield-check" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-[13px] font-semibold">{a.name}</div>
                  <div className="mt-1 text-[12.5px] text-text-tertiary"><span className="font-mono">{a.number}</span> · {a.bank}{a.property ? ` · ${a.property}` : " · main account"}</div>
                </div>
                <div className="flex-none text-right">
                  <div className={cx("font-mono text-[13px] font-semibold", a.available > 0 && "text-green-dark")}>{ngn(a.available)}</div>
                  {a.locked > 0 && <div className="mt-0.5 flex items-center justify-end gap-1 text-[11.5px] text-[#8a6508]"><Icon name="lock" size={11} />{ngn(a.locked)} locked</div>}
                </div>
                <Icon name="chevron-right" size={14} className="text-text-tertiary" />
              </Row>
            ))}
            <div className="border-t border-border-hair px-4 py-3 text-[12px] text-text-tertiary">
              Created for you automatically: your <b className="text-text-primary">main account</b> when your subscription activated, and <b className="text-text-primary">one per marked property</b> so each house&rsquo;s rent and escrow reconcile on their own.
            </div>
          </Card>
          <BankAccountsCard role={role} accounts={banks} update={updateBanks} />
        </div>
        <Card className="self-start">
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
  const submit = () => {
    const n = +amt;
    if (!n || n <= 0) { setErr("Enter an amount"); return; }
    if (n > wallet.available) { setErr(`You can withdraw up to ${ngn(wallet.available)}`); toast.error("Amount exceeds available balance"); return; }
    onClose(); onDone(n);
    // POST /api/v1/payments/wallet/withdraw { amount } — backend re-checks the
    // balance, creates a PENDING WITHDRAWAL Payment, fires the Flutterwave
    // transfer to the DEFAULT bank account; the transfer webhook settles it.
    const doWithdraw = api.isLiveBackend ? api.withdrawApi(n) : new Promise((res) => setTimeout(res, 2000));
    toast.promise(doWithdraw, {
      loading: `Sending ${ngn(n)} to ${bankLabel} — Flutterwave transfer initiated…`,
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
      <div className="mt-4"><Banner icon="info">Withdrawals are free and always go to your default bank account. Locked funds can&rsquo;t be withdrawn until their confirmation window closes.</Banner></div>
    </Modal>
  );
}
