// apps/platform/components/legal/AgentAgreement.tsx

import React, { useState } from 'react';
import { Button } from '@newcondo/ui/components/button';
import { Checkbox } from '@newcondo/ui/components/checkbox';
import { ScrollArea } from '@newcondo/ui/components/scroll-area';
import { Alert, AlertDescription } from '@newcondo/ui/components/alert';
import { AlertCircle } from 'lucide-react';

interface AgentAgreementProps {
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export const AgentAgreement: React.FC<AgentAgreementProps> = ({
  onAccept,
  onDecline,
  isLoading = false,
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
        <h2 className="text-2xl font-bold">Agent Marking Service Agreement</h2>
        <p className="text-sm text-muted-foreground">
          Please read and accept the terms and conditions to proceed with
          property marking services.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please scroll to the bottom of the agreement to enable acceptance.
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
              As a Newcondo Agent or Premium Renter, you are eligible to accept
              property marking assignments. This agreement governs your
              participation in the Property Marking Service.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              2. Agent Responsibilities
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Complete assigned marking jobs within the allocated 3-hour time
                window
              </li>
              <li>
                Accurately mark property boundaries using the satellite map
                interface
              </li>
              <li>
                Upload clear, high-quality photos of key property areas
                including exterior, entrance, and distinctive features
              </li>
              <li>
                Use the property address and contact person information
                responsibly
              </li>
              <li>
                Maintain professional conduct when contacting property owners or
                their representatives
              </li>
              <li>
                Report any discrepancies or access issues immediately through
                the platform
              </li>
              <li>
                Respect property owner privacy and handle all information
                confidentially
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              3. Payment & Compensation
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Base compensation: 25% of ₦20,000 (₦5,000) per completed
                marking job
              </li>
              <li>
                Initial deposit (₦1,000) released immediately upon marking
                completion
              </li>
              <li>
                Remaining balance (₦4,000) released after property owner
                confirmation
              </li>
              <li>
                If property owner fails to confirm within 2-3 days, incremental
                payments will be released
              </li>
              <li>
                Payments are transferred to your Newcondo virtual account
              </li>
              <li>
                Withdrawal requests processed within 24-48 hours to your
                designated bank account
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              4. Queue System & Time Management
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Marking jobs are assigned on a first-come, first-served basis
              </li>
              <li>
                You have 3 hours from assignment to complete the marking
              </li>
              <li>
                Failure to complete within the time window forfeits the job to
                the next agent in queue
              </li>
              <li>
                Repeated failures may affect your reliability score and future
                assignment eligibility
              </li>
              <li>
                You may decline jobs before acceptance without penalty
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              5. Quality Standards
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Property boundaries must be accurately marked</li>
              <li>Minimum 5 clear photos required per property</li>
              <li>Photos must include: building exterior, entrance, at least 3 distinctive features</li>
              <li>Images must be well-lit and clearly show property details</li>
              <li>Blurry, dark, or incomplete submissions may be rejected</li>
              <li>
                Rejected submissions do not qualify for payment and may affect
                your rating
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              6. Liability & Indemnification
            </h3>
            <p className="text-muted-foreground mb-2">
              By accepting this agreement, you acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                You are solely responsible for your safety during property
                visits
              </li>
              <li>
                Newcondo is not liable for any accidents, injuries, or damages
                incurred during marking activities
              </li>
              <li>
                You must obtain permission before entering any private property
              </li>
              <li>
                You indemnify Newcondo against any claims arising from your
                marking activities
              </li>
              <li>
                You are responsible for any legal consequences of trespassing or
                unauthorized access
              </li>
              <li>
                You maintain appropriate insurance coverage for your activities
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              7. Data Privacy & Confidentiality
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Property owner contact information is provided solely for
                marking coordination
              </li>
              <li>
                You must not share, sell, or misuse any personal information
                accessed
              </li>
              <li>
                Photos taken must only be used for Newcondo platform purposes
              </li>
              <li>
                Violation of privacy terms may result in immediate account
                termination and legal action
              </li>
              <li>
                All data must be handled in compliance with Nigerian Data
                Protection Regulation (NDPR)
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              8. Performance & Rating System
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Your reliability score is calculated based on completion rate,
                timeliness, and quality
              </li>
              <li>
                Property owners can rate your work (1-5 stars) after completion
              </li>
              <li>
                Consistently low ratings may result in reduced job assignments
              </li>
              <li>Score below 3.0 may result in temporary suspension</li>
              <li>
                Excellent performance (4.5+ rating) may qualify you for premium
                assignments
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              9. Dispute Resolution
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                Disputes regarding marking quality are reviewed by Newcondo
                administrators
              </li>
              <li>
                Property owners have 2-3 days to raise concerns about marking
                quality
              </li>
              <li>
                You have the right to provide evidence and explanation for
                disputed work
              </li>
              <li>Admin decisions on disputes are final and binding</li>
              <li>
                Repeated disputes may affect your eligibility for future
                assignments
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              10. Termination & Suspension
            </h3>
            <p className="text-muted-foreground mb-2">
              Newcondo reserves the right to suspend or terminate your marking
              privileges for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Repeated failure to complete assigned jobs</li>
              <li>Consistently poor quality work</li>
              <li>Violation of privacy or confidentiality terms</li>
              <li>Fraudulent activity or submission of fake photos</li>
              <li>Unprofessional conduct with property owners</li>
              <li>Misuse of platform features or information</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              11. Platform Changes
            </h3>
            <p className="text-muted-foreground">
              Newcondo reserves the right to modify compensation rates, quality
              standards, or service terms with 14 days notice to active agents.
              Continued participation after notice constitutes acceptance of new
              terms.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              12. Governing Law
            </h3>
            <p className="text-muted-foreground">
              This agreement is governed by the laws of the Federal Republic of
              Nigeria. Any disputes shall be resolved in Nigerian courts with
              jurisdiction over Lagos State.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">
              13. Contact & Support
            </h3>
            <p className="text-muted-foreground">
              For questions or concerns about marking services, contact Newcondo
              support through the platform help center or email
              support@newcondo.com.
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
            I have read, understood, and agree to abide by all terms and
            conditions of the Agent Marking Service Agreement
          </label>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={onAccept}
            disabled={!accepted || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Processing...' : 'Accept & Continue'}
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