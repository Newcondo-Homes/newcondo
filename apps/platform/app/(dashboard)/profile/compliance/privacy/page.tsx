// apps/platform/app/(dashboard)/profile/compliance/privacy/page.tsx
import { Suspense } from "react";
import { Metadata } from "next";
import { getServerSession } from "@newcondo/auth";
import { prisma } from "@newcondo/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui";
import { DocumentTemplateViewer } from "@/components/legal/DocumentTemplateViewer";
import { Shield, Lock, Eye, UserCheck } from "lucide-react";
import { PrivacyPageClient } from "@/components/legal/PrivacyPageClient";

export const metadata: Metadata = {
  title: "Privacy Policy - NewCondo",
  description: "Privacy policy and data protection information for NewCondo platform"
};

const privacyHighlights = [
  {
    icon: Shield,
    title: "Data Protection",
    description: "Your personal information is encrypted and securely stored"
  },
  {
    icon: Lock,
    title: "Secure Processing",
    description: "All data processing follows industry security standards"
  },
  {
    icon: Eye,
    title: "Transparency",
    description: "Clear information about how we collect and use your data"
  },
  {
    icon: UserCheck,
    title: "Your Rights",
    description: "Full control over your personal data and privacy settings"
  }
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


export default async function PrivacyPage() {
  const session = await getServerSession();
  if (!session?.user?.id) notFound();

  const user = await getUserData(session.user.id);
  if (!user) notFound();

  // Map Prisma role to the union ComplianceStatus expects
  const roleMap: Record<string, 'OWNER' | 'AGENT' | 'RENTER'> = {
    OWNER: 'OWNER',
    AGENT: 'AGENT',
    RENTER: 'RENTER',
    ADMIN: 'RENTER', // fallback for admin
  };

  const userRole = roleMap[user.role] ?? 'RENTER';

  // Shape documents to match ComplianceStatus's expected interface
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
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground mt-2">
          Learn how NewCondo protects your privacy and handles your personal data
        </p>
      </div>

      <div className="grid gap-6">
        {/*ComplianceStatus + LegalAgreementModal — client component */}
        <PrivacyPageClient
          userRole={userRole}
          userVerificationStatus={user.verificationStatus}
          documents={documents}
        />

        {/* Privacy Highlights */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy at a Glance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {privacyHighlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border">
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

        {/* Privacy Policy Content */}
        <Card>
          <CardHeader>
            <CardTitle>NewCondo Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground">
              Last updated: January 2025 • Effective from: January 15, 2025
            </p>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded"></div>}>
              <DocumentTemplateViewer
                templateType="PRIVACY_POLICY"
                previewOnly={true}
              />
            </Suspense>
          </CardContent>
        </Card>

        {/* Data Rights Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Data Rights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Request Your Data</h4>
                <p className="text-sm text-blue-700">
                  You can request a copy of all personal data we have about you at any time.
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Delete Your Data</h4>
                <p className="text-sm text-green-700">
                  Request deletion of your personal data, subject to legal retention requirements.
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-2">Correct Your Data</h4>
                <p className="text-sm text-orange-700">
                  Update or correct any inaccurate personal information we hold.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}