"use client";

/* ============================================================
   Referral programs panel (spec §14) — everything here is rendered from
   the backend's rules.ts via the API, so changing a pool %, a cap or the
   sprint window changes this copy with no frontend edit.
     • Credit: available · scheduled (with dates) · expiring · lifetime
     • Active programs (sprint spots counter, founding override for cohort agents)
     • Milestone ladder with progress, "Book it" for unlocked service credits
     • Yearly cap usage — explains limits before anyone hits them
   API: GET /referrals/me · GET /referrals/programs ·
        POST /referrals/service-credits/:ledgerId/redeem
   ============================================================ */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@newcondo/ui";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { Card, CardH, DBtn, KV, SkeletonRows } from "@/components/dashboard/primitives";
import { Modal } from "@/components/dashboard/Modal";
import { Field } from "@/components/dashboard/NCSelect";
import { useReferralOverview, useReferralPrograms, useMyProperties } from "@/hooks/dashboard/useDashboardData";
import { useRole } from "@/components/providers/role-provider";
import * as money from "@/lib/api/money";
import { ngn } from "@/lib/dashboard/format";

const day = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "");

export function ReferralCreditPanel() {
  const { data, isLoading } = useReferralOverview();
  if (isLoading || !data) return <Card><SkeletonRows n={3} h={30} /></Card>;
  const c = data.credit;
  return (
    <Card>
      <CardH title="Your credit" right={<span className="text-[12px] text-text-tertiary">lifetime {ngn(c.lifetimeEarned)}</span>} />
      <div className="mb-2 font-mono text-[28px] font-semibold tracking-[-0.02em] text-green-dark">{ngn(c.available)}</div>
      <p className="m-0 mb-3 text-[12.5px] leading-normal text-text-tertiary">Credit applies automatically to your next subscription charge.</p>
      {c.scheduled.map((s, i) => <KV key={`s${i}`} k={`Arrives ${day(s.availableAt)}`} v={`+${ngn(s.amount)}`} mono />)}
      {c.expiringSoon.map((s, i) => <KV key={`e${i}`} k={<span className="text-[#8a6508]">Expires {day(s.expiresAt)}</span>} v={ngn(s.amount)} mono />)}
      {data.overrides && <KV k="Founding Agent Override paid" v={`${ngn(data.overrides.total)} · ${data.overrides.count}×`} mono />}
      {data.capUsage.map((u) => (
        <div key={u.ruleId} className="mt-3">
          <div className="mb-1 flex justify-between text-[12px] text-text-tertiary"><span>{u.title} — yearly limit</span><span className="font-mono">{ngn(u.used)} of {ngn(u.cap)}</span></div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, (u.used / u.cap) * 100)}%` }} /></div>
        </div>
      ))}
    </Card>
  );
}

export function ReferralProgramsPanel() {
  const { role } = useRole();
  const programs = useReferralPrograms();
  const me = useReferralOverview();
  const [redeem, setRedeem] = useState<null | { ledgerId: string; title: string }>(null);
  if (programs.isLoading || !programs.data) return <Card><SkeletonRows n={3} h={50} /></Card>;
  const p = programs.data;
  const cards = p.programs.filter((x) => x.kind !== "milestone");
  const ladder = me.data?.milestones ?? [];

  return (
    <>
      <Card>
        <CardH title="How it works" />
        <ol className="m-0 mb-1 grid list-none grid-cols-3 gap-2.5 p-0 max-sm:grid-cols-1">
          {p.howItWorks.map((s, i) => (
            <li key={s} className="flex items-center gap-2.5 rounded-2xl bg-surface-sunken px-3.5 py-3 text-[13px] font-semibold">
              <span className="grid size-6 flex-none place-items-center rounded-full bg-ink text-[11.5px] text-cream">{i + 1}</span>{s}
            </li>
          ))}
        </ol>
        {!p.enabled && <p className="m-0 mt-2 text-[12.5px] text-[#8a6508]">New rewards are paused right now. Credit you already have still applies.</p>}
        <div className="mt-3 flex flex-col gap-1">
          {p.hints.map((h) => <p key={h} className="m-0 flex gap-1.5 text-[12px] leading-normal text-text-tertiary"><Icon name="info" size={13} className="mt-[2px] flex-none" />{h}</p>)}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
        {cards.map((c) => (
          <Card key={c.ruleId} className="min-w-0">
            <div className="mb-1 flex items-start justify-between gap-2">
              <h4 className="m-0 text-[15px] font-semibold tracking-[-0.02em]">{c.title}</h4>
              {c.kind === "override" && <span className="flex-none rounded-full bg-ink px-2 py-0.5 text-[10.5px] font-bold text-cream">Founding</span>}
            </div>
            <p className="m-0 text-[13px] leading-normal text-text-secondary">{c.blurb}</p>
            <p className="m-0 mt-2 text-[12.5px] leading-normal text-text-tertiary">{c.reward}</p>
            {c.spots && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-[12px]"><b>{c.spots.total - c.spots.claimed} of {c.spots.total} spots left</b>{c.endsAt && <span className="text-text-tertiary">ends {day(c.endsAt)}</span>}</div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"><div className="h-full rounded-full bg-green-dark" style={{ width: `${(c.spots.claimed / c.spots.total) * 100}%` }} /></div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {role !== "RENTER" && ladder.length > 0 && (
        <Card>
          <CardH title="Milestones" right={<span className="text-[12px] text-text-tertiary">active landlords you referred</span>} />
          <div className="flex flex-col gap-3">
            {ladder.map((m) => {
              const pct = Math.min(100, (m.current / m.target) * 100);
              const left = Math.max(0, m.target - m.current);
              return (
                <div key={m.ruleId} className="flex items-center gap-3 max-sm:flex-col max-sm:items-stretch">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 text-[13.5px] font-semibold">
                      <span className="truncate">{m.title}</span>
                      <span className="flex-none font-mono text-[12px] text-text-tertiary">{Math.min(m.current, m.target)}/{m.target}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-sunken"><div className={cx("h-full rounded-full", m.state === "unlocked" || m.state === "used" ? "bg-green-dark" : "bg-ink")} style={{ width: `${pct}%` }} /></div>
                    <div className="mt-1 text-[11.5px] text-text-tertiary">
                      {m.state === "locked" ? `${left} more landlord${left === 1 ? "" : "s"} to unlock` : m.state === "pending" ? "Reached — releasing once your referrals' payments cover it" : m.state === "unlocked" ? `Ready to book${m.expiresAt ? ` · expires ${day(m.expiresAt)}` : ""}` : m.state === "used" ? "Booked" : "Closed"}
                    </div>
                  </div>
                  {m.state === "unlocked" && m.ledgerId && role === "OWNER" && (
                    <DBtn sm onClick={() => setRedeem({ ledgerId: m.ledgerId!, title: m.title })}>Book it</DBtn>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <AnimatePresence>
        {redeem && <RedeemServiceModal key="redeem" {...redeem} onClose={() => setRedeem(null)} />}
      </AnimatePresence>
    </>
  );
}

function RedeemServiceModal({ ledgerId, title, onClose }: { ledgerId: string; title: string; onClose: () => void }) {
  const qc = useQueryClient();
  const props = useMyProperties();
  const [propertyId, setPropertyId] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!propertyId) { toast.error("Choose a property", { duration: 6000 }); return; }
    setBusy(true);
    try {
      await money.redeemServiceCredit(ledgerId, propertyId);
      toast.success(`${title} booked`, { description: "A vendor will propose a time within 24 hours. Newcondo pays them.", duration: 7000 });
      qc.invalidateQueries({ queryKey: ["referrals"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      onClose();
    } catch (e) {
      toast.error("Couldn't book it", { description: (e as Error).message, duration: 7000 });
    } finally { setBusy(false); }
  };
  return (
    <Modal title={`Book: ${title}`} sub="One of your own properties, on an active plan." onClose={onClose}
      footer={<><DBtn variant="line" onClick={onClose}>Cancel</DBtn><DBtn disabled={busy} onClick={submit}>{busy ? "Booking…" : "Book service"}</DBtn></>}>
      <Field label="Property">
        <div className="flex flex-col gap-2">
          {(props.data ?? []).map((p) => (
            <button key={p.id} type="button" onClick={() => setPropertyId(p.id)}
              className={cx("flex w-full items-center justify-between rounded-2xl border px-3.5 py-2.5 text-left text-[13.5px]", propertyId === p.id ? "border-ink shadow-[0_0_0_1px_var(--ink)]" : "border-nc-border hover:border-ink")}>
              <span className="truncate font-semibold">{p.title}</span>
              {propertyId === p.id && <Icon name="check" size={15} strokeWidth={2.5} className="text-green-dark" />}
            </button>
          ))}
        </div>
      </Field>
    </Modal>
  );
}
