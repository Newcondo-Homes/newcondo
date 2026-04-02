"use client";

import { useState } from "react";
import { Checkbox } from "@newcondo/ui/components/checkbox";
import { Label } from "@newcondo/ui/components/label";
import { ScrollArea } from "@newcondo/ui/components/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@newcondo/ui/components/dialog";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle } from "lucide-react";

interface MarkingServiceTermsProps {
  userType: "property_owner" | "agent" | "renter";
  onAccept?: (accepted: boolean) => void;
  defaultChecked?: boolean;
  showDialog?: boolean;
}

export default function MarkingServiceTerms({
  userType,
  onAccept,
  defaultChecked = false,
  showDialog = false,
}: MarkingServiceTermsProps) {
  const [accepted, setAccepted] = useState(defaultChecked);
  const [open, setOpen] = useState(false);

  const handleAcceptChange = (checked: boolean) => {
    setAccepted(checked);
    onAccept?.(checked);
  };

  const termsContent = {
    property_owner: {
      title: "Property Marking Service Terms for Property Owners",
      sections: [
        {
          heading: "1. Service Overview",
          content: [
            "The Property Marking Service allows property owners to verify property locations through GPS-based boundary marking on satellite maps.",
            "Marking fees: ₦20,000 for agent-assisted marking, ₦25,000 for Newcondo direct service.",
            "All payments must be completed before marking service assignment.",
          ],
        },
        {
          heading: "2. Property Owner Responsibilities",
          content: [
            "Provide accurate property address and location information.",
            "Designate a contact person with valid phone number for property access coordination.",
            "Ensure property accessibility during scheduled marking time slots.",
            "Provide clear access instructions and any security requirements.",
            "Review and confirm marked boundaries within 2-3 days of completion.",
            "Upload property images if available to assist marker identification.",
          ],
        },
        {
          heading: "3. Payment and Refund Policy",
          content: [
            "Payment is non-refundable once an agent has been assigned and marking is in progress.",
            "If no agent accepts the job within 48 hours, a full refund will be processed.",
            "Partial payment (₦1,000) is released to the agent upon initial marking completion.",
            "Full payment is released only after property owner confirmation.",
            "If property owner fails to confirm within the 2-3 day window, partial payments continue until marking fee is exhausted.",
          ],
        },
        {
          heading: "4. Confirmation and Verification",
          content: [
            "You have 2-3 days from marking completion to review and confirm the marked boundaries.",
            "Failure to confirm within the window results in automatic partial payment releases to the marker.",
            "Once marking fee is fully disbursed, you must initiate a new marking job for re-marking.",
            "Confirmation validates the property boundary for listing purposes.",
            "Disputed boundaries must be reported within the confirmation period.",
          ],
        },
        {
          heading: "5. Liability and Disclaimer",
          content: [
            "Newcondo acts as a facilitator and is not responsible for marker conduct or property damage.",
            "Property owners are responsible for ensuring authorized access to the property.",
            "Newcondo is not liable for delays caused by property inaccessibility or incorrect information.",
            "Any disputes between property owners and markers must be resolved through Newcondo support.",
            "Marking accuracy depends on GPS technology and may have minor variations.",
          ],
        },
        {
          heading: "6. Data Protection",
          content: [
            "Contact information shared with markers is used solely for marking coordination.",
            "Property images and location data are stored securely and used only for platform purposes.",
            "You retain ownership of all property-related media uploaded to the platform.",
          ],
        },
        {
          heading: "7. Service Termination",
          content: [
            "Newcondo reserves the right to refuse marking service for properties with incomplete information.",
            "Repeated non-confirmation or false property information may result in service suspension.",
            "Marking jobs can be cancelled before agent assignment with full refund.",
          ],
        },
      ],
    },
    agent: {
      title: "Property Marking Service Terms for Agents",
      sections: [
        {
          heading: "1. Service Overview",
          content: [
            "Agents can earn 25% of the marking fee (₦5,000) for successfully marking properties.",
            "Jobs are assigned on a first-come, first-served queue system.",
            "Each assigned job has a 3-hour completion window.",
          ],
        },
        {
          heading: "2. Agent Responsibilities",
          content: [
            "Accept only jobs within your actual service coverage areas.",
            "Contact the designated property contact person to coordinate access.",
            "Arrive at the property within the assigned 3-hour time slot.",
            "Accurately mark property boundaries using the provided GPS marking tools.",
            "Capture clear photos of key building features and rooms as required.",
            "Use provided property images to correctly identify the target building.",
            "Complete marking within the allocated time window.",
          ],
        },
        {
          heading: "3. Payment Structure",
          content: [
            "Initial payment (₦1,000) is credited to your virtual account upon marking completion.",
            "Initial payment cannot be withdrawn until property owner confirms the marking.",
            "Full payment (₦5,000) is released after property owner confirmation within 2-3 days.",
            "If owner doesn't confirm within window, partial payments continue until fee exhausted.",
            "All payments are processed through your Newcondo virtual account.",
          ],
        },
        {
          heading: "4. Queue and Time Management",
          content: [
            "Jobs are distributed to available agents in your service areas.",
            "Queue position is determined by acceptance time (first-come, first-served).",
            "You have 3 hours from assignment to complete the marking.",
            "Failure to complete within time window may result in job reassignment.",
            "Multiple uncompleted jobs may affect your reliability score and future assignments.",
          ],
        },
        {
          heading: "5. Conduct and Professionalism",
          content: [
            "Maintain professional conduct when interacting with property contacts.",
            "Respect property privacy and security requirements.",
            "Do not solicit direct business arrangements outside the platform.",
            "Report any property access issues immediately through the platform.",
            "Accurately represent property conditions in photos and marking.",
          ],
        },
        {
          heading: "6. Liability and Insurance",
          content: [
            "Agents are independent contractors, not employees of Newcondo.",
            "You are responsible for your own safety during property visits.",
            "Newcondo is not liable for any injuries or accidents during marking activities.",
            "You are responsible for any damage caused to property during marking.",
            "Maintain appropriate insurance coverage for your activities.",
          ],
        },
        {
          heading: "7. Service Quality and Ratings",
          content: [
            "Property owners can rate marking quality and professionalism.",
            "Reliability scores are calculated based on job completion rates and timing.",
            "Consistently poor performance may result in reduced job assignments or suspension.",
            "Disputed markings are reviewed by Newcondo admin for resolution.",
          ],
        },
        {
          heading: "8. Account Suspension",
          content: [
            "Repeated job abandonment may result in temporary or permanent suspension.",
            "Fraudulent marking or misrepresentation will result in immediate account termination.",
            "Violation of professional conduct standards may lead to service restrictions.",
          ],
        },
      ],
    },
    renter: {
      title: "Property Marking Service Terms for Premium Renters",
      sections: [
        {
          heading: "1. Service Overview",
          content: [
            "Premium plan subscribers gain access to property marking job opportunities.",
            "Earn 25% of the marking fee (₦5,000) per successfully completed job.",
            "Virtual account is created automatically upon premium subscription.",
          ],
        },
        {
          heading: "2. Eligibility Requirements",
          content: [
            "Active premium plan subscription required to receive marking jobs.",
            "Must set service area coverage to receive relevant job notifications.",
            "Account must be in good standing with verified contact information.",
          ],
        },
        {
          heading: "3. Marking Responsibilities",
          content: [
            "All agent marking terms and responsibilities apply to premium renters.",
            "Same payment structure: ₦1,000 initial, ₦5,000 upon confirmation.",
            "Subject to 3-hour completion window and queue system.",
            "Required to maintain professional standards and service quality.",
          ],
        },
        {
          heading: "4. Premium Subscription",
          content: [
            "Marking job access is tied to active premium subscription status.",
            "If subscription expires during an assigned job, you must complete that job.",
            "Payment for completed jobs is processed regardless of subscription status.",
            "Renewal required to receive new marking job assignments.",
          ],
        },
        {
          heading: "5. General Terms",
          content: [
            "All liability, conduct, and professionalism terms for agents apply.",
            "Reliability scores affect future job assignments.",
            "Newcondo reserves the right to revoke marking privileges for policy violations.",
          ],
        },
      ],
    },
  };

  const currentTerms = termsContent[userType];

  const TermsContent = () => (
    <div className="space-y-6 text-sm">
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-amber-900">Important Legal Agreement</p>
          <p className="text-amber-800 mt-1">
            Please read these terms carefully. By accepting, you agree to be legally bound by these terms and conditions.
          </p>
        </div>
      </div>

      {currentTerms.sections.map((section, idx) => (
        <div key={idx} className="space-y-3">
          <h3 className="font-semibold text-base">{section.heading}</h3>
          <ul className="space-y-2 text-gray-700">
            {section.content.map((item, itemIdx) => (
              <li key={itemIdx} className="pl-4 relative before:content-['•'] before:absolute before:left-0">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="pt-4 border-t">
        <p className="text-xs text-gray-500">
          Last updated: October 13, 2025 | Version 1.0
        </p>
        <p className="text-xs text-gray-500 mt-2">
          For questions about these terms, contact support@newcondo.ng
        </p>
      </div>
    </div>
  );

  if (showDialog) {
    return (
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms-acceptance"
            checked={accepted}
            onCheckedChange={handleAcceptChange}
          />
          <div className="space-y-1 leading-none">
            <Label
              htmlFor="terms-acceptance"
              className="text-sm font-medium cursor-pointer"
            >
              I accept the Property Marking Service Terms and Conditions
            </Label>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="link" className="h-auto p-0 text-sm">
                  <FileText className="h-3 w-3 mr-1" />
                  Read full terms
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>{currentTerms.title}</DialogTitle>
                  <DialogDescription>
                    Review the complete terms and conditions for the Property Marking Service
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[60vh] pr-4">
                  <TermsContent />
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[500px] w-full rounded-md border p-6">
      <div className="space-y-2 mb-6">
        <h2 className="text-2xl font-bold">{currentTerms.title}</h2>
        <p className="text-sm text-gray-600">Effective Date: October 13, 2025</p>
      </div>
      <TermsContent />
    </ScrollArea>
  );
}