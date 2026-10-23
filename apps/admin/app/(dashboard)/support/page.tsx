"use client";
// apps/admin/app/(dashboard)/support/page.tsx — support tickets (support.tickets).
import { useState } from "react";
import { A, type Ticket } from "@/lib/api/admin";
import { useAction } from "@/hooks/useAdmin";
import { RequireScope } from "@/components/auth/Can";
import { DataTable, Person, when } from "@/components/ui/DataTable";
import { Badge, Modal } from "@/components/ui/primitives";

export default function Support() {
  const [open, setOpen] = useState<Ticket | null>(null); const [text, setText] = useState("");
  const reply = useAction((s: "IN_PROGRESS" | "RESOLVED" | "CLOSED") => A.replyTicket(open!.id, text.trim(), s), { pending: "Sending…", success: "Reply sent", sub: "The user is notified in their dashboard." }, ["support"]);
  return <RequireScope scope="support.tickets">
    <div className="ph"><div><h1>Support tickets</h1><p>Questions and problems raised from the platform. Use “Act as user” only with a ticket reference.</p></div></div>
    <DataTable<Ticket> name="support" fetcher={A.tickets} onRow={(t) => { setOpen(t); setText(t.adminResponse ?? ""); }}
      filters={[{ value: "open", label: "Open" }, { value: "all", label: "All" }, { value: "BILLING", label: "Billing" }, { value: "VERIFICATION", label: "Verification" }, { value: "PROPERTY", label: "Property" }, { value: "TECHNICAL", label: "Technical" }]}
      cols={[{ label: "Ticket", cell: (t) => <div><div className="a-name">{t.title}</div><div className="a-sub">{t.category.toLowerCase()} · {t.priority.toLowerCase()}</div></div> }, { label: "From", cell: (t) => <Person name={t.user.name} sub={t.user.role.toLowerCase()} /> }, { label: "Opened", cell: (t) => when(t.createdAt) }, { label: "Status", cell: (t) => <Badge s={t.status} /> }]} />
    {open && <Modal wide title={open.title} sub={`${open.user.name} · ${open.category.toLowerCase()} · ${when(open.createdAt)}`} onClose={() => setOpen(null)}
      footer={open.status === "CLOSED" ? <button className="btn btn-dark" onClick={() => setOpen(null)}>Close</button> : <><button className="btn btn-line" disabled={text.trim().length < 2} onClick={() => reply.mutate("IN_PROGRESS", { onSuccess: () => setOpen(null) })}>Reply</button><button className="btn btn-dark" disabled={text.trim().length < 2} onClick={() => reply.mutate("RESOLVED", { onSuccess: () => setOpen(null) })}>Reply &amp; resolve</button></>}>
      <div className="banner info" style={{ marginBottom: 12, whiteSpace: "pre-wrap" }}>{open.description}</div>
      {open.status !== "CLOSED" && <div className="field"><label>Your reply</label><textarea className="inp" rows={5} value={text} onChange={(e) => setText(e.target.value)} /><span className="hint">Never ask for passwords, OTPs, card or full BVN/NIN numbers.</span></div>}
    </Modal>}
  </RequireScope>;
}
