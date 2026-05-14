"use client";

import { useEffect, useState } from "react";
import { useVerification } from "@/hooks/useVerification";
import { useAuth } from "@/hooks/useAuth";
import { VerificationStatus } from "@/components/profile/VerificationStatus";
import { VerificationHistory } from "@/components/profile/VerificationHistory";
import { VerificationDocuments } from "@/components/profile/VerificationDocuments";
import { VerificationOverview } from "@/components/profile/VerificationOverview";
import { VerificationProgress } from "@/components/profile/VerificationProgress";
import { VerificationBadge } from "@/components/profile/VerificationBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/";
import { Alert, AlertDescription } from "@newcondo/ui/";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@newcondo/ui/";
import {
  Shield,
  AlertTriangle,
} from "lucide-react";
import { DocumentStatus } from "@/types/enums";

export function VerificationMain() {
  const { user } = useAuth();
  const { documents, isLoading, error, refreshDocuments, resubmitDocument } =
    useVerification();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (user?.id) {
      refreshDocuments();
    }
  }, [user?.id, refreshDocuments]);

  const getVerificationStats = () => {
    if (!documents) return { total: 0, completed: 0, pending: 0, rejected: 0 };

    const total = documents.length;
    const completed = documents.filter(
      (doc) => doc.status === DocumentStatus.APPROVED
    ).length;
    const pending = documents.filter(
      (doc) => doc.status === DocumentStatus.PENDING
    ).length;
    const rejected = documents.filter(
      (doc) => doc.status === DocumentStatus.REJECTED
    ).length;

    return { total, completed, pending, rejected };
  };

  const stats = getVerificationStats();
  const overallStatus = user?.verificationStatus || "PENDING";

  if (isLoading) {
    return <div className="text-center py-8">Loading verification data...</div>;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading verification data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verification Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification Status
            </CardTitle>
            <VerificationBadge status={overallStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <VerificationStatus
            status={overallStatus}
            verifiedAt={user?.verifiedAt}
            rejectionReason={user?.verificationRejectionReason}
          />

          <div className="mt-6">
            <VerificationProgress
              completed={stats.completed}
              total={stats.total}
              pending={stats.pending}
              rejected={stats.rejected}
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Verification Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <VerificationOverview
            documents={documents}
            stats={stats}
            overallStatus={overallStatus}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <VerificationDocuments
            documents={documents}
            onResubmit={resubmitDocument}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <VerificationHistory documents={documents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
