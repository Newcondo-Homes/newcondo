// apps/platform/app/(dashboard)/profile/compliance/terms/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { getServerSession } from "@newcondo/auth";
import { prisma } from "@newcondo/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui";
import { DocumentTemplateViewer } from "@/components/legal/DocumentTemplateViewer";
import { TermsPageClient } from "@/components/legal/TermsPageClient";
import { FileText, Shield, AlertCircle, CheckCircle } from "lucide-react";


export const metadata: Metadata = {
  title: "Terms of Service - NewCondo",
  description: "Terms and conditions for NewCondo platform"
};

const termsHighlights = [
  {
    icon: FileText,
    title: "Platform Usage",
    description: "Rules and guidelines for using the NewCondo platform",
  },
  {
    icon: Shield,
    title: "User Responsibilities",
    description: "Your obligations as a user of our services",
  },
  {
    icon: AlertCircle,
    title: "Limitation of Liability",
    description: "Understanding the boundaries of our legal responsibility",
  },
  {
    icon: CheckCircle,
    title: "Dispute Resolution",
    description: "How we handle disagreements and conflicts",
  },
];

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      verificationStatus: true,
      documents: {
        select: {
          id: true,
          documentType: true,
          status: true,
          createdAt: true,
          verificationNotes: true,
        },
      },
    },
  });
  return user;
}


export default async function TermsPage() {
  const session = await getServerSession();
  if (!session?.user?.id) notFound();

  const user = await getUserData(session.user.id);
  if (!user) notFound();

  const roleMap: Record<string, 'OWNER' | 'AGENT' | 'RENTER'> = {
    OWNER: 'OWNER',
    AGENT: 'AGENT',
    RENTER: 'RENTER',
    ADMIN: 'RENTER',
  };

  const userRole = roleMap[user.role] ?? 'RENTER';

  const documents = user.documents.map((doc) => ({
    id: doc.id,
    documentType: doc.documentType,
    status: doc.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    createdAt: doc.createdAt.toISOString(),
    verificationNotes: doc.verificationNotes ?? undefined,
  }));

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
        <TermsPageClient
          userRole={userRole}
          userVerificationStatus={user.verificationStatus}
          documents={documents}
        />

        {/* Terms highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Terms at a Glance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {termsHighlights.map((highlight) => (
                <div
                  key={highlight.title}
                  className="flex items-start gap-3 p-4 rounded-lg border"
                >
                  <highlight.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-sm">{highlight.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {highlight.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
                templateType="TERMS_CONDITIONS"
                previewOnly={true}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      {/* Key obligations */}
      <Card>
        <CardHeader>
          <CardTitle>Key Obligations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Accurate Information</h4>
              <p className="text-sm text-blue-700">
                You must provide truthful and accurate information when listing
                properties or creating an account.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-2">Lawful Use Only</h4>
              <p className="text-sm text-green-700">
                The platform must only be used for lawful property transactions
                in compliance with Nigerian law.
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-2">No Fraudulent Activity</h4>
              <p className="text-sm text-orange-700">
                Any form of fraudulent listing, misrepresentation, or payment
                manipulation will result in immediate account termination.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}