/// apps/platform/components/marking/MarkingPaymentSummary.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Separator } from "@newcondo/ui/components/separator";
import { Badge } from "@newcondo/ui/components/badge";
import { DollarSign, CheckCircle, AlertCircle, Info } from "lucide-react";

interface MarkingPaymentSummaryProps {
  markingOption: "self" | "someone_i_know" | "newcondo_admin" | "assign_agents";
  markingFee: number;
  agentCommission?: number;
  platformFee?: number;
  onPayment?: () => void;
  isProcessing?: boolean;
}

export function MarkingPaymentSummary({
  markingOption,
  markingFee,
  agentCommission = 5000,
  platformFee = 15000,
  onPayment,
  isProcessing = false,
}: MarkingPaymentSummaryProps) {
  const isFree = markingOption === "self" || markingOption === "someone_i_know";
  const isNewcondoAdmin = markingOption === "newcondo_admin";
  const isAgentAssigned = markingOption === "assign_agents";

  const optionLabels = {
    self: "Self Marking",
    someone_i_know: "Someone I Know",
    newcondo_admin: "Newcondo Admin",
    assign_agents: "Assign to Agents",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Payment Summary
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Marking Option */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Marking Option</span>
          <Badge variant="outline">{optionLabels[markingOption]}</Badge>
        </div>

        <Separator />

        {/* Fee Breakdown */}
        {!isFree && (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Marking Fee</span>
                <span className="font-medium">₦{markingFee.toLocaleString()}</span>
              </div>

              {isAgentAssigned && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Agent Commission (25%)</span>
                    <span className="text-green-600">- ₦{agentCommission.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Platform Fee (75%)</span>
                    <span>₦{platformFee.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-primary">₦{markingFee.toLocaleString()}</span>
            </div>
          </>
        )}

        {isFree && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Free Marking</p>
                <p className="text-sm text-green-700 mt-1">
                  No payment required for this marking option
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Terms */}
        {!isFree && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Payment Terms</p>
                <ul className="space-y-1 text-blue-800">
                  {isAgentAssigned && (
                    <>
                      <li>• Initial payment of ₦1,000 released to agent upon marking</li>
                      <li>• Remaining ₦4,000 released after your confirmation</li>
                      <li>• You have 2-3 days to confirm the marking</li>
                      <li>• Platform fee (₦15,000) retained by Newcondo</li>
                    </>
                  )}
                  {isNewcondoAdmin && (
                    <>
                      <li>• Full payment of ₦25,000 required upfront</li>
                      <li>• Newcondo team will handle marking within 24-48 hours</li>
                      <li>• Payment is non-refundable after marking begins</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Refund Policy */}
        {!isFree && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-900">Refund Policy</p>
                <p className="text-yellow-800 mt-1">
                  If marking is not completed within 3 days, you'll receive a full refund.
                  Confirmed markings are non-refundable.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {!isFree && (
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={onPayment}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing Payment..." : `Pay ₦${markingFee.toLocaleString()}`}
          </Button>
        </CardFooter>
      )}

      {isFree && (
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={onPayment}
            disabled={isProcessing}
          >
            {isProcessing ? "Creating Job..." : "Create Marking Job"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}