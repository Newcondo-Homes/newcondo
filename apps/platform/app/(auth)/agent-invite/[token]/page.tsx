"use client";

/* Agent-invite acceptance page — /agent-invite/[token].
   An OWNER creates this link from their dashboard (after subscribing) and
   sends it to their chosen agent. Only a REGISTERED AGENT can accept —
   accepting creates the OwnerAgentLink that puts the owner in the agent's
   New Listing owner dropdown. Both parties are notified (SSE + email).
   Live: GET /api/v1/agent-invites/:token (public) · POST /agent-invites/accept. */
import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast, Toaster } from "@newcondo/ui";
import { validateAgentInvite, acceptAgentInvite, isLiveBackend } from "@/lib/api/dashboard";

export default function AgentInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [invalid, setInvalid] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "busy" | "accepted">("idle");
  useEffect(() => {
    if (!isLiveBackend) { setOwnerName("Adaeze Okafor"); return; }
    validateAgentInvite(token).then((d) => setOwnerName(d.ownerName)).catch((e) => setInvalid((e as Error).message || "This invite link is not valid or has expired."));
  }, [token]);
  const accept = async () => {
    setState("busy");
    try {
      // Requires a signed-in AGENT account; a 401/403 sends them to login first.
      if (isLiveBackend) await acceptAgentInvite(token);
      else await new Promise((r) => setTimeout(r, 1200));
      setState("accepted");
      toast.success("Invitation accepted", { description: `${ownerName} has been notified. You can now list their properties.` });
    } catch (e) {
      setState("idle");
      const msg = (e as Error).message ?? "";
      if (/agent account|401|403|sign/i.test(msg)) toast.error("You need a Newcondo agent account", { description: "Sign in with your agent account (or create one), then open this link again." });
      else toast.error("Could not accept the invitation", { description: msg });
    }
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-nc-background p-5 font-sans text-text-primary">
      <Toaster />
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] rounded-[28px] border border-border-hair bg-surface p-7 shadow-card">
        <div className="mb-5 flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.04em]">
          <Image src="/assets/logo-mark-dark.png" alt="" width={26} height={26} />newcondo
        </div>
        {invalid ? (<>
          <h1 className="m-0 text-[22px] font-bold tracking-[-0.03em]">This link doesn&rsquo;t work</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{invalid} Ask the property owner to send a fresh invitation — links are single-use and expire after 14 days.</p>
        </>) : !ownerName ? (
          <div className="flex flex-col gap-2.5 py-2">{[64, 44, 44].map((h, i) => <div key={i} className="animate-pulse rounded-xl bg-surface-sunken" style={{ height: h }} />)}</div>
        ) : state === "accepted" ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="mb-4 grid size-14 place-items-center rounded-full bg-green-wash text-green-dark"><Icon name="check" size={26} strokeWidth={2.5} /></span>
            <h1 className="m-0 text-[21px] font-bold tracking-[-0.03em]">You&rsquo;re connected</h1>
            <p className="mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-text-secondary">You can now list properties for {ownerName}. Pick them as the property owner when you create a new listing.</p>
            <div className="mt-5 flex gap-2.5">
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14px] font-semibold text-cream no-underline transition-colors hover:bg-black">Go to my dashboard<Icon name="arrow-right" size={14} strokeWidth={2.2} /></Link>
              <Link href="/" className="inline-flex items-center rounded-full border border-nc-border-strong px-5 py-3 text-[14px] font-semibold text-ink no-underline hover:bg-surface-soft">Not now</Link>
            </div>
          </div>
        ) : (<>
          <h1 className="m-0 text-[23px] font-bold leading-tight tracking-[-0.03em]">{ownerName} invited you to list their property</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-text-secondary">Accepting connects you as their listing agent on Newcondo:</p>
          <ul className="mt-3 flex list-none flex-col gap-2.5 p-0 text-[13.5px] text-text-secondary">
            {[["building-2", "You list and manage their properties from your own dashboard"], ["wallet", "Rent always settles to the owner's account — your commission split is automatic"], ["shield-check", "Every listing is GPS-marked and verified before it goes live"]].map(([ic, t]) => (
              <li key={ic} className="flex items-start gap-2.5"><Icon name={ic} size={16} className="mt-0.5 flex-none text-green-dark" />{t}</li>
            ))}
          </ul>
          <button disabled={state === "busy"} onClick={accept}
            className={cx("mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[14.5px] font-semibold text-cream transition-colors hover:bg-black", state === "busy" && "opacity-60")}>
            {state === "busy" ? "Accepting…" : "Accept invitation"}
          </button>
          <p className="mb-0 mt-3 text-center text-[11.5px] leading-normal text-text-tertiary">You need a Newcondo <b>agent account</b> to accept. <Link href="/login" className="font-semibold text-text-secondary">Sign in</Link> or <Link href="/onboarding" className="font-semibold text-text-secondary">create one</Link> first, then reopen this link.</p>
        </>)}
      </motion.div>
    </div>
  );
}
