// apps/platform/components/legal/PropertyOwnerAgreement.tsx

import React, { useState } from 'react';
import { Button } from '@newcondo/ui/components/button';
import { Checkbox } from '@newcondo/ui/components/checkbox';
import { ScrollArea } from '@newcondo/ui/components/scroll-area';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { AlertCircle } from 'lucide-react';

interface PropertyOwnerAgreementProps {
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
  markingFee: number;
}

export const PropertyOwnerAgreement: React.FC<PropertyOwnerAgreementProps> = ({
  onAccept,
  onDecline,
  isLoading = false,
  markingFee,
}) => {
  const [hasRead, setHasRead] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    if (isAtBottom) {
      setHasRead(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          Property Marking Service Agreement
        </h2>
        <p className="text-sm text-muted-foreground">
          Please review the terms and conditions for property marking services
          before proceeding with payment.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Service Fee: ₦{markingFee.toLocaleString()} - Please scroll to the
          bottom to enable acceptance.
        </AlertDescription>
      </Alert>

      <ScrollArea
        className="h-96 rounded-md border p-4"
        onScroll={handleScroll}
      >
        <div className="space-y-4 text-sm">
          <section>
            <h3 className="font-semibold text-base mb-2">
              1. Service Overview
            </h3>
            <p className="text-muted-foreground">
              The Property Marking Service enables accurate geolocation and
              boundary verification of your property on the Newcondo platform.
              This service is mandatory for property listing approval and helps
              prevent duplicate listings.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              2. Service Fee & Payment Terms
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Marking Fee: ₦{markingFee.toLocaleString()} (non-refundable
                once service is initiated)
              </li>
              <li>Payment must be completed before marking assignment begins</li>
              <li>
                Fee covers one complete marking attempt including boundary
                verification and photo documentation
              </li>
              <li>
                If you reject the completed marking, you must initiate and pay
                for a new marking request
              </li>
              <li>
                Payments are processed securely through Flutterwave payment
                gateway
              </li>
              <li>
                Virtual account will be created automatically for fund
                management
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              3. Marking Options
            </h3>
            <p className="text-muted-foreground mb-2">
              You have four options for property marking:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <strong>Self-Marking:</strong> Mark the property yourself using
                our satellite map interface (Free - no service fee)
              </li>
              <li>
                <strong>Trusted Person:</strong> Send a shareable link to
                someone you know to mark the property on your behalf (Free - no
                service fee)
              </li>
              <li>
                <strong>Newcondo Agent:</strong> Platform agents in your area
                mark the property (₦20,000 - First-come, first-served queue
                system)
              </li>
              <li>
                <strong>Newcondo Admin:</strong> Direct admin marking service
                (₦25,000 - Priority service)
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              4. Property Owner Responsibilities
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Provide accurate property address including State, LGA, and
                specific location
              </li>
              <li>
                Provide valid contact person details for property access
                coordination
              </li>
              <li>
                Ensure the marking agent or person has authorized access to the
                property
              </li>
              <li>
                Respond to marking completion notifications within 2-3 days
              </li>
              <li>
                Review and confirm or reject marking work through the platform
              </li>
              <li>
                Upload property images if available to help agents identify the
                building
              </li>
              <li>
                Provide clear access instructions if property location is
                difficult to find
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              5. Marking Deliverables
            </h3>
            <p className="text-muted-foreground mb-2">
              The assigned agent or marker will provide:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Accurate property boundary marked on satellite map view
              </li>
              <li>
                Minimum 5 high-quality photos of property including exterior,
                entrance, and key features
              </li>
              <li>GPS coordinates verification</li>
              <li>Building fingerprint data for duplicate prevention</li>
              <li>Optional: Additional photos of distinctive property features</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              6. Confirmation Process
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                You will receive a notification when marking is completed
              </li>
              <li>
                Review period: 2-3 days from marking completion to confirm or
                reject
              </li>
              <li>
                If you confirm the marking, the agent receives full payment and
                your property proceeds to admin approval
              </li>
              <li>
                If you fail to respond within 2-3 days, incremental payments are
                released to the agent automatically
              </li>
              <li>
                After multiple auto-releases, the marking is considered
                confirmed by default
              </li>
              <li>
                If you reject the marking, you must provide a reason and
                initiate a new marking request (new payment required)
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              7. Agent Queue System
            </h3>
            <p className="text-muted-foreground mb-2">
              When using Newcondo agent marking:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Your job is broadcast to verified agents within reasonable
                proximity
              </li>
              <li>Agents accept jobs on a first-come, first-served basis</li>
              <li>
                First agent in queue has 3 hours to complete the marking
              </li>
              <li>
                If first agent fails, the job automatically moves to the next
                agent in queue
              </li>
              <li>
                You receive notifications when agents accept and complete the
                marking
              </li>
              <li>Maximum completion time: 3 days from payment</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              8. Refund Policy
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Full refund available if no agent accepts the job within 24
                hours
              </li>
              <li>
                Full refund if marking cannot be completed due to property
                inaccessibility (verified by agent)
              </li>
              <li>
                Partial refund (50%) if you cancel after agent assignment but
                before completion
              </li>
              <li>
                No refund after marking completion, regardless of confirmation
                status
              </li>
              <li>
                Refunds processed to your virtual account within 3-5 business
                days
              </li>
              <li>
                Disputed refunds reviewed by Newcondo admin within 7 business
                days
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              9. Quality Assurance
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                All marking agents are verified and rated by the platform
              </li>
              <li>Agents must maintain a minimum 3.5-star rating</li>
              <li>
                You can rate the agent&apos;s work after confirmation (1-5 stars)
              </li>
              <li>
                Poor quality markings can be reported to platform
                administrators
              </li>
              <li>
                Newcondo reserves the right to review and reject inadequate
                markings
              </li>
              <li>
                Repeated quality issues may result in agent suspension
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              10. Privacy & Data Protection
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Your contact information is shared only with assigned marking
                agents
              </li>
              <li>
                Property photos taken by agents become part of your listing
              </li>
              <li>
                GPS coordinates and boundary data are stored securely in our
                database
              </li>
              <li>
                Personal information is protected under Nigerian Data Protection
                Regulation (NDPR)
              </li>
              <li>
                You can request deletion of personal data after property
                unlisting
              </li>
              <li>
                Agents are contractually bound to maintain confidentiality
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              11. Liability Limitations
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Newcondo is not liable for delays caused by property
                inaccessibility
              </li>
              <li>
                We are not responsible for disputes between you and the marking
                agent
              </li>
              <li>
                Platform liability limited to refund of service fee where
                applicable
              </li>
              <li>
                You are responsible for ensuring authorized access to the
                property
              </li>
              <li>
                Newcondo is not liable for incorrect address information
                provided by you
              </li>
              <li>
                Force majeure events may delay service without liability
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              12. Duplicate Prevention System
            </h3>
            <p className="text-muted-foreground">
              Property marking creates a unique fingerprint for your property.
              This prevents duplicate listings and ensures each property is
              listed only once on the platform. Once marked and confirmed, your
              property boundaries are permanently stored and cannot be claimed
              by other users.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              13. Dispute Resolution
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Disputes regarding marking quality are reviewed by platform
                administrators
              </li>
              <li>
                Submit disputes through the platform help center within 7 days
              </li>
              <li>Admin decisions are final and binding</li>
              <li>
                Mediation available for complex disputes at no additional cost
              </li>
              <li>
                Legal action governed by laws of the Federal Republic of Nigeria
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              14. Service Modifications
            </h3>
            <p className="text-muted-foreground">
              Newcondo reserves the right to modify service fees, procedures, or
              terms with 14 days notice to property owners with pending marking
              requests. Modifications do not affect already-paid marking
              services.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              15. Contact & Support
            </h3>
            <p className="text-muted-foreground">
              For assistance with marking services, contact Newcondo support:
              <br />
              Email: support@newcondo.com
              <br />
              Platform: Help Center (available 24/7)
              <br />
              Response Time: Within 24 hours
            </p>
          </section>

          <section className="pt-4 border-t">
            <p className="text-sm text-muted-foreground italic">
              Last Updated: October 13, 2025
              <br />
              Version: 1.0
            </p>
          </section>
        </div>
      </ScrollArea>

      <div className="space-y-4">
        <div className="flex items-start space-x-2">
          <Checkbox
            id="accept"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked as boolean)}
            disabled={!hasRead}
          />
          <label
            htmlFor="accept"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have read, understood, and agree to the Property Marking Service
            terms and conditions. I understand that the marking fee of ₦
            {markingFee.toLocaleString()} is non-refundable after service
            initiation.
          </label>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onAccept}
            disabled={!accepted || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : 'Accept & Proceed to Payment'}
          </Button>
          <Button
            onClick={onDecline}
            variant="outline"
            disabled={isLoading}
            className="flex-1"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
};