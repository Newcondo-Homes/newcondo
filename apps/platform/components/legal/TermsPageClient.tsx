'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { ComplianceStatus } from '@/components/legal/ComplianceStatus';
import LegalAgreementModal from '@/components/legal/LegalAgreementModal';
import type { LegalDocument } from '@/components/legal/LegalAgreementModal';

interface Props {
  userRole: 'OWNER' | 'AGENT' | 'RENTER';
  userVerificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documents: Array<{
    id: string;
    documentType: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    verificationNotes?: string;
  }>;
}

const TERMS_LEGAL_DOCUMENT: LegalDocument = {
  id: 'terms-conditions-2025-1',
  title: 'NewCondo Terms of Service',
  type: 'TERMS_CONDITIONS',
  content: `NEWCONDO TERMS OF SERVICE — Version 2025.1

1. ACCEPTANCE OF TERMS
By accessing or using the NewCondo platform, you agree to be bound by these Terms of Service and all applicable laws and regulations.

2. PLATFORM USAGE
Users must provide accurate information, respect intellectual property rights, and use the platform only for lawful purposes related to property rental and management.

3. USER RESPONSIBILITIES
You are responsible for:
- Maintaining the security of your account credentials
- Ensuring all property information you provide is accurate and up to date
- Complying with all applicable Nigerian property and contract laws
- Treating other platform users with respect and professionalism

4. PROPERTY LISTINGS
All property listings must:
- Accurately represent the property being listed
- Include only properties you have legal authority to list
- Not contain misleading or fraudulent information
- Comply with all local property regulations

5. PAYMENTS AND FEES
All payments processed through NewCondo are subject to our payment terms. Platform fees are non-refundable except where explicitly stated. Commission structures are as agreed at the time of listing.

6. CANCELLATION AND REFUNDS
Refund eligibility is determined by our refund policy. The 24-hour confirmation period applies to all rental payments. Service fees collected to cover transaction costs are non-refundable.

7. LIMITATION OF LIABILITY
NewCondo's liability is limited to the amount paid by the user for the specific service giving rise to the claim. We are not liable for indirect, incidental, or consequential damages.

8. DISPUTE RESOLUTION
Any disputes arising from platform usage will first be addressed through our internal dispute resolution process before escalation to legal proceedings.

9. TERMINATION
NewCondo reserves the right to terminate or suspend accounts that violate these terms, engage in fraudulent activity, or harm other platform users.

10. CHANGES TO TERMS
We may update these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.

11. GOVERNING LAW
These terms are governed by the laws of the Federal Republic of Nigeria.

12. CONTACT
For questions about these terms, contact legal@newcondo.com.`,
  version: '2025.1',
  isRequired: true,
  lastUpdated: new Date('2025-01-15'),
};

export function TermsPageClient({ userRole, userVerificationStatus, documents }: Props) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  function handleUploadDocument(documentType: string) {
    router.push(`/dashboard/profile/verification?upload=${documentType}`);
  }

  function handleViewDetails() {
    router.push('/dashboard/profile/verification');
  }

  async function handleAccept(acceptedDocumentIds: string[]) {
    setIsAccepting(true);
    try {
      await fetch('/api/legal/accept-terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptedDocumentIds,
          version: TERMS_LEGAL_DOCUMENT.version,
        }),
      });
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to record terms acceptance:', error);
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <>
      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ComplianceStatus
            userRole={userRole}
            userVerificationStatus={userVerificationStatus}
            documents={documents}
            onUploadDocument={handleUploadDocument}
            onViewDetails={handleViewDetails}
          />
        </CardContent>
      </Card>

      {/* Trigger to open modal */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-sm underline text-primary hover:no-underline"
        >
          Review &amp; Accept Terms of Service
        </button>
      </div>

      {/* Legal Agreement Modal */}
      <LegalAgreementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documents={[TERMS_LEGAL_DOCUMENT]}
        userType={userRole}
        onAccept={handleAccept}
        isLoading={isAccepting}
      />
    </>
  );
}