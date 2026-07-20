"use client";

/* Marking — OWNER: request/confirm jobs; AGENT: FCFS queue; RENTER: upsell. */
import { useRouter } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import { DBtn, EmptyState } from "@/components/dashboard/primitives";
import { OwnerMarking } from "@/components/dashboard/marking/OwnerMarking";
import { AgentMarking } from "@/components/dashboard/marking/AgentMarking";

export default function MarkingPage() {
  const router = useRouter();
  const { role } = useRole();
  if (role === "AGENT") return <AgentMarking />;
  if (role === "OWNER") return <OwnerMarking />;
  return (
    <EmptyState icon="map-pin" title="Marking jobs are a Premium feature"
      sub="Premium renters can earn ₦5,000 per marking job near them — first-come-first-served, 3-hour slots."
      action={<DBtn onClick={() => router.push("/profile")}>Upgrade to Premium</DBtn>} />
  );
}
