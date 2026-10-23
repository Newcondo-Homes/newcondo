"use client";
// apps/admin/components/users/ImpersonateDialog.tsx
// Reason-bound "Act as user". On success the platform (or vendors app) opens in a new
// tab with the short-lived token in the URL fragment; the banner shows the countdown.
import { useState } from "react";
import { Eye, AlertTriangle, Check } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { A } from "@/lib/api/admin";
import { Modal } from "@/components/ui/primitives";

export function ImpersonateDialog({ user, onClose }: { user: { id: string; name: string | null }; onClose: () => void }) {
  const [reason, setReason] = useState(""); const [ack, setAck] = useState(false); const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const start = async () => {
    setBusy(true);
    // Open the tab inside the click (popup blockers reject window.open after an await), then navigate it.
    const w = window.open("", "_blank");
    try {
      const s = await A.impersonate(user.id, reason.trim());
      if (w && s.platformUrl) { w.opener = null; w.location.href = s.platformUrl; }
      else if (s.platformUrl) toast.warning("Allow pop-ups to open the support session", { description: "The session started but can’t be re-opened — end it and start again." });
      await qc.invalidateQueries({ queryKey: ["admin", "me"] });
      toast.info(`Acting as ${s.targetName}`, { description: "Ends automatically in 30 minutes. Every action is logged." });
      onClose();
    } catch (e) { w?.close(); toast.error("Couldn’t start the session", { description: (e as Error).message }); setBusy(false); }
  };
  return <Modal title={`Act as ${user.name ?? "user"}?`} sub="You’ll see and do what they can, for 30 minutes. They get an email saying Newcondo support accessed their account." onClose={onClose}
    footer={<><button className="btn btn-line" onClick={onClose}>Cancel</button><button className="btn btn-dark" disabled={busy || reason.trim().length < 8 || !ack} onClick={start}><Eye size={15} />Start session</button></>}>
    <div className="field"><label>Why do you need access?</label><textarea className="inp" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Ticket #T-1051 — owner can’t finish bank verification" /><span className="hint">Stored on the audit log and shown to the user. At least 8 characters.</span></div>
    <div className="banner warn" style={{ marginBottom: 12 }}><span className="b-ic"><AlertTriangle size={16} /></span><span>During a support session you <b>can’t</b> withdraw, pay, charge cards, refund, change bank details, email or password, delete the account, or see full BVN/NIN — the server blocks those requests.</span></div>
    <label className="chk-row" onClick={() => setAck(!ack)}><span className={`chk${ack ? " on" : ""}`}>{ack && <Check size={12} strokeWidth={3} />}</span>I have the user’s permission or a support ticket for this.</label>
  </Modal>;
}
