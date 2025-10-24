// apps/platform/components/marking/ConfirmationInterface.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@newcondo/ui/card";
import { Button } from "@newcondo/ui/button";
import { Badge } from "@newcondo/ui/badge";
import { Separator } from "@newcondo/ui/separator";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  MapPin,
  DollarSign,
  User
} from "lucide-react";
import { ConfirmationTimer } from "./ConfirmationTimer";
import { ConfirmationPhotos } from "./ConfirmationPhotos";
import { RejectionForm } from "./RejectionForm";

interface ConfirmationInterfaceProps {
  job: {
    id: string;
    property: {
      title: string;
      address: string;
      city: string;
      state: string;
    };
    assignedAgent: {
      name: string;
      phone: string;
      reliabilityScore?: number;
    };
    completedAt: string;
    confirmationDeadline: string;
    completionNotes: string;
    completionImages: string[];
    boundaryData: any;
    markingFee: number;
  };
  onConfirm: () => Promise<void>;
  onReject: (reason: string) => Promise<void>;
  isProcessing?: boolean;
}

export function ConfirmationInterface({
  job,
  onConfirm,
  onReject,
  isProcessing = false,
}: ConfirmationInterfaceProps) {
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [step, setStep] = useState<"review" | "confirm">("review");

  const agentPayment = job.markingFee * 0.25; // 25% to agent
  const initialPayment = 1000; // Initial payment already sent
  const remainingPayment = agentPayment - initialPayment;

  const handleConfirm = async () => {
    if (step === "review") {
      setStep("confirm");
      return;
    }
    await onConfirm();
  };

  const handleReject = async (reason: string) => {
    await onReject(reason);
    setShowRejectionForm(false);
  };

  if (showRejectionForm) {
    return (
      <RejectionForm
        onSubmit={handleReject}
        onCancel={() => setShowRejectionForm(false)}
        isSubmitting={isProcessing}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Timer Alert */}
      <Card className="border-yellow-500">
        <CardContent className="pt-6">
          <ConfirmationTimer deadline={job.confirmationDeadline} />
        </CardContent>
      </Card>

      {/* Job Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Review Completed Marking Job</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Property</p>
            <p className="font-semibold text-lg">{job.property.title}</p>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3 w-3" />
              <span>{job.property.address}, {job.property.city}</span>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Agent</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{job.assignedAgent.name}</p>
                  {job.assignedAgent.reliabilityScore && (
                    <Badge variant="outline" className="text-xs">
                      {job.assignedAgent.reliabilityScore.toFixed(1)} ⭐
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="font-medium">
                {new Date(job.completedAt).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completion Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Property Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <ConfirmationPhotos photos={job.completionImages} />
        </CardContent>
      </Card>

      {/* Boundary Map */}
      {job.boundaryData && (
        <Card>
          <CardHeader>
            <CardTitle>Marked Boundaries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">Map view of marked boundaries</p>
              {/* Integration with Google Maps component showing boundary */}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Boundary Points</span>
                <span className="font-medium">
                  {job.boundaryData.coordinates?.length || 0} points
                </span>
              </div>
              {job.boundaryData.area && (
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Approximate Area</span>
                  <span className="font-medium">
                    {job.boundaryData.area.toFixed(2)} m²
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Agent's Completion Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{job.completionNotes}</p>
        </CardContent>
      </Card>

      {/* Payment Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Payment Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Marking Fee</span>
            <span className="font-semibold">₦{job.markingFee.toLocaleString()}</span>
          </div>
          
          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Agent Payment (25%)</span>
              <span className="font-medium">₦{agentPayment.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-green-600">
              <span>• Initial Payment (Already Sent)</span>
              <span>₦{initialPayment.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-yellow-600">
              <span>• Remaining Payment (After Confirmation)</span>
              <span>₦{remainingPayment.toLocaleString()}</span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Platform Fee (75%)</span>
            <span className="font-medium">
              ₦{(job.markingFee - agentPayment).toLocaleString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Step */}
      {step === "confirm" && (
        <Card className="border-green-500 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-semibold text-green-900">
                  Confirm Marking Job Completion
                </p>
                <p className="text-sm text-green-800">
                  By confirming, you acknowledge that:
                </p>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>The property boundaries are accurately marked</li>
                  <li>The photos clearly show the property</li>
                  <li>The remaining payment of ₦{remainingPayment.toLocaleString()} will be released to the agent</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {step === "review" ? (
          <>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
              onClick={() => setShowRejectionForm(true)}
              disabled={isProcessing}
            >
              <XCircle className="h-5 w-5 mr-2" />
              Reject Marking
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Continue to Confirm
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setStep("review")}
              disabled={isProcessing}
            >
              Back to Review
            </Button>
            <Button
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Confirm & Release Payment
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-yellow-900">Important Notice</p>
              <p className="text-yellow-800">
                If you don't confirm or reject within the deadline, a small compensation 
                will be automatically paid to the agent, and you'll need to request a new 
                marking job.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}