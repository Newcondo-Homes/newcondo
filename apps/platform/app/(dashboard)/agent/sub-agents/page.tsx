import { Suspense } from "react";
import { Metadata } from "next";
import CommissionsLoading from "../commissions/loading";
import SubAgentManagement from "@/components/agent/SubAgentManagement";

export const metadata: Metadata = {
  title: "Sub-Agent Management | NewCondo",
  description: "Manage sub-agents promoting your properties",
};

export default function SubAgentsPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<CommissionsLoading />}>
        <SubAgentManagement />
      </Suspense>
    </div>
  );
}