"use client";

/* Profile & Settings — identity, verification, plan, legal documents.
   TODO(backend): PATCH /api/user/profile · POST /api/verification/upload
   (UploadThing) · GET /api/legal-documents · subscription via Flutterwave. */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { cx } from "@/lib/cx";
import { toast } from "@newcondo/ui";
import { useRole } from "@/components/providers/role-provider";
import { ROLE_LABEL } from "@/components/dashboard/Sidebar";
import { PageHead, DBtn, StatusBadge, Card, CardH, Row, Thumb, Tabs, KV, Banner } from "@/components/dashboard/primitives";
import { ConfirmDialog } from "@/components/dashboard/Modal";
import { NCSelect, Field, inputCls } from "@/components/dashboard/NCSelect";
import { usePersistedTab } from "@/hooks/dashboard/usePersistedTab";

const LEGAL_DOCS = [
  ["Personal undertaking", "Signed 12 Feb 2026", "VERIFIED"],
  ["Proof of ownership — New Owerri", "Verified by admin 14 Feb 2026", "VERIFIED"],
  ["Marking service terms", "Accepted 2 Jul 2026", "CONFIRMED"],
  ["Tenancy agreement — Trans Amadi Flat 1", "Auto-generated 3 Mar 2026", "CONFIRMED"],
] as const;

export default function ProfilePage() {
  const { role, user } = useRole();
  const [tab, setTab] = usePersistedTab("nc-profile-tab", "profile");
  const [doc, setDoc] = useState("NIN");
  const [cancel, setCancel] = useState(false);
  return (
    <>
      <PageHead title="Profile & Settings" sub="Identity, verification, plan and legal documents." />
      <Tabs value={tab} onChange={setTab} items={[["profile", "Profile"], ["verify", "Verification"], ["plan", "Plan"], ["legal", "Legal documents"]]} />
      {tab === "profile" && (
        <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
          <Card>
            <CardH title="Your details" />
            <div className="mb-4 flex items-center gap-3.5">
              <div className="grid size-14 place-items-center rounded-full bg-ink text-lg font-bold text-cream">{user.initials}</div>
              <div>
                <div className="text-[16px] font-bold">{user.name}</div>
                <div className="text-[13px] text-text-tertiary">{ROLE_LABEL[role]} · joined Feb 2026</div>
              </div>
            </div>
            <Field label="Full name"><input className={inputCls()} defaultValue={user.name} /></Field>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <Field label="Email"><input className={inputCls()} defaultValue={user.email} /></Field>
              <Field label="Phone"><input className={inputCls()} defaultValue="0803 555 0134" /></Field>
            </div>
            <DBtn onClick={() => toast.promise(new Promise((res) => setTimeout(res, 1200)), { loading: "Saving profile…", success: "Profile updated. TODO(backend): PATCH /api/user/profile", error: "Could not save" })}>Save changes</DBtn>
          </Card>
          <Card>
            <CardH title="Notifications" />
            <p className="mb-3 mt-0 text-[13px] text-text-tertiary">Where should we reach you? Critical alerts (escrow, marking confirmations) always go to all channels.</p>
            {(["In-app", "Email", "SMS"] as const).map((c, i) => <NotifToggle key={c} label={c} initial={i < 2} />)}
          </Card>
        </div>
      )}
      {tab === "verify" && (
        <Card className="max-w-[640px]">
          <CardH title="Identity verification" right={<StatusBadge s={user.verificationStatus} />} />
          {user.verificationStatus === "VERIFIED" ? (
            <Banner icon="shield-check"><b className="font-semibold">You&rsquo;re verified.</b> NIN verified on 12 Feb 2026. Your verified badge shows on all your listings and marking jobs.</Banner>
          ) : (<>
            <p className="mb-3.5 mt-0 text-[13.5px] leading-relaxed text-text-secondary">Upload one government-issued ID. Verification unlocks payments{role !== "RENTER" ? ", listing and marking" : ""} and usually completes within 24 hours.</p>
            <Field label="Document type"><NCSelect value={doc} onChange={setDoc} options={["NIN", "BVN", "Driver's licence", "Voter's card", "International passport"]} /></Field>
            <button onClick={() => toast.info("File picker opens", { description: "TODO(backend): UploadThing → /api/verification/upload" })}
              className="grid h-[110px] w-full place-items-center rounded-[14px] border-[1.5px] border-dashed border-border-strong bg-surface text-text-tertiary">
              <span className="text-center"><Icon name="camera" size={20} className="mx-auto" /><span className="mt-1.5 block text-[12.5px]">Upload ID + a selfie</span></span>
            </button>
            <div className="mt-3.5">
              <DBtn onClick={() => toast.promise(new Promise((res) => setTimeout(res, 1400)), { loading: "Submitting documents…", success: "Verification submitted — an admin reviews within 24 hours.", error: "Upload failed" })}>Submit for verification</DBtn>
            </div>
          </>)}
        </Card>
      )}
      {tab === "plan" && (
        <Card className="max-w-[640px]">
          <CardH title="Your plan" right={<StatusBadge s="RENTED">{user.plan}</StatusBadge>} />
          {role === "OWNER" && (<>
            <KV k="Plan" v="Elite — ₦18,500/month" />
            <KV k="Commission rate" v="15% (Essential pays 20%)" />
            <KV k="Listings" v="Unlimited" />
            <KV k="Next billing" v="1 Aug 2026 · Flutterwave" />
          </>)}
          {role === "AGENT" && (<>
            <KV k="Plan" v="Premium — ₦3,500/month" />
            <KV k="Marking queue" v="Included — ₦5,000 per job" />
            <KV k="Listings" v="Unlimited · priority placement" />
            <KV k="Next billing" v="1 Aug 2026 · Flutterwave" />
          </>)}
          {role === "RENTER" && (<>
            <KV k="Plan" v="Free" />
            <div className="mt-3">
              <Banner icon="zap" action={<DBtn sm onClick={() => toast.info("Premium checkout", { description: "Flutterwave subscription flow — see onboarding plan selector." })}>Upgrade</DBtn>}>
                <b className="font-semibold">Premium unlocks marking-job income and your wallet.</b> One marking job (₦5,000) covers more than a month.
              </Banner>
            </div>
          </>)}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <DBtn variant="line" sm onClick={() => toast.info("Billing history", { description: "Opens payments filtered to subscription charges." })}>Billing history</DBtn>
            {role !== "RENTER" && <DBtn variant="ghost" sm className="!text-danger" onClick={() => setCancel(true)}>Cancel subscription</DBtn>}
          </div>
        </Card>
      )}
      {tab === "legal" && (
        <Card tight className="max-w-[720px]">
          <CardH pad title="Legal documents" />
          {LEGAL_DOCS.map(([t, s, st]) => (
            <Row key={t}>
              <Thumb icon="file-text" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{t}</div>
                <div className="mt-1 text-[12.5px] text-text-tertiary">{s}</div>
              </div>
              <div className="flex flex-none items-center gap-2.5">
                <StatusBadge s={st} />
                <button className="flex items-center gap-1 text-[13px] font-semibold text-green-dark hover:text-ink"><Icon name="download" size={13} />PDF</button>
              </div>
            </Row>
          ))}
        </Card>
      )}
      <AnimatePresence>
        {cancel && (
          <ConfirmDialog danger title="Cancel your subscription?" confirmLabel="Cancel plan"
            body="Your listings stay visible until the end of the paid period, then they're archived. Documents, agreements and payment history remain in your account."
            onConfirm={() => toast.info("Subscription set to cancel", { description: "Active until 1 Aug 2026. You can resume anytime before then." })}
            onClose={() => setCancel(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

function NotifToggle({ label, initial }: { label: string; initial: boolean }) {
  const [on, setOn] = useState(initial);
  return (
    <div className="flex items-center justify-between border-b border-border-hair py-[9px] text-[13.5px] last:border-b-0">
      <span className="font-semibold">{label}</span>
      <button onClick={() => { setOn(!on); toast.success(`${label} notifications ${on ? "off" : "on"}`); }}
        className={cx("relative h-6 w-[42px] rounded-full transition-colors", on ? "bg-green" : "bg-nc-border")}>
        <span className={cx("absolute top-[3px] size-[18px] rounded-full bg-white shadow transition-[left] duration-200 ease-nc", on ? "left-[21px]" : "left-[3px]")} />
      </button>
    </div>
  );
}
