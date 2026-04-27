'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { ComplianceStatus } from '@/components/legal/ComplianceStatus';
import LegalAgreementModal from '@/components/legal/LegalAgreementModal';
import type {LegalDocument}  from '@/components/legal/LegalAgreementModal';

// Re-export the type so the page can import it if needed
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

// The privacy policy document passed to LegalAgreementModal
const PRIVACY_LEGAL_DOCUMENT: LegalDocument = {
  id: 'privacy-policy-2025-1',
  title: 'NewCondo Privacy Policy',
  type: 'PRIVACY_POLICY',
  content: `NEWCONDO PRIVACY POLICY — Version 2025.1

1. INFORMATION WE COLLECT
We collect information you provide directly to us, such as your name, email address, phone number, and any information related to properties you list or inquire about.

2. HOW WE USE YOUR INFORMATION
The information we collect is used to provide, maintain, and improve our services, process transactions, and communicate with you about your account.

3. INFORMATION SHARING
We do not share your personal information with third parties except as necessary to provide our services, comply with legal obligations, or with your explicit consent.

4. DATA SECURITY
We implement robust security measures to protect your information from unauthorized access, alteration, disclosure, or destruction.

5. YOUR RIGHTS
You have the right to access, correct, or delete your personal data. You may also have the right to object to or restrict certain processing activities.

6. COOKIES
We use cookies and similar tracking technologies to track activity on our platform and hold certain information to improve your experience.

7. CHANGES TO THIS POLICY
We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.

8. CONTACT US
If you have questions about this Privacy Policy, please contact us at privacy@newcondo.com.`,
  version: '2025.1',
  isRequired: true,
  lastUpdated: new Date('2025-01-15'),
};

export function PrivacyPageClient({ userRole, userVerificationStatus, documents }: Props) {
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
      await fetch('/api/legal/accept-privacy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptedDocumentIds,
          version: PRIVACY_LEGAL_DOCUMENT.version,
        }),
      });
      setIsModalOpen(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to record acceptance:', error);
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <>
      {/* Compliance Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Compliance Status</CardTitle>
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

      {/* Button to open the agreement modal */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-sm underline text-primary hover:no-underline"
        >
          Review &amp; Accept Privacy Policy
        </button>
      </div>

      {/* Legal Agreement Modal */}
      <LegalAgreementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        documents={[PRIVACY_LEGAL_DOCUMENT]}
        userType={userRole}
        onAccept={handleAccept}
        isLoading={isAccepting}
      />
    </>
  );
}