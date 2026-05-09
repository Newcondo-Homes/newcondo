"use client";
// apps/platform/components/payments/ConfirmationForm.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@newcondo/ui/components/button";
import { Textarea } from "@newcondo/ui/components/textarea";
import { Checkbox } from "@newcondo/ui/components/checkbox";
import { Label } from "@newcondo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@newcondo/ui/components/radio-group";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const confirmationSchema = z.object({
  confirmationType: z.enum(["confirm", "dispute"]),
  propertyCondition: z.enum(["as_described", "minor_issues", "major_issues"]).optional(),
  accessGranted: z.boolean().optional(),
  keysReceived: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
  disputeReason: z.string().min(10, "Please provide detailed dispute reason").max(1000).optional(),
  refundRequested: z.boolean().default(false),
});

type ConfirmationFormData = z.infer<typeof confirmationSchema>;

// Explicit union type for propertyCondition to avoid `as any` casts
type PropertyCondition = "as_described" | "minor_issues" | "major_issues";

interface ConfirmationFormProps {
  paymentId?: string;
  propertyTitle: string;
  amount: number;
  currency: string;
  confirmationDeadline: Date;
  onSubmit: (data: ConfirmationFormData) => Promise<void>;
  onCancel?: () => void;
}

export function ConfirmationForm({
  propertyTitle,
  amount,
  currency,
  confirmationDeadline,
  onSubmit,
  onCancel,
}: ConfirmationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fix 1: removed the extra `any` and unused transform generics
  // useForm<TFieldValues> is sufficient — no second/third generic needed here
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ConfirmationFormData>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      confirmationType: "confirm",
      refundRequested: false,
    },
  });

  const confirmationType = watch("confirmationType");
  const isDispute = confirmationType === "dispute";

  const handleFormSubmit = async (data: ConfirmationFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit confirmation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {isDispute
              ? "Your dispute has been submitted. Our team will review it shortly."
              : "Property confirmed! Payment will be released to the property owner."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Property Verification</h3>
        <p className="text-sm text-muted-foreground">
          Confirm that you&apos;ve inspected <strong>{propertyTitle}</strong> and everything is as
          described.
        </p>
        <p className="text-sm text-muted-foreground">
          Amount: <strong>{currency} {amount.toLocaleString()}</strong>
        </p>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Label>What would you like to do?</Label>
        <RadioGroup
          value={confirmationType}
          onValueChange={(value) =>
            setValue("confirmationType", value as "confirm" | "dispute")
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="confirm" id="confirm" />
            <Label htmlFor="confirm" className="font-normal cursor-pointer">
              Confirm - Property is as described and ready to move in
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dispute" id="dispute" />
            <Label htmlFor="dispute" className="font-normal cursor-pointer">
              Dispute - There are issues with the property
            </Label>
          </div>
        </RadioGroup>
      </div>

      {!isDispute ? (
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <Label>Property Condition</Label>
          {/* Fix 2: cast to PropertyCondition union instead of any */}
          <RadioGroup
            value={watch("propertyCondition")}
            onValueChange={(value) =>
              setValue("propertyCondition", value as PropertyCondition)
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="as_described" id="as_described" />
              <Label htmlFor="as_described" className="font-normal cursor-pointer">
                Exactly as described in listing
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="minor_issues" id="minor_issues" />
              <Label htmlFor="minor_issues" className="font-normal cursor-pointer">
                Minor issues but acceptable
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="major_issues" id="major_issues" />
              <Label htmlFor="major_issues" className="font-normal cursor-pointer">
                Major issues present
              </Label>
            </div>
          </RadioGroup>
          {errors.propertyCondition && (
            <p className="text-sm text-destructive">{errors.propertyCondition.message}</p>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="accessGranted"
                checked={watch("accessGranted")}
                onCheckedChange={(checked) => setValue("accessGranted", checked as boolean)}
              />
              <Label htmlFor="accessGranted" className="font-normal cursor-pointer">
                I have been granted access to the property
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="keysReceived"
                checked={watch("keysReceived")}
                onCheckedChange={(checked) => setValue("keysReceived", checked as boolean)}
              />
              <Label htmlFor="keysReceived" className="font-normal cursor-pointer">
                I have received all keys and access cards
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional comments about the property..."
              {...register("notes")}
              rows={3}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Filing a dispute will hold the payment and initiate a review process. Please provide
              detailed information.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="disputeReason">
              Dispute Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="disputeReason"
              placeholder="Please describe the issues with the property in detail..."
              {...register("disputeReason")}
              rows={5}
              className="resize-none"
            />
            {errors.disputeReason && (
              <p className="text-sm text-destructive">{errors.disputeReason.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="refundRequested"
              checked={watch("refundRequested")}
              onCheckedChange={(checked) => setValue("refundRequested", checked as boolean)}
            />
            <Label htmlFor="refundRequested" className="font-normal cursor-pointer">
              I am requesting a full refund (excluding service fees)
            </Label>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: Service fees are non-refundable as per our terms of service.
          </p>
        </div>
      )}

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : isDispute ? (
            "Submit Dispute"
          ) : (
            "Confirm Property"
          )}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Confirmation deadline:{" "}
        {new Date(confirmationDeadline).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </form>
  );
}