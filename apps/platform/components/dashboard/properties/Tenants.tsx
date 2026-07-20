"use client";

/* Tenants on one property — card for the property detail page (owner +
   listing agent), tenant detail modal, and the invite-link modal.
   API: GET /api/v1/properties/:id/tenants · POST .../tenant-invites
   (property-service tenantService — each link is single-use and specific
   to this lister + property [+ flat]; renters can ONLY onboard through one). */
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { Modal } from "@/components/dashboard/Modal";
import { DBtn, Card, CardH, Row, StatusBadge, KV, Banner, EmptyState, SkeletonRows, CopyField } from "@/components/dashboard/primitives";
import { NCSelect, Field } from "@/components/dashboard/NCSelect";
import { useTenants } from "@/hooks/dashboard/useDashboardData";
import * as api from "@/lib/api/dashboard";
import { ngn, initials } from "@/lib/dashboard/format";
import type { FlatUnit, Tenant } from "@/lib/dashboard/data";

export function TenantsCard({ propertyId, propertyTitle, flats }: { propertyId: string; propertyTitle: string; flats: FlatUnit[] }) {
  const { data, isLoading } = useTenants(propertyId);
  const [detail, setDetail] = useState<Tenant | null>(null);
  const [inviting, setInviting] = useState(false);
  const tenants = data ?? [];
  const active = tenants.filter((t) => t.status === "ACTIVE");
  return (
    <Card tight>
      <CardH pad title="Tenants"
        right={<button className="flex items-center gap-1 text-[13px] font-semibold text-green-dark hover:text-ink" onClick={() => setInviting(true)}><Icon name="link" size={13} />Invite tenant</button>} />
      {isLoading ? <div className="px-4 pb-4"><SkeletonRows n={2} h={56} /></div>
      : tenants.length === 0 ? <EmptyState icon="users" title="No tenants onboarded yet" sub="Share an invite link with the occupants — once they onboard, they appear here and pay rent through Newcondo." action={<DBtn sm onClick={() => setInviting(true)}><Icon name="link" size={13} />Create invite link</DBtn>} />
      : tenants.map((t) => (
        <Row key={t.id} onClick={() => setDetail(t)}>
          <div className="grid size-10 flex-none place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">{initials(t.name)}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold tracking-[-0.01em]">{t.name}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-text-tertiary">
              <StatusBadge s={t.status === "ACTIVE" ? "CONFIRMED" : "SETTLED"}>{t.status === "ACTIVE" ? "Active" : "Past"}</StatusBadge>
              <span>{t.flatLabel}{t.till ? ` · till ${t.till}` : ""}</span>
            </div>
          </div>
          <Icon name="chevron-right" size={14} className="text-text-tertiary" />
        </Row>
      ))}
      {active.length > 0 && <div className="border-t border-border-hair px-4 py-3 text-[12px] text-text-tertiary">{active.length} active tenanc{active.length === 1 ? "y" : "ies"} · rent, maintenance and challenges all run through Newcondo.</div>}
      <AnimatePresence>
        {detail && <TenantDetailModal key="d" tenant={detail} onClose={() => setDetail(null)} />}
        {inviting && <InviteTenantModal key="i" propertyId={propertyId} propertyTitle={propertyTitle} flats={flats} onClose={() => setInviting(false)} />}
      </AnimatePresence>
    </Card>
  );
}

function TenantDetailModal({ tenant: t, onClose }: { tenant: Tenant; onClose: () => void }) {
  return (
    <Modal title={t.name} sub={`${t.flatLabel} · ${t.status === "ACTIVE" ? "active tenancy" : "past tenant"}`} onClose={onClose}
      footer={<>
        <DBtn variant="line" onClick={() => toast.info("Opening message thread", { description: "In-app messaging keeps the conversation documented. TODO(backend): chat-service" })}><Icon name="send" size={14} />Message</DBtn>
        <DBtn onClick={onClose}>Done</DBtn>
      </>}>
      <div className="mb-3 flex items-center gap-3">
        <div className="grid size-12 flex-none place-items-center rounded-full bg-ink text-[14px] font-bold text-cream">{initials(t.name)}</div>
        <div><StatusBadge s={t.verificationStatus} /></div>
      </div>
      <KV k="Flat" v={t.flatLabel} />
      <KV k="Tenancy" v={`${t.startDate}${t.till ? ` → ${t.till}` : ""}`} />
      <KV k="Rent paid to date" v={ngn(t.rentPaid)} mono />
      {t.lastPayment && <KV k="Last payment" v={t.lastPayment} />}
      <KV k="Email" v={t.email} />
      <KV k="Phone" v={t.phone} mono />
      <KV k="Onboarded" v={t.onboardedVia} />
      <div className="mt-3"><Banner icon="shield-check">Payments and communication with this tenant are documented on Newcondo — never settle rent off-platform.</Banner></div>
    </Modal>
  );
}

function InviteTenantModal({ propertyId, propertyTitle, flats, onClose }: { propertyId: string; propertyTitle: string; flats: FlatUnit[]; onClose: () => void }) {
  const [flat, setFlat] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const create = () => {
    // POST /api/v1/properties/:id/tenant-invites — token is single-use,
    // sha256-hashed at rest, expires in 14 days, scoped to you + this property.
    // NOTE: live mode passes unitId (PropertyUnit.id); the flat picker here
    // holds the label — map label→unitId once flats carry real ids from the API.
    const doCreate = api.isLiveBackend
      ? api.createTenantInvite(propertyId, flat || undefined).then((r) => r.url.replace(/^https?:\/\//, ""))
      : new Promise<string>((res) => setTimeout(() => res(`newcondo.homes/tenant-invite/${Math.random().toString(36).slice(2, 10)}${propertyId}`), 900));
    toast.promise(doCreate.then((url) => { setLink(url); return url; }), {
      loading: "Creating secure invite link…",
      success: "Invite link ready — share it with your tenant.",
      error: "Could not create the link — try again",
    });
  };
  return (
    <Modal title="Invite a tenant" sub={`${propertyTitle} — renters can only join Newcondo through an invite link from you.`} onClose={onClose}
      footer={link ? <DBtn onClick={onClose}>Done</DBtn> : <>
        <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
        <DBtn onClick={create}><Icon name="link" size={14} />Create invite link</DBtn>
      </>}>
      {!link ? (<>
        <Field label="Which flat? (optional)" hint="Ties the tenant to a specific flat — their payments reconcile to it automatically.">
          <NCSelect value={flat} onChange={setFlat} placeholder="Whole property / not sure"
            options={flats.map((f) => f.n)} />
        </Field>
        <Banner icon="info">The link is <b className="font-semibold">single-use, expires in 14 days</b>, and is tied to you and this property. When the tenant onboards, they appear in this list instantly and you&rsquo;re notified.</Banner>
      </>) : (<>
        <CopyField value={link} toastMsg="Invite link copied" />
        <div className="mt-3"><Banner icon="send">Share it over WhatsApp or SMS. You&rsquo;ll get a notification the moment your tenant finishes onboarding.</Banner></div>
      </>)}
    </Modal>
  );
}
