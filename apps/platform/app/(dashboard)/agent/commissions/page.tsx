import { Suspense } from "react";
import { Metadata } from "next";
import CommissionsLoading from "./loading";
import CommissionDashboard from "@/components/agent/CommissionDashboard";

export const metadata: Metadata = {
  title: "Commission Dashboard | NewCondo",
  description: "Track your earnings, commissions, and payment history",
};

export default function CommissionsPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<CommissionsLoading />}>
        <CommissionDashboard />
      </Suspense>
    </div>
  );
}