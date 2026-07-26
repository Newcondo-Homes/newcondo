"use client";

/* SubAgentRequests — pending promotion requests for LISTERS (both the
   listing agent AND the property owner see these; requests route to
   whoever lists the property). Approve/decline each open a confirmation
   modal: approve shows the sub-agent's exact rent share before the final
   CTA; decline asks for an optional reason.
   Live: GET /promotion-requests · POST /promotion-requests/:id/approve|decline.
   Used on AgentHome, OwnerHome, and the property detail page (filtered). */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { toast } from "@newcondo/ui";
import { Modal } from "@/components/dashboard/Modal";
import { Card, CardH, Row, DBtn, Banner, KV } from "@/components/dashboard/primitives";
import { useCacheUpdate } from "@/hooks/dashboard/useDashboardData";
import * as api from "@/lib/api/dashboard";
import { initials } from "@/lib/dashboard/format";
import { PAYMENTS } from "@/lib/constants/business";

export interface PromoRequest { id: string; name: string; property: string; propertyId: string; reliability: number; requested: string; }
const DUMMY_REQUESTS: PromoRequest[] = [
  { id: "sa1", name: "Ngozi Kalu", property: "Mini flat, Aba Road", propertyId: "p5", reliability: 4.6, requested: "2h ago" },
  { id: "sa2", name: "Ibrahim Musa", property: "2-bedroom bungalow, Rumuola", propertyId: "p6", reliability: 4.1, requested: "yesterday" },
];
const SPLIT_PCT = Math.round(PAYMENTS.platformCommissionRate * PAYMENTS.agentShareOfCommission * PAYMENTS.subAgentSplitOfAgentShare * 1000) / 10;

export function usePromotionRequests() {
  return useQuery<PromoRequest[]>({
    queryKey: ["promotion-requests"],
    queryFn: async () => {
      if (!api.isLiveBackend) return new Promise((r) => setTimeout(() => r(DUMMY_REQUESTS), 350));
      try {
        const d = (await api.getPromotionRequests()) as { requests: { id: string; subAgent: { name: string; reliability: number }; property: { id: string; title: string }; createdAt: string }[] };
        return d.requests.map((r) => ({ id: r.id, name: r.subAgent.name, property: r.property.title, propertyId: r.property.id, reliability: r.subAgent.reliability ?? 0, requested: new Date(r.createdAt).toLocaleDateString() }));
      } catch { return DUMMY_REQUESTS; }
    },
  });
}

export function SubAgentRequestsCard({ propertyId, title = "Sub-agent requests" }: { propertyId?: string; title?: string }) {
  const { data = [] } = usePromotionRequests();
  const cache = useCacheUpdate();
  const [decide, setDecide] = useState<{ req: PromoRequest; action: "approve" | "decline" } | null>(null);
  const requests = propertyId ? data.filter((r) => r.propertyId === propertyId) : data;
  if (requests.length === 0) return null;
  const settle = (id: string) => cache.update<PromoRequest[]>(["promotion-requests"], (l) => l.filter((x) => x.id !== id));
  return (
    <Card tight>
      <CardH pad title={title} right={<span className="rounded-full bg-[#FBF3DC] px-2.5 py-1 text-[11.5px] font-semibold text-[#8a6508]">{requests.length} pending</span>} />
      {requests.map((r) => (
        <Row key={r.id}>
          <div className="grid size-10 flex-none place-items-center rounded-full bg-ink text-[12px] font-bold text-cream">{initials(r.name)}</div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold tracking-[-0.01em]">{r.name} wants to promote {propertyId ? "this property" : r.property}</div>
            <div className="mt-1 text-[12.5px] text-text-tertiary">{r.reliability} ★ reliability · requested {r.requested}</div>
          </div>
          <div className="flex flex-none gap-2 max-sm:w-full max-sm:justify-end">
            <DBtn variant="line" sm onClick={() => setDecide({ req: r, action: "decline" })}>Decline</DBtn>
            <DBtn sm onClick={() => setDecide({ req: r, action: "approve" })}>Approve</DBtn>
          </div>
        </Row>
      ))}
      <AnimatePresence>
        {decide && <DecideModal key="d" req={decide.req} action={decide.action} onClose={() => setDecide(null)} onDone={() => settle(decide.req.id)} />}
      </AnimatePresence>
    </Card>
  );
}

function DecideModal({ req, action, onClose, onDone }: { req: PromoRequest; action: "approve" | "decline"; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const approve = action === "approve";
  const go = () => {
    onClose(); onDone();
    if (api.isLiveBackend) (approve ? api.approvePromotion(req.id) : api.declinePromotion(req.id, reason || undefined)).catch(() => toast.error("Could not save the decision — try again"));
    if (approve) toast.success(`${req.name} approved as sub-agent`, { description: "Their tracked promo link is live. The split is enforced automatically on every payment through it." });
    else toast.info("Request declined", { description: `${req.name} has been notified.` });
  };
  return (
    <Modal title={approve ? "Approve this sub-agent?" : "Decline this request?"} sub={`${req.name} · ${req.property}`} onClose={onClose}
      footer={<>
        <DBtn variant="line" onClick={onClose}>Cancel</DBtn>
        {approve ? <DBtn variant="green" onClick={go}><Icon name="check" size={14} strokeWidth={2.2} />Approve — {SPLIT_PCT}% share</DBtn>
          : <DBtn variant="danger" onClick={go}>Decline request</DBtn>}
      </>}>
      {approve ? (<>
        <KV k="Sub-agent" v={`${req.name} · ${req.reliability} ★`} />
        <KV k="Their share on this property" v={<b>{SPLIT_PCT}% of the rent</b>} />
        <KV k="Comes out of" v="The listing commission — your rent share is unchanged" />
        <div className="mt-3"><Banner icon="info">When a renter pays through their tracked link, the split happens automatically at escrow release — you never handle it manually. You can restrict promotion later from My Listings.</Banner></div>
      </>) : (<>
        <p className="mb-3 mt-0 text-[13.5px] leading-relaxed text-text-secondary">{req.name} will be notified. They can request again unless you restrict promotion on this property.</p>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Reason (optional — shared with the agent)</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. We already have enough promoters on this listing"
            className="min-h-[80px] w-full resize-y rounded-2xl border border-nc-border bg-surface px-3.5 py-3 text-[14px] outline-none placeholder:text-text-tertiary focus:border-ink" />
        </label>
      </>)}
    </Modal>
  );
}
