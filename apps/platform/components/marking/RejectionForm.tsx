// apps/platform/components/marking/RejectionForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@newcondo/ui/card";
import { Button } from "@newcondo/ui/button";
import { Textarea } from "@newcondo/ui/textarea";
import { Label } from "@newcondo/ui/label";
import { RadioGroup, RadioGroupItem } from "@newcondo/ui/radio-group";
import { AlertTriangle, X } from "lucide-react";

const rejectionSchema = z.object({
  reason: z.enum([
    "incorrect_boundary",
    "poor_photo_quality",
    "wrong_property",
    "incomplete_marking",
    "other",
  ]),
  details: z.string().min(20, "Please provide detailed explanation (minimum 20 characters)"),
});

type RejectionFormData = z.infer<typeof rejectionSchema>;

interface RejectionFormProps {
  onSubmit: (reason: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const rejectionReasons = [
  {
    value: "incorrect_boundary",
    label: "Incorrect Property Boundaries",
    description: "The marked boundaries don't match the actual property",
  },
  {
    value: "poor_photo_quality",
    label: "Poor Photo Quality",
    description: "Photos are blurry, dark, or don't show the property clearly",
  },
  {
    value: "wrong_property",
    label: "Wrong Property Marked",
    description: "The agent marked a different property",
  },
  {
    value: "incomplete_marking",
    label: "Incomplete Marking",
    description: "Missing photos, boundaries, or important details",
  },
  {
    value: "other",
    label: "Other Reason",
    description: "Please provide detailed explanation below",
  },
];

export function RejectionForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: RejectionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RejectionFormData>({
    resolver: zodResolver(rejectionSchema),
  });

  const selectedReason = watch("reason");

  const handleFormSubmit = async (data: RejectionFormData) => {
    const reason = rejectionReasons.find((r) => r.value === data.reason);
    const fullReason = `${reason?.label}: ${data.details}`;
    await onSubmit(fullReason);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Card className="border-red-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Reject Marking Job
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Warning */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div className="text-sm space-y-2">
                  <p className="font-semibold text-red-900">Before Rejecting</p>
                  <ul className="list-disc list-inside space-y-1 text-red-800">
                    <li>The agent will not receive the remaining payment</li>
                    <li>You'll need to request a new marking job</li>
                    <li>Additional fees may apply for the new marking</li>
                    <li>Please provide detailed reasons for rejection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reason Selection */}
          <div className="space-y-3">
            <Label>Reason for Rejection *</Label>
            <RadioGroup
              value={selectedReason}
              onValueChange={(value) => setValue("reason", value as any)}
            >
              {rejectionReasons.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-3 space-y-0">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label
                    htmlFor={reason.value}
                    className="font-normal cursor-pointer flex-1"
                  >
                    <p className="font-semibold">{reason.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {reason.description}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {errors.reason && (
              <p className="text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          {/* Detailed Explanation */}
          <div className="space-y-2">
            <Label htmlFor="details">
              Detailed Explanation *
            </Label>
            <Textarea
              id="details"
              placeholder="Please provide specific details about why you're rejecting this marking. Be as detailed as possible to help us improve the service..."
              rows={6}
              {...register("details")}
              className={errors.details ? "border-red-500" : ""}
            />
            {errors.details && (
              <p className="text-sm text-red-600">{errors.details.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minimum 20 characters required
            </p>
          </div>

          {/* Next Steps Info */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-sm space-y-2">
                <p className="font-semibold text-yellow-900">What Happens Next?</p>
                <ol className="list-decimal list-inside space-y-1 text-yellow-800">
                  <li>Your rejection will be reviewed by our team</li>
                  <li>The agent will be notified of the rejection</li>
                  <li>You can request a new marking job</li>
                  <li>If valid, the marking fee will be refunded or credited</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </CardContent>

        <CardFooter className="flex gap-3 border-t">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="destructive"
            className="flex-1"
            disabled={isSubmitting || !selectedReason}
          >
            {isSubmitting ? "Submitting..." : "Submit Rejection"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}