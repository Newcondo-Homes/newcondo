"use client";

/* Renter home — verification banner, current rental, quick links. */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Icon } from "@/components/ui/icon";
import { useRole } from "@/components/providers/role-provider";
import { PageHead, DBtn, StatCard, StatusBadge, Card, CardH, KV, Banner, MapPlaceholder, SkeletonRows } from "@/components/dashboard/primitives";
import { ngn } from "@/lib/dashboard/format";
import { useRenterRental } from "@/hooks/dashboard/useDashboardData";
import { RentalModal } from "@/components/dashboard/payments/RentalModal";

export function RenterHome() {
  const router = useRouter();
  const { user } = useRole();
  const rental = useRenterRental();
  const [modal, setModal] = useState<null | "maintenance">(null);
  if (rental.isLoading) return <SkeletonRows n={4} h={92} />;
  const r = rental.data!;
  return (
    <>
      <PageHead title={`Hello, ${user.name.split(" ")[0]}`} sub="Your rental, payments and referrals — one place."
        actions={<DBtn onClick={() => router.push("/browse")}><Icon name="search" size={15} />Browse properties</DBtn>} />
      {user.verificationStatus !== "VERIFIED" && (
        <div className="mb-4">
          <Banner tone="warn" icon="shield-check" action={<DBtn sm onClick={() => router.push("/profile")}>Verify now</DBtn>}>
            <b className="font-semibold">Finish identity verification.</b>
            <div className="mt-0.5 text-[12.5px]">Upload your NIN, BVN or government ID to unlock rent payments and the 24-hour protection window.</div>
          </Banner>
        </div>
      )}
      <div className="mb-4 grid grid-cols-4 gap-4 max-[1060px]:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-2.5">
        <StatCard label="Current rental" value="Trans Amadi" icon="home" sub={`2-bedroom · ${r.flat} · till ${r.till}`} />
        <StatCard label="Next rent due" value={r.till} icon="clock" sub={`${ngn(r.rent)}/year`} />
        <StatCard label="Referral credits" value={ngn(4000)} icon="gift" sub="2 friends converted" mono />
        <StatCard label="Saved properties" value="6" icon="star" sub="3 still available" />
      </div>
      <div className="grid grid-cols-2 gap-4 max-[860px]:grid-cols-1">
        <Card>
          <CardH title="Your rental" right={<StatusBadge s="CONFIRMED" />} />
          <MapPlaceholder h={150} tag="Verified · GPS-marked" />
          <div className="mt-3.5">
            <KV k="Property" v={`${r.property} (${r.flat})`} />
            <KV k="Listing agent" v={`${r.agent} · verified ✓`} />
            <KV k="Paid" v={`${ngn(r.paid)} on ${r.paidDate}`} mono />
            <KV k="Tenancy agreement" v={<button className="flex items-center gap-1 text-[13px] font-semibold text-green-dark hover:text-ink"><Icon name="download" size={13} />Download PDF</button>} />
          </div>
        </Card>
        <Card className="flex flex-col">
          <CardH title="Raise an issue" />
          <p className="mb-3.5 mt-0 text-[13.5px] leading-relaxed text-text-secondary">Maintenance requests, disputes and lease questions go through Newcondo — not your agent&rsquo;s phone. Everything is documented.</p>
          <div className="mt-auto flex flex-wrap gap-2.5">
            <DBtn variant="line" onClick={() => router.push("/payments")}><Icon name="receipt" size={15} />Payment history</DBtn>
            <DBtn onClick={() => setModal("maintenance")}><Icon name="send" size={15} />New maintenance request</DBtn>
          </div>
        </Card>
      </div>
      <AnimatePresence>{modal && <RentalModal initialView="maintenance" onClose={() => setModal(null)} />}</AnimatePresence>
    </>
  );
}
