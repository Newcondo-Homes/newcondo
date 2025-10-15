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





// "use client";

// import React, { useState } from "react";
// import { Button } from "@newcondo/ui/components/button";
// import { Checkbox } from "@newcondo/ui/components/checkbox";
// import { ScrollArea } from "@newcondo/ui/components/scroll-area";
// import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
// import { AlertCircle, FileText, Shield, AlertTriangle } from "lucide-react";

// interface AgentAgreementProps {
//   onAccept: () => void;
//   onDecline?: () => void;
//   isLoading?: boolean;
//   showActions?: boolean;
// }

// export const AgentAgreement: React.FC<AgentAgreementProps> = ({
//   onAccept,
//   onDecline,
//   isLoading = false,
//   showActions = true,
// }) => {
//   const [agreed, setAgreed] = useState(false);
//   const [readToEnd, setReadToEnd] = useState(false);

//   const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
//     const element = e.currentTarget;
//     const isAtBottom =
//       element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
//     if (isAtBottom && !readToEnd) {
//       setReadToEnd(true);
//     }
//   };

//   return (
//     <div className="w-full max-w-4xl mx-auto space-y-6">
//       {/* Header */}
//       <div className="flex items-center gap-3 pb-4 border-b">
//         <div className="p-2 bg-blue-100 rounded-lg">
//           <FileText className="w-6 h-6 text-blue-600" />
//         </div>
//         <div>
//           <h2 className="text-2xl font-bold">Property Marking Agent Agreement</h2>
//           <p className="text-sm text-gray-600">
//             Effective Date: October 15, 2025
//           </p>
//         </div>
//       </div>

//       {/* Important Notice */}
//       <Alert>
//         <AlertCircle className="h-4 w-4" />
//         <AlertDescription>
//           Please read this agreement carefully before accepting property marking
//           assignments. This document outlines your rights, responsibilities, and
//           compensation structure.
//         </AlertDescription>
//       </Alert>

//       {/* Agreement Content */}
//       <ScrollArea
//         className="h-[500px] rounded-lg border p-6 bg-gray-50"
//         onScroll={handleScroll}
//       >
//         <div className="space-y-6 text-sm">
//           {/* 1. Introduction */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
//               <Shield className="w-5 h-5 text-blue-600" />
//               1. Introduction and Purpose
//             </h3>
//             <p className="leading-relaxed text-gray-700">
//               This Agent Agreement ("Agreement") is entered into between you
//               ("Agent" or "Marking Agent") and NewCondo Platform ("Company",
//               "Platform", "we", "us", or "our"). By accepting property marking
//               assignments through the NewCondo platform, you agree to be bound by
//               the terms and conditions set forth in this Agreement.
//             </p>
//             <p className="mt-2 leading-relaxed text-gray-700">
//               The Property Marking Service is designed to facilitate accurate
//               geolocation verification of properties listed on the NewCondo
//               platform. As a Marking Agent, you play a crucial role in ensuring
//               property authenticity and preventing fraudulent listings.
//             </p>
//           </section>

//           {/* 2. Agent Eligibility */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">
//               2. Agent Eligibility and Requirements
//             </h3>
//             <div className="space-y-2 text-gray-700">
//               <p className="font-medium">To qualify as a Marking Agent, you must:</p>
//               <ul className="list-disc pl-6 space-y-1">
//                 <li>Be a verified user on the NewCondo platform</li>
//                 <li>
//                   Hold either an Agent account or a Premium Renter subscription
//                 </li>
//                 <li>Have completed identity verification (NIN, BVN, or Passport)</li>
//                 <li>Possess a smartphone with GPS capability and camera</li>
//                 <li>Have stable internet connectivity</li>
//                 <li>Be physically present in Nigeria</li>
//                 <li>Maintain a reliability score of at least 3.0/5.0</li>
//                 <li>Have no history of fraudulent activities on the platform</li>
//               </ul>
//             </div>
//           </section>

//           {/* 3. Scope of Services */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">3. Scope of Services</h3>
//             <div className="space-y-3 text-gray-700">
//               <p className="font-medium">As a Marking Agent, you agree to:</p>
//               <ul className="list-disc pl-6 space-y-2">
//                 <li>
//                   <strong>Physical Verification:</strong> Visit the property
//                   location at the scheduled time and verify its physical existence
//                   and location accuracy
//                 </li>
//                 <li>
//                   <strong>GPS Marking:</strong> Use the platform's mapping tools
//                   to accurately mark the property boundaries on the satellite map
//                   view
//                 </li>
//                 <li>
//                   <strong>Photo Documentation:</strong> Capture clear, high-quality
//                   photographs of key property features including:
//                   <ul className="list-circle pl-6 mt-1">
//                     <li>Property exterior (front, sides, and back where accessible)</li>
//                     <li>Building entrance and gate</li>
//                     <li>Key interior rooms (if granted access)</li>
//                     <li>Street view showing property context</li>
//                     <li>Property signage or identifying features</li>
//                   </ul>
//                 </li>
//                 <li>
//                   <strong>Contact Coordination:</strong> Communicate professionally
//                   with the contact person provided by the property owner to
//                   facilitate access
//                 </li>
//                 <li>
//                   <strong>Accurate Reporting:</strong> Submit truthful and accurate
//                   information about the property condition and location
//                 </li>
//                 <li>
//                   <strong>Time Compliance:</strong> Complete marking assignments
//                   within the allocated 3-hour time window from acceptance
//                 </li>
//               </ul>
//             </div>
//           </section>

//           {/* 4. Assignment and Queue System */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">
//               4. Assignment and Queue System
//             </h3>
//             <div className="space-y-3 text-gray-700">
//               <p>
//                 <strong>4.1 Job Assignment:</strong> Property marking jobs are
//                 broadcast to qualified agents within a reasonable proximity (typically
//                 15-30km radius) of the property location. Assignments are made on a
//                 first-come, first-served basis.
//               </p>
//               <p>
//                 <strong>4.2 Time Window:</strong> Upon accepting a marking job, you
//                 have exactly 3 hours to complete the assignment. This time window
//                 begins immediately upon acceptance.
//               </p>
//               <p>
//                 <strong>4.3 Queue Position:</strong> If multiple agents accept the
//                 same job, you will be placed in a queue. Only the first agent to
//                 complete the marking successfully will receive the full compensation.
//               </p>
//               <p>
//                 <strong>4.4 Time Expiry:</strong> Failure to complete the marking
//                 within the 3-hour window will result in automatic reassignment to the
//                 next agent in the queue. You may receive a partial compensation of
//                 ₦1,000 if you made a genuine attempt.
//               </p>
//             </div>
//           </section>

//           {/* 5. Compensation Structure */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">
//               5. Compensation Structure
//             </h3>
//             <div className="space-y-3 text-gray-700 bg-blue-50 p-4 rounded-lg">
//               <p className="font-semibold text-blue-900">
//                 Standard Marking Fee Structure:
//               </p>
//               <ul className="space-y-2">
//                 <li>
//                   <strong>Total Marking Fee:</strong> ₦20,000 per property (paid by
//                   property owner)
//                 </li>
//                 <li>
//                   <strong>Agent Compensation:</strong> 25% of ₦20,000 = ₦5,000
//                 </li>
//                 <li>
//                   <strong>Platform Fee:</strong> 75% of ₦20,000 = ₦15,000 (retained
//                   by NewCondo)
//                 </li>
//               </ul>
              
//               <p className="font-semibold text-blue-900 mt-4">
//                 Payment Timeline:
//               </p>
//               <ul className="list-disc pl-6 space-y-1">
//                 <li>
//                   <strong>Initial Payment:</strong> ₦1,000 (partial) credited
//                   immediately upon successful marking submission
//                 </li>
//                 <li>
//                   <strong>Final Payment:</strong> Remaining ₦4,000 released after
//                   property owner verification (within 2-3 days)
//                 </li>
//                 <li>
//                   <strong>Non-verification Scenario:</strong> If property owner fails
//                   to verify within 2-3 days, you receive incremental payments until
//                   the full ₦5,000 is paid
//                 </li>
//               </ul>
//             </div>
//           </section>

//           {/* 6. Payment Terms */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">6. Payment Terms</h3>
//             <div className="space-y-3 text-gray-700">
//               <p>
//                 <strong>6.1 Virtual Account:</strong> All payments are processed
//                 through your NewCondo virtual account. Funds are held securely and
//                 can be withdrawn to your registered bank account.
//               </p>
//               <p>
//                 <strong>6.2 Payment Hold Period:</strong> The initial ₦1,000 partial
//                 payment is subject to a hold period pending property owner
//                 verification. This protects against fraudulent marking attempts.
//               </p>
//               <p>
//                 <strong>6.3 Verification Timeline:</strong> Property owners have 2-3
//                 days from the time of marking to verify the work. If verification is
//                 not completed within this period, incremental payments will be
//                 released to you automatically.
//               </p>
//               <p>
//                 <strong>6.4 Withdrawal:</strong> You may withdraw funds from your
//                 virtual account once the full ₦5,000 has been released. Minimum
//                 withdrawal amount is ₦1,000.
//               </p>
//               <p>
//                 <strong>6.5 Failed Verification:</strong> If the property owner
//                 rejects your marking work, the marking fee will not be released. You
//                 will be notified of the reason for rejection and may dispute the
//                 decision through our support system.
//               </p>
//             </div>
//           </section>

//           {/* 7. Professional Conduct */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">
//               7. Professional Conduct and Ethics
//             </h3>
//             <div className="space-y-2 text-gray-700">
//               <p className="font-medium">As a Marking Agent, you must:</p>
//               <ul className="list-disc pl-6 space-y-1">
//                 <li>Conduct yourself professionally at all times</li>
//                 <li>Respect property boundaries and privacy</li>
//                 <li>Obtain permission before entering private property</li>
//                 <li>Dress appropriately and present yourself professionally</li>
//                 <li>Communicate respectfully with property owners and contacts</li>
//                 <li>Protect confidential information about properties</li>
//                 <li>Not engage in any form of harassment or discrimination</li>
//                 <li>Report any safety concerns immediately</li>
//                 <li>Not solicit property owners for private business deals</li>
//                 <li>Comply with all applicable local laws and regulations</li>
//               </ul>
//             </div>
//           </section>

//           {/* 8. Prohibited Activities */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
//               <AlertTriangle className="w-5 h-5 text-red-600" />
//               8. Prohibited Activities
//             </h3>
//             <div className="space-y-2 text-gray-700 bg-red-50 p-4 rounded-lg">
//               <p className="font-semibold text-red-900">
//                 The following activities are strictly prohibited:
//               </p>
//               <ul className="list-disc pl-6 space-y-1">
//                 <li>
//                   <strong>Fraudulent Marking:</strong> Marking properties remotely
//                   without physical verification
//                 </li>
//                 <li>
//                   <strong>False Documentation:</strong> Submitting fake or
//                   manipulated photos
//                 </li>
//                 <li>
//                   <strong>GPS Spoofing:</strong> Using tools to fake your location
//                 </li>
//                 <li>
//                   <strong>Collusion:</strong> Coordinating with property owners to
//                   defraud the platform
//                 </li>
//                 <li>
//                   <strong>Multiple Accounts:</strong> Operating multiple agent
//                   accounts to game the queue system
//                 </li>
//                 <li>
//                   <strong>Job Hoarding:</strong> Accepting jobs with no intention to
//                   complete them
//                 </li>
//                 <li>
//                   <strong>Unauthorized Access:</strong> Entering restricted areas
//                   without permission
//                 </li>
//                 <li>
//                   <strong>Data Theft:</strong> Stealing or misusing property owner
//                   information
//                 </li>
//               </ul>
//               <p className="mt-3 font-semibold text-red-900">
//                 Violation of any prohibited activity will result in immediate account
//                 suspension and forfeiture of all pending payments.
//               </p>
//             </div>
//           </section>

//           {/* 9. Safety and Liability */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">
//               9. Safety and Liability
//             </h3>
//             <div className="space-y-3 text-gray-700">
//               <p>
//                 <strong>9.1 Independent Contractor Status:</strong> You acknowledge
//                 that you are an independent contractor and not an employee of
//                 NewCondo. The Company is not responsible for providing insurance,
//                 benefits, or liability coverage for agents.
//               </p>
//               <p>
//                 <strong>9.2 Personal Safety:</strong> You are solely responsible for
//                 your personal safety while conducting property markings. Always
//                 assess risks before accepting assignments and decline jobs in
//                 unsafe areas.
//               </p>
//               <p>
//                 <strong>9.3 Property Damage:</strong> You are liable for any damage
//                 caused to property during the marking process. We recommend
//                 obtaining personal liability insurance.
//               </p>
//               <p>
//                 <strong>9.4 Injury or Accident:</strong> NewCondo is not liable for
//                 any injuries, accidents, or incidents that occur during property
//                 marking activities. You assume all risks associated with the work.
//               </p>
//               <p>
//                 <strong>9.5 Emergency Situations:</strong> In case of emergency,
//                 prioritize your safety and contact local authorities immediately.
//                 Notify the platform support team as soon as possible.
//               </p>
//             </div>
//           </section>

//           {/* 10. Data Privacy */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">
//               10. Data Privacy and Confidentiality
//             </h3>
//             <div className="space-y-2 text-gray-700">
//               <p>
//                 <strong>10.1 Confidential Information:</strong> You will have access
//                 to property owner contact information, property details, and location
//                 data. This information is confidential and must not be shared,
//                 published, or used for purposes outside of the marking assignment.
//               </p>
//               <p>
//                 <strong>10.2 Data Protection:</strong> You agree to comply with
//                 Nigeria's Data Protection Regulation (NDPR) and handle all personal
//                 data responsibly and securely.
//               </p>
//               <p>
//                 <strong>10.3 Photo Usage:</strong> Photos you submit become property
//                 of the NewCondo platform and may be used for property listings,
//                 marketing, and verification purposes. You warrant that you have the
//                 right to submit these photos.
//               </p>
//             </div>
//           </section>

//           {/* 11. Quality Standards */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">
//               11. Quality Standards and Performance Metrics
//             </h3>
//             <div className="space-y-3 text-gray-700">
//               <p>
//                 <strong>11.1 Reliability Score:</strong> Your performance is tracked
//                 through a reliability score (0-5.0). This score is based on:
//               </p>
//               <ul className="list-disc pl-6 space-y-1">
//                 <li>Completion rate (jobs completed vs. accepted)</li>
//                 <li>Time compliance (completing within 3-hour window)</li>
//                 <li>Quality of photos submitted</li>
//                 <li>Accuracy of GPS marking</li>
//                 <li>Property owner verification success rate</li>
//                 <li>Professional conduct ratings</li>
//               </ul>
//               <p>
//                 <strong>11.2 Minimum Standards:</strong> You must maintain a
//                 reliability score of at least 3.0 to continue receiving assignments.
//                 Scores below 3.0 will result in temporary suspension pending review.
//               </p>
//               <p>
//                 <strong>11.3 Photo Quality Requirements:</strong>
//               </p>
//               <ul className="list-disc pl-6 space-y-1">
//                 <li>Minimum resolution: 1920x1080 pixels</li>
//                 <li>Clear, well-lit images (avoid blurry or dark photos)</li>
//                 <li>Multiple angles showing property context</li>
//                 <li>Time-stamped photos (automatic through app)</li>
//                 <li>Minimum 6 photos per property</li>
//               </ul>
//             </div>
//           </section>

//           {/* 12. Dispute Resolution */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">12. Dispute Resolution</h3>
//             <div className="space-y-2 text-gray-700">
//               <p>
//                 <strong>12.1 Marking Disputes:</strong> If a property owner disputes
//                 your marking work, you will be notified and given an opportunity to
//                 respond. The Company will review evidence from both parties and make
//                 a final determination.
//               </p>
//               <p>
//                 <strong>12.2 Payment Disputes:</strong> Payment disputes must be
//                 raised within 14 days of the disputed transaction. Contact our
//                 support team at support@newcondo.ng with relevant details.
//               </p>
//               <p>
//                 <strong>12.3 Arbitration:</strong> Any disputes that cannot be
//                 resolved through our internal process will be subject to arbitration
//                 in Lagos, Nigeria, in accordance with Nigerian law.
//               </p>
//             </div>
//           </section>

//           {/* 13. Account Suspension and Termination */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">
//               13. Account Suspension and Termination
//             </h3>
//             <div className="space-y-3 text-gray-700">
//               <p>
//                 <strong>13.1 Grounds for Suspension:</strong> Your agent account may
//                 be suspended for:
//               </p>
//               <ul className="list-disc pl-6 space-y-1">
//                 <li>Reliability score falling below 3.0</li>
//                 <li>Multiple failed verifications</li>
//                 <li>Customer complaints about unprofessional conduct</li>
//                 <li>Suspected fraudulent activity pending investigation</li>
//                 <li>Violation of platform terms and conditions</li>
//               </ul>
//               <p>
//                 <strong>13.2 Permanent Termination:</strong> Your account will be
//                 permanently terminated for:
//               </p>
//               <ul className="list-disc pl-6 space-y-1">
//                 <li>Confirmed fraudulent marking activity</li>
//                 <li>Identity theft or impersonation</li>
//                 <li>Repeated violations after warnings</li>
//                 <li>Criminal activity related to platform usage</li>
//                 <li>Breach of confidentiality agreements</li>
//               </ul>
//               <p>
//                 <strong>13.3 Effect of Termination:</strong> Upon termination, you
//                 will lose access to the platform and forfeit any pending payments
//                 not yet released. Released funds in your virtual account can be
//                 withdrawn within 30 days.
//               </p>
//             </div>
//           </section>

//           {/* 14. Updates to Agreement */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">
//               14. Updates to This Agreement
//             </h3>
//             <p className="text-gray-700">
//               NewCondo reserves the right to update this Agreement at any time. You
//               will be notified of material changes via email or in-app notification.
//               Continued use of the platform after changes are posted constitutes
//               acceptance of the updated Agreement. If you do not agree to the
//               changes, you must discontinue use of the marking service.
//             </p>
//           </section>

//           {/* 15. Contact Information */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">
//               15. Contact Information
//             </h3>
//             <div className="space-y-2 text-gray-700 bg-gray-100 p-4 rounded-lg">
//               <p>
//                 <strong>For questions about this Agreement:</strong>
//               </p>
//               <ul className="space-y-1">
//                 <li>Email: support@newcondo.ng</li>
//                 <li>Phone: +234 XXX XXX XXXX</li>
//                 <li>Address: Lagos, Nigeria</li>
//                 <li>Support Hours: Monday - Friday, 9:00 AM - 6:00 PM WAT</li>
//               </ul>
//             </div>
//           </section>

//           {/* 16. Acknowledgment */}
//           <section>
//             <h3 className="text-lg font-semibold mb-3">16. Acknowledgment</h3>
//             <p className="text-gray-700">
//               By accepting this Agreement, you acknowledge that you have read,
//               understood, and agree to be bound by all terms and conditions outlined
//               herein. You confirm that you meet all eligibility requirements and
//               will conduct property marking activities in accordance with
//               professional standards and applicable laws.
//             </p>
//           </section>

//           {/* Scroll indicator */}
//           {!readToEnd && (
//             <div className="sticky bottom-0 left-0 right-0 py-3 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent text-center">
//               <p className="text-sm text-gray-500 animate-pulse">
//                 ↓ Scroll to read the entire agreement ↓
//               </p>
//             </div>
//           )}
//         </div>
//       </ScrollArea>

//       {/* Agreement Checkbox */}
//       {showActions && (
//         <>
//           <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
//             <Checkbox
//               id="agree"
//               checked={agreed}
//               onCheckedChange={(checked) => setAgreed(checked as boolean)}
//               disabled={!readToEnd}
//               className="mt-1"
//             />
//             <label
//               htmlFor="agree"
//               className={`text-sm leading-relaxed ${
//                 !readToEnd ? "text-gray-400" : "text-gray-700 cursor-pointer"
//               }`}
//             >
//               I have read and agree to the Property Marking Agent Agreement. I
//               understand my responsibilities, compensation structure, and the
//               professional standards required. I acknowledge that I am an
//               independent contractor and accept all terms outlined above.
//             </label>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex gap-4 justify-end">
//             {onDecline && (
//               <Button
//                 variant="outline"
//                 onClick={onDecline}
//                 disabled={isLoading}
//               >
//                 Decline
//               </Button>
//             )}
//             <Button
//               onClick={onAccept}
//               disabled={!agreed || isLoading}
//               className="min-w-[120px]"
//             >
//               {isLoading ? "Processing..." : "Accept Agreement"}
//             </Button>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };