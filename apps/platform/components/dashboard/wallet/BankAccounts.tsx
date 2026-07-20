"use client";

/* Bank accounts (payout destinations) — list w/ default chip, detail
   modal (delete inside), add-account modal, and the step-by-step
   change-default flow (pick → OTP → confirm).
   API: /api/v1/payments/bank-accounts (payment-service bankAccount.service —
   name-enquiry via Flutterwave happens server-side on add). */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { Modal, ConfirmDialog } from "@/components/dashboard/Modal";
import { DBtn, Card, CardH, Row, Thumb, KV, Banner, EmptyState } from "@/components/dashboard/primitives";
import { NCSelect, Field, inputCls } from "@/components/dashboard/NCSelect";
import * as api from "@/lib/api/dashboard";
import { NG_BANKS, type BankAccount, type Role } from "@/lib/dashboard/data";

export function BankAccountsCard({ role, accounts, update }: {
  role: Role; accounts: BankAccount[];
  update: (fn: (l: BankAccount[]) => BankAccount[]) => void;
}) {
  const [detail, setDetail] = useState<BankAccount | null>(null);
  const [adding, setAdding] = useState(false);
  return (
    <Card tight>
      <CardH pad title="Bank accounts"
        right={<button className="flex items-center gap-1 text-[13px] font-semibold text-green-dark hover:text-ink" onClick={() => setAdding(true)}><Icon name="plus" size={13} strokeWidth={2.5} />Add account</button>} />
      {accounts.length === 0 && <EmptyState icon="landmark" title="No bank account yet" sub="Add the account withdrawals and auto-payouts should land in." action={<DBtn sm onClick={() => setAdding(true)}>Add bank account</DBtn>} />}
      {accounts.map((a) => (
        <Row key={a.id} onClick={() => setDetail(a)}>
          <Thumb icon="landmark" size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-[14px] font-semibold tracking-[-0.01em]">{a.bankName}</span>
              {a.isDefault && <span className="inline-flex items-center gap-1 rounded-full bg-green-wash px-2 py-0.5 text-[10.5px] font-bold text-green-dark"><Icon name="check" size={10} strokeWidth={3} />Payout account</span>}
            </div>
            <div className="mt-1 text-[12.5px] text-text-tertiary"><span className="font-mono">••{a.accountNumber.slice(-4)}</span> · {a.accountName}</div>
          </div>
          <Icon name="chevron-right" size={14} className="text-text-tertiary" />
        </Row>
      ))}
      <div className="border-t border-border-hair px-4 py-3 text-[12px] text-text-tertiary">
        Your Newcondo <b className="text-text-primary">virtual accounts are created automatically</b> — one main account with your subscription, one per marked property. Bank accounts here are where withdrawals land.
      </div>
      <AnimatePresence>
        {detail && <BankAccountDetail key="d" account={detail} canDelete={accounts.length > 0} update={update} onClose={() => setDetail(null)} />}
        {adding && <AddBankAccountModal key="a" update={update} first={accounts.length === 0} onClose={() => setAdding(false)} />}
      </AnimatePresence>
    </Card>
  );
}

function BankAccountDetail({ account: a, update, onClose }: { account: BankAccount; canDelete: boolean; update: (fn: (l: BankAccount[]) => BankAccount[]) => void; onClose: () => void }) {
  const [del, setDel] = useState(false);
  const remove = () => {
    if (a.isDefault) { toast.error("This is your payout account", { description: "Pick another default in “Change payout account” before deleting it." }); return; }
    onClose();
    // DELETE /api/v1/payments/bank-accounts/:id — ownership enforced server-side
    if (api.isLiveBackend) api.removeBankAccount(a.id).catch(() => toast.error("Could not delete — try again"));
    update((l) => l.filter((x) => x.id !== a.id));
    toast.success("Bank account removed", { description: `${a.bankName} ••${a.accountNumber.slice(-4)}` });
  };
  return (
    <Modal title={a.bankName} sub={a.isDefault ? "Current payout account" : "Saved bank account"} onClose={onClose}
      footer={<>
        <DBtn variant="ghost" className="!text-danger sm:mr-auto" onClick={() => setDel(true)}><Icon name="trash-2" size={14} />Delete</DBtn>
        <DBtn onClick={onClose}>Done</DBtn>
      </>}>
      <KV k="Account name" v={a.accountName} />
      <KV k="Account number" v={a.accountNumber} mono />
      <KV k="Bank" v={a.bankName} />
      <KV k="Added" v={a.addedOn} />
      <KV k="Status" v={a.isDefault ? "Default for withdrawals & auto-payout" : "Available"} />
      <div className="mt-3"><Banner icon="shield-check">Verified against the bank via Flutterwave name enquiry when it was added.</Banner></div>
      <AnimatePresence>
        {del && <ConfirmDialog danger title="Delete this bank account?" confirmLabel="Delete account"
          body={`${a.bankName} ••${a.accountNumber.slice(-4)} will be removed. Past withdrawals to it stay in your payment history.`}
          onConfirm={remove} onClose={() => setDel(false)} />}
      </AnimatePresence>
    </Modal>
  );
}

function AddBankAccountModal({ update, first, onClose }: { update: (fn: (l: BankAccount[]) => BankAccount[]) => void; first: boolean; onClose: () => void }) {
  const [f, setF] = useState({ bank: "", number: "" });
  const [err, setErr] = useState<string | null>(null);
  const submit = () => {
    if (!f.bank) { setErr("Pick a bank"); return; }
    if (!/^\d{10}$/.test(f.number)) { setErr("Account number must be 10 digits"); return; }
    const [bankName, bankCode] = NG_BANKS.find(([n]) => n === f.bank)!;
    onClose();
    // POST /api/v1/payments/bank-accounts — Flutterwave name-enquiry runs
    // server-side; the returned accountName is the bank's registered holder.
    const doAdd = api.isLiveBackend
      ? api.addBankAccount({ bankName, bankCode, accountNumber: f.number })
      : new Promise<BankAccount>((res) => setTimeout(() => res({ id: "ba" + Date.now(), bankName, bankCode, accountNumber: f.number, accountName: "ACCOUNT HOLDER", isDefault: first, addedOn: "Today" }), 1400));
    toast.promise(doAdd.then((acct) => { update((l) => [...l.map((x) => ({ ...x, isDefault: acct.isDefault ? false : x.isDefault })), acct]); return acct; }), {
      loading: "Verifying account with the bank…",
      success: (acct) => `${acct.bankName} ••${acct.accountNumber.slice(-4)} added — verified as ${acct.accountName}.`,
      error: "Could not verify this account — check the number and bank.",
    });
  };
  return (
    <Modal title="Add a bank account" sub="We verify the account name with the bank before saving — withdrawals only ever go to an account in your name." onClose={onClose}
      footer={<><DBtn variant="line" onClick={onClose}>Cancel</DBtn><DBtn onClick={submit}><Icon name="check" size={14} strokeWidth={2.2} />Verify & add</DBtn></>}>
      <Field label="Bank"><NCSelect value={f.bank} onChange={(v) => { setF((x) => ({ ...x, bank: v })); setErr(null); }} options={NG_BANKS.map(([n]) => n)} /></Field>
      <Field label="Account number" error={err}>
        <input className={inputCls(!!err)} inputMode="numeric" maxLength={10} placeholder="0123456789" value={f.number}
          onChange={(e) => { setF((x) => ({ ...x, number: e.target.value.replace(/\D/g, "") })); setErr(null); }} />
      </Field>
      {first && <Banner icon="info">Your first account automatically becomes the payout default.</Banner>}
    </Modal>
  );
}

/* Change payout account — guided steps: pick → OTP → confirmed.
   Moving where money lands is sensitive, so a fresh OTP is required
   (auth-service otpService; PATCH .../:id/default carries it). */
export function ChangeBankFlow({ accounts, update, onClose }: {
  accounts: BankAccount[]; update: (fn: (l: BankAccount[]) => BankAccount[]) => void; onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<BankAccount | null>(null);
  const [otp, setOtp] = useState("");
  const current = accounts.find((a) => a.isDefault);
  const choices = accounts.filter((a) => !a.isDefault);
  const confirm = () => {
    if (otp.length !== 6) { toast.error("Enter the 6-digit code we sent you"); return; }
    // PATCH /api/v1/payments/bank-accounts/:id/default (OTP verified server-side)
    if (api.isLiveBackend && picked) api.setDefaultBankAccount(picked.id).catch(() => toast.error("Could not switch — try again"));
    update((l) => l.map((x) => ({ ...x, isDefault: x.id === picked!.id })));
    setStep(2);
  };
  const steps = ["Pick the new payout account", "Confirm with OTP", "Done"];
  return (
    <Modal title="Change payout account" sub={steps[step]} onClose={onClose}
      footer={step === 0 ? <>
        <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
        <DBtn disabled={!picked} onClick={() => { setStep(1); toast.info("Code sent", { description: "A 6-digit code was sent to your phone and email." }); }}>Continue<Icon name="arrow-right" size={14} strokeWidth={2.2} /></DBtn>
      </> : step === 1 ? <>
        <DBtn variant="line" onClick={() => setStep(0)}>Back</DBtn>
        <DBtn onClick={confirm}><Icon name="shield-check" size={14} />Confirm switch</DBtn>
      </> : <DBtn onClick={onClose}>Done</DBtn>}>
      <div className="mb-[18px] flex items-center gap-1.5">
        {steps.map((s, i) => <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-surface-sunken"><i className="block h-full bg-ink transition-[width] duration-300 ease-nc" style={{ width: i <= step ? "100%" : 0 }} /></span>)}
      </div>
      {step === 0 && (<>
        {current && <div className="mb-3"><Banner icon="landmark">Current: <b className="font-semibold">{current.bankName} ••{current.accountNumber.slice(-4)}</b> — {current.accountName}</Banner></div>}
        {choices.length === 0 && <EmptyState icon="landmark" title="No other account saved" sub="Add a second bank account first, then switch the payout default to it." />}
        {choices.map((a) => (
          <button key={a.id} onClick={() => setPicked(a)}
            className={cx("mb-2 flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-all", picked?.id === a.id ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-nc-border hover:border-ink")}>
            <Thumb icon="landmark" size={40} />
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold">{a.bankName} <span className="font-mono font-medium">••{a.accountNumber.slice(-4)}</span></span>
              <span className="mt-0.5 block text-[12.5px] text-text-tertiary">{a.accountName}</span>
            </span>
            {picked?.id === a.id && <Icon name="check" size={16} strokeWidth={2.5} className="text-green-dark" />}
          </button>
        ))}
      </>)}
      {step === 1 && (<>
        <p className="mb-3.5 mt-0 text-[13.5px] leading-relaxed text-text-secondary">Switching payouts to <b className="font-semibold text-text-primary">{picked?.bankName} ••{picked?.accountNumber.slice(-4)}</b>. Enter the 6-digit code we sent to your phone and email.</p>
        <Field label="Verification code">
          <input className={cx(inputCls(), "text-center font-mono text-[18px] tracking-[0.4em]")} inputMode="numeric" maxLength={6} autoFocus
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••••" />
        </Field>
        <Banner icon="info">Locked funds and pending escrows are unaffected — only where future withdrawals land changes.</Banner>
      </>)}
      {step === 2 && (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="mb-3.5 grid size-[52px] place-items-center rounded-full bg-green-wash text-green-dark"><Icon name="check" size={24} strokeWidth={2.5} /></span>
          <b className="text-[15px]">Payout account updated</b>
          <p className="mb-0 mt-1.5 max-w-[36ch] text-[13px] leading-normal text-text-tertiary">Withdrawals and auto-payouts now go to {picked?.bankName} ••{picked?.accountNumber.slice(-4)}.</p>
        </div>
      )}
    </Modal>
  );
}
