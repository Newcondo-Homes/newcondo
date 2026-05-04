// apps/platform/components/legal/MarkingServiceTerms.tsx

"use client";

import { ScrollArea } from "@newcondo/ui/components/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { AlertCircle } from "lucide-react";

interface MarkingServiceTermsProps {
  variant?: "full" | "summary";
  showAlert?: boolean;
}

export function MarkingServiceTerms({
  variant = "full",
  showAlert = true
}: MarkingServiceTermsProps) {
  if (variant === "summary") {
    return (
      <div className="space-y-4">
        {showAlert && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please review and accept the Property Marking Service Terms and Conditions before proceeding.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Key Terms Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <h4 className="font-semibold mb-1">Service Fee</h4>
              <p className="text-muted-foreground">
                Standard marking fee: ₦20,000 per property. Payment is non-refundable once an agent is assigned.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Verification Period</h4>
              <p className="text-muted-foreground">
                You have 2-3 days to verify the marking after completion. Failure to verify will result in automatic approval.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Your Responsibilities</h4>
              <p className="text-muted-foreground">
                Provide accurate property information, ensure property access, and verify ownership documentation.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-1">Liability</h4>
              <p className="text-muted-foreground">
                NewCondo acts as an intermediary. Property owners are responsible for ensuring authorized access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showAlert && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please read these terms carefully. By using the Property Marking Service, you agree to be bound by these terms.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Property Marking Service - Terms and Conditions</CardTitle>
          <p className="text-sm text-muted-foreground">
            Last Updated: October 14, 2025
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-6 text-sm">
              {/* Introduction */}
              <section>
                <h3 className="font-semibold text-base mb-2">1. Introduction and Acceptance</h3>
                <p className="text-muted-foreground mb-2">
                  These Terms and Conditions (&quot;Terms&quot;) govern the use of NewCondo&apos;s Property Marking Service (&quot;Service&quot;).
                  By requesting, providing, or participating in the Property Marking Service, you (&quot;User,&quot; &quot;Property Owner,&quot;
                  &quot;Agent,&quot; or &quot;Marker&quot;) agree to be legally bound by these Terms.
                </p>
                <p className="text-muted-foreground">
                  NewCondo Property Platform Limited (&quot;NewCondo,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates as a technology platform
                  connecting property owners with verified agents and markers for property boundary verification services.
                </p>
              </section>

              {/* Service Description */}
              <section>
                <h3 className="font-semibold text-base mb-2">2. Service Description</h3>
                <p className="text-muted-foreground mb-2">
                  The Property Marking Service enables property owners to:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Mark property boundaries digitally on satellite maps</li>
                  <li>Assign marking tasks to verified NewCondo agents</li>
                  <li>Share marking access with trusted individuals</li>
                  <li>Verify and confirm completed property markings</li>
                  <li>Prevent duplicate property listings through boundary verification</li>
                </ul>
              </section>

              {/* Eligibility */}
              <section>
                <h3 className="font-semibold text-base mb-2">3. Eligibility and Requirements</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">3.1 Property Owners and Agents</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Must be registered users with verified accounts</li>
                      <li>Must provide valid government-issued identification</li>
                      <li>Must provide proof of property ownership or authorized agency</li>
                      <li>Must be at least 18 years of age</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">3.2 Property Markers (Agents/Premium Renters)</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Must have completed identity verification</li>
                      <li>Must accept the Agent Marking Agreement</li>
                      <li>Must have an active virtual account</li>
                      <li>Must maintain good standing on the platform</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Pricing and Payments */}
              <section>
                <h3 className="font-semibold text-base mb-2">4. Pricing and Payment Terms</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">4.1 Service Fees</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li><strong>Agent Marking Fee:</strong> ₦20,000 per property</li>
                      <li><strong>NewCondo Direct Marking:</strong> ₦25,000 per property</li>
                      <li><strong>Self-Marking:</strong> Free (requires property verification)</li>
                      <li><strong>Shared Link Marking:</strong> Free (for designated individuals)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">4.2 Payment Processing</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>All payments are processed through Flutterwave&apos;s secure payment gateway</li>
                      <li>Payments must be completed before marking job assignment</li>
                      <li>A confirmation hold period applies to protect both parties</li>
                      <li>Payment receipts are issued automatically upon successful transaction</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">4.3 Commission Structure</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Markers receive 25% of the marking fee (₦5,000)</li>
                      <li>Initial payment of ₦1,000 released upon marking completion</li>
                      <li>Remaining ₦4,000 released after property owner verification</li>
                      <li>NewCondo retains 75% (₦15,000) as platform and insurance fees</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Marking Process */}
              <section>
                <h3 className="font-semibold text-base mb-2">5. Marking Process and Timeline</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">5.1 Job Assignment</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Jobs are assigned on a first-come, first-served queue basis</li>
                      <li>Agents within reasonable proximity are notified of available jobs</li>
                      <li>Each assigned agent has a 3-hour window to complete marking</li>
                      <li>Failure to complete within the time window results in queue advancement</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">5.2 Verification Period</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Property owners have 2-3 days to verify completed markings</li>
                      <li>Verification includes reviewing boundaries and uploaded photos</li>
                      <li>Owners must approve or request re-marking during this period</li>
                      <li>Automatic approval occurs if no action is taken within the timeframe</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">5.3 Re-marking Requests</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Property owners may request re-marking if dissatisfied</li>
                      <li>Each re-marking request requires a new service fee payment</li>
                      <li>Maximum of 3 re-marking attempts per property</li>
                      <li>Frivolous re-marking requests may result in account review</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Property Owner Responsibilities */}
              <section>
                <h3 className="font-semibold text-base mb-2">6. Property Owner Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Provide accurate property location and address information</li>
                  <li>Ensure legal ownership or authorized representation of the property</li>
                  <li>Provide valid contact information for property access coordination</li>
                  <li>Arrange property access for assigned markers during business hours</li>
                  <li>Respond to verification requests within the specified timeframe</li>
                  <li>Maintain civil and professional communication with markers</li>
                  <li>Report any issues or concerns promptly through official channels</li>
                </ul>
              </section>

              {/* Marker Responsibilities */}
              <section>
                <h3 className="font-semibold text-base mb-2">7. Marker/Agent Responsibilities</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Complete marking jobs within the assigned 3-hour time window</li>
                  <li>Capture clear, well-lit photographs of key property features</li>
                  <li>Draw accurate boundary masks on satellite map views</li>
                  <li>Respect property owner privacy and property boundaries</li>
                  <li>Maintain professional conduct and communication</li>
                  <li>Report access issues or discrepancies immediately</li>
                  <li>Comply with all safety regulations and local laws</li>
                </ul>
              </section>

              {/* Liability and Indemnification */}
              <section>
                <h3 className="font-semibold text-base mb-2">8. Liability and Indemnification</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">8.1 Platform Liability</h4>
                    <p className="text-muted-foreground">
                      NewCondo operates as a technology platform and intermediary service. We do not:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
                      <li>Verify property ownership independently</li>
                      <li>Guarantee accuracy of user-provided information</li>
                      <li>Assume liability for property access disputes</li>
                      <li>Bear responsibility for marker conduct beyond platform scope</li>
                      <li>Guarantee specific marking quality or timing outcomes</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">8.2 User Indemnification</h4>
                    <p className="text-muted-foreground">
                      Users agree to indemnify and hold harmless NewCondo, its officers, employees, and agents from:
                    </p>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
                      <li>Claims arising from false property ownership representation</li>
                      <li>Disputes related to unauthorized property access</li>
                      <li>Damages resulting from inaccurate information provided</li>
                      <li>Third-party claims related to marking activities</li>
                      <li>Violations of these Terms or applicable laws</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">8.3 Limitation of Liability</h4>
                    <p className="text-muted-foreground">
                      NewCondo&apos;s total liability for any claims arising from the Service shall not exceed
                      the amount of fees paid by the user for the specific service in question.
                    </p>
                  </div>
                </div>
              </section>

              {/* Refund Policy */}
              <section>
                <h3 className="font-semibold text-base mb-2">9. Refund and Cancellation Policy</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">9.1 Non-Refundable Circumstances</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Payments after agent assignment</li>
                      <li>Completed marking jobs (even if not verified)</li>
                      <li>User-initiated cancellations after assignment</li>
                      <li>Property access issues caused by property owner</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">9.2 Refundable Circumstances</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Cancellation before agent assignment (80% refund)</li>
                      <li>Technical platform failures preventing service delivery</li>
                      <li>Unavailability of agents in the specified service area</li>
                      <li>Proven misrepresentation by platform or assigned agent</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Data and Privacy */}
              <section>
                <h3 className="font-semibold text-base mb-2">10. Data Protection and Privacy</h3>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Property location data is stored securely and used only for service delivery</li>
                  <li>Contact information is shared only with assigned markers</li>
                  <li>Property photos are used for verification and platform display purposes</li>
                  <li>Users retain ownership of uploaded content and property information</li>
                  <li>Data processing complies with applicable Nigerian data protection laws</li>
                  <li>Users may request data deletion subject to legal retention requirements</li>
                </ul>
              </section>

              {/* Prohibited Activities */}
              <section>
                <h3 className="font-semibold text-base mb-2">11. Prohibited Activities</h3>
                <p className="text-muted-foreground mb-2">Users must not:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Submit false property ownership or authorization information</li>
                  <li>Use the service for properties without legal rights</li>
                  <li>Harass, threaten, or abuse other platform users</li>
                  <li>Manipulate the queue or assignment system</li>
                  <li>Collude with markers to defraud the platform or other users</li>
                  <li>Upload inappropriate, misleading, or copyrighted content</li>
                  <li>Attempt to circumvent payment or verification processes</li>
                  <li>Engage in any illegal activities through the platform</li>
                </ul>
              </section>

              {/* Dispute Resolution */}
              <section>
                <h3 className="font-semibold text-base mb-2">12. Dispute Resolution</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-1">12.1 Internal Resolution</h4>
                    <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                      <li>Users must first attempt resolution through NewCondo support</li>
                      <li>Disputes are reviewed within 5-7 business days</li>
                      <li>Evidence must be provided for all dispute claims</li>
                      <li>NewCondo&apos;s decision in disputes is binding unless otherwise specified</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-1">12.2 Legal Jurisdiction</h4>
                    <p className="text-muted-foreground">
                      These Terms are governed by the laws of the Federal Republic of Nigeria.
                      Any legal disputes shall be subject to the exclusive jurisdiction of Nigerian courts.
                    </p>
                  </div>
                </div>
              </section>

              {/* Account Suspension */}
              <section>
                <h3 className="font-semibold text-base mb-2">13. Account Suspension and Termination</h3>
                <p className="text-muted-foreground mb-2">
                  NewCondo reserves the right to suspend or terminate user accounts for:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Violation of these Terms and Conditions</li>
                  <li>Fraudulent or suspicious activity</li>
                  <li>Repeated complaints from other users</li>
                  <li>Failure to complete verification requirements</li>
                  <li>Abuse of platform features or services</li>
                  <li>Outstanding payment obligations</li>
                </ul>
              </section>

              {/* Modifications */}
              <section>
                <h3 className="font-semibold text-base mb-2">14. Modifications to Terms</h3>
                <p className="text-muted-foreground">
                  NewCondo may modify these Terms at any time. Users will be notified of significant changes
                  via email or platform notification. Continued use of the Service after modifications constitutes
                  acceptance of the updated Terms. Material changes take effect 30 days after notification.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h3 className="font-semibold text-base mb-2">15. Contact Information</h3>
                <p className="text-muted-foreground mb-2">
                  For questions, concerns, or support regarding the Property Marking Service:
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-1 text-muted-foreground">
                  <p><strong>Email:</strong> support@newcondo.ng</p>
                  <p><strong>Phone:</strong> +234 (0) 800 NEWCONDO</p>
                  <p><strong>Address:</strong> NewCondo Property Platform Limited, Lagos, Nigeria</p>
                  <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM WAT</p>
                </div>
              </section>

              {/* Acknowledgment */}
              <section className="border-t pt-4 mt-6">
                <h3 className="font-semibold text-base mb-2">Acknowledgment</h3>
                <p className="text-muted-foreground">
                  By using the Property Marking Service, you acknowledge that you have read, understood,
                  and agree to be bound by these Terms and Conditions. You confirm that you have the legal
                  authority to enter into this agreement and that all information provided is accurate and truthful.
                </p>
              </section>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}