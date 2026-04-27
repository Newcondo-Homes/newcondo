import { Suspense } from "react";
import { Metadata } from "next";
import CommissionsLoading from "../../agent/commissions/loading";
import MarkingRequests from "@/components/marking/MarkingRequests";

export const metadata: Metadata = {
  title: "Marking Requests | NewCondo",
  description: "View and manage marking job requests",
};


export default function MarkingRequestsPage() {
  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<CommissionsLoading />}>
        <MarkingRequests />
      </Suspense>
    </div>
  );
}