"use client";

/* Role-switched dashboard home. */
import { useRole } from "@/components/providers/role-provider";
import { OwnerHome } from "@/components/dashboard/home/OwnerHome";
import { AgentHome } from "@/components/dashboard/home/AgentHome";
import { RenterHome } from "@/components/dashboard/home/RenterHome";

export default function DashboardPage() {
  const { role } = useRole();
  if (role === "AGENT") return <AgentHome />;
  if (role === "RENTER") return <RenterHome />;
  return <OwnerHome />;
}
