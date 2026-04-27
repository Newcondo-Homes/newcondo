import { Suspense } from "react";
import { Metadata } from "next";
import CommissionsLoading from "./loading";
import { CommissionDashboard } from "@/components/commissions/CommissionDashboard";
import { getCommissionSummary } from "@/lib/api/commissions";

export const metadata: Metadata = {
  title: "Commission Dashboard | NewCondo",
  description: "Track your earnings, commissions, and payment history",
};

async function CommissionDashboardWrapper() {
  let summary;
  try {
    summary = await getCommissionSummary();
  } catch {
    summary = null;
  }

  const currentMonth = summary?.monthlyEarnings?.at(-1)?.amount ?? 0;
  const lastMonth = summary?.monthlyEarnings?.at(-2)?.amount ?? 0;

  return (
    <CommissionDashboard
      totalEarnings={summary?.totalEarned ?? 0}
      availableBalance={summary?.availableBalance ?? 0}
      pendingBalance={summary?.pendingBalance ?? 0}
      thisMonthEarnings={currentMonth}
      lastMonthEarnings={lastMonth}
      totalWithdrawals={summary?.withdrawnTotal ?? 0}
      currency="NGN"
    />
  );
}

export default function CommissionsPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<CommissionsLoading />}>
        <CommissionDashboardWrapper />
      </Suspense>
    </div>
  );
}