// apps/platform/app/(dashboard)/profile/compliance/terms/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui";
import { DocumentTemplateViewer } from "@/components/legal/DocumentTemplateViewer";
import LegalAgreementModal  from "@/components/legal/LegalAgreementModal";
import { ComplianceStatus } from "@/components/legal/ComplianceStatus";

export const metadata: Metadata = {
  title: "Terms of Service - NewCondo",
  description: "Terms and conditions for NewCondo platform"
};

export default function TermsPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground mt-2">
          Review and accept our terms and conditions to continue using NewCondo
        </p>
      </div>

      <div className="grid gap-6">
        {/* Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="animate-pulse h-20 bg-gray-200 rounded"></div>}>
              <ComplianceStatus documentType="terms" />
            </Suspense>
          </CardContent>
        </Card>

        {/* Terms Content */}
        <Card>
          <CardHeader>
            <CardTitle>NewCondo Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: January 2025
            </p>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded"></div>}>
              <DocumentTemplateViewer
                templateType="terms"
                version="2025.1"
                showAcceptButton={true}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Agreement Modal */}
      <LegalAgreementModal
        documentType="terms"
        title="Accept Terms of Service"
        description="By accepting these terms, you agree to comply with all NewCondo policies and guidelines."
      />
    </div>
  );
}