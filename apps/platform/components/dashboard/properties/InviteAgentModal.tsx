"use client";

/* InviteAgentModal — owner invites their chosen listing agent.
   Rule: agents can only list for owners who invited them; the owner must
   already have an active plan (rent settles to THEIR account). Creates a
   single-use 14-day link (optionally emailed straight to the agent) — on
   accept, both parties are notified and the owner appears in the agent's
   New Listing owner dropdown.
   Live: POST /api/v1/agent-invites.

   EMAIL HONESTY: the backend's sendBrandedEmail() is fire-and-forget — it
   logs transport failures instead of throwing — so the invite can succeed
   while the email silently never leaves. The API now returns `emailSent`,
   and we report that truthfully rather than always claiming we emailed it.
   See agentInviteService.PATCH.ts for the matching backend change. */
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
  // undefined = nothing attempted (no email given, or preview mode)
  const [emailSent, setEmailSent] = useState<boolean | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      toast.error("That email doesn't look right");
      return;
    }
    setBusy(true);
    const toastId = toast.loading("Creating secure invite link…");
    try {
      let url: string;
      let sent: boolean | undefined;

      if (api.isLiveBackend) {
        const r = await api.createAgentInvite(email || undefined);
        url = r.url.replace(/^https?:\/\//, "");
        sent = r.emailSent;
      } else {
        await new Promise((res) => setTimeout(res, 900));
        url = `newcondo.homes/agent-invite/${Math.random().toString(36).slice(2, 12)}`;
        sent = email ? true : undefined;
      }

      setLink(url);
      setEmailSent(sent);

      if (!email) {
        toast.success("Invite link ready — share it with your agent.", { id: toastId });
      } else if (sent === false) {
        toast.warning(`Invite link ready — but we couldn't email ${email}.`, {
          id: toastId,
          description: "Copy the link below and send it to them yourself.",
        });
      } else {
        toast.success(`Invite link ready — we also emailed it to ${email}.`, { id: toastId });
      }
    } catch (e) {
      toast.error("Could not create the link — try again", {
        id: toastId,
        description: (e as Error)?.message,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Invite a listing agent" sub="Your agent lists and manages properties on your behalf — rent always settles to YOUR account, their commission split is automatic." onClose={onClose}
      footer={link ? <DBtn onClick={onClose}>Done</DBtn> : <>
        <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
        <DBtn onClick={create} disabled={busy}>
          {busy ? <><Icon name="loader" size={14} className="animate-spin" />Creating…</> : <><Icon name="link" size={14} />Create invite link</>}
        </DBtn>
      </>}>
      {!link ? (<>
        <Field label="Agent's email (optional)" hint="We'll send them the branded invitation directly — or leave blank and share the link yourself.">
          <input className={inputCls()} type="email" placeholder="agent@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Banner icon="info">The link is <b className="font-semibold">single-use and expires in 14 days</b>. Your agent needs a Newcondo agent account to accept — you&rsquo;ll be notified the moment they do.</Banner>
      </>) : (<>
        <CopyField value={link} toastMsg="Agent invite link copied" />
        <div className="mt-3">
          {emailSent === false ? (
            <Banner tone="warn" icon="triangle-alert">
              <b className="font-semibold">We couldn&rsquo;t deliver the email.</b> The invite itself is valid — copy the link above and send it over WhatsApp or SMS instead.
            </Banner>
          ) : (
            <Banner icon="send">
              {emailSent
                ? <>Sent to <b className="font-semibold">{email}</b>. You can also share the link over WhatsApp or SMS. </>
                : <>Share it over WhatsApp or SMS. </>}
              Once accepted, they can pick you as the property owner when creating a listing.
            </Banner>
          )}
        </div>
      </>)}
    </Modal>
  );
}
