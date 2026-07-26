"use client";

/* InviteAgentModal — owner invites their chosen listing agent.
   Rule: agents can only list for owners who invited them; the owner must
   already have an active plan (rent settles to THEIR account). Creates a
   single-use 14-day link (optionally emailed straight to the agent) — on
   accept, both parties are notified and the owner appears in the agent's
   New Listing owner dropdown.
   Live: POST /api/v1/agent-invites. */
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, Banner, CopyField } from "@/components/dashboard/primitives";
import { Field, inputCls } from "@/components/dashboard/NCSelect";
import * as api from "@/lib/api/dashboard";

export function InviteAgentModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const create = () => {
    if (email && !/\S+@\S+\.\S+/.test(email)) { toast.error("That email doesn't look right"); return; }
    const doCreate = api.isLiveBackend
      ? api.createAgentInvite(email || undefined).then((r) => r.url.replace(/^https?:\/\//, ""))
      : new Promise<string>((res) => setTimeout(() => res(`newcondo.homes/agent-invite/${Math.random().toString(36).slice(2, 12)}`), 900));
    toast.promise(doCreate.then((url) => { setLink(url); return url; }), {
      loading: "Creating secure invite link…",
      success: email ? `Invite link ready — we also emailed it to ${email}.` : "Invite link ready — share it with your agent.",
      error: "Could not create the link — try again",
    });
  };
  return (
    <Modal title="Invite a listing agent" sub="Your agent lists and manages properties on your behalf — rent always settles to YOUR account, their commission split is automatic." onClose={onClose}
      footer={link ? <DBtn onClick={onClose}>Done</DBtn> : <>
        <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
        <DBtn onClick={create}><Icon name="link" size={14} />Create invite link</DBtn>
      </>}>
      {!link ? (<>
        <Field label="Agent's email (optional)" hint="We'll send them the branded invitation directly — or leave blank and share the link yourself.">
          <input className={inputCls()} type="email" placeholder="agent@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Banner icon="info">The link is <b className="font-semibold">single-use and expires in 14 days</b>. Your agent needs a Newcondo agent account to accept — you'll be notified the moment they do.</Banner>
      </>) : (<>
        <CopyField value={link} toastMsg="Agent invite link copied" />
        <div className="mt-3"><Banner icon="send">Share it over WhatsApp or SMS. Once accepted, they can pick you as the property owner when creating a listing.</Banner></div>
      </>)}
    </Modal>
  );
}
