import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@newcondo/auth";

import MarkingAnalyticsDashboard from "@/components/marking/MarkingAnalyticsDashboard";

export const metadata: Metadata = {
  title: "Marking Analytics | Newcondo Admin",
  description: "Property marking service analytics and performance metrics",
};

export default async function MarkingAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marking Analytics</h1>
        <p className="text-gray-600 mt-2">
          Track property marking jobs, agent performance, and service metrics
        </p>
      </div>

      <MarkingAnalyticsDashboard />
    </div>
  );
}