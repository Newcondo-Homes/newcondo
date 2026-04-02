// apps/platform/components/marking/CompletionForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Textarea } from "@newcondo/ui/components/textarea";
import { Label } from "@newcondo/ui/components/label";
import { CheckCircle, AlertCircle, Upload } from "lucide-react";
import { BoundaryUpload } from "./BoundaryUpload";
import { CompletionPhotos } from "./CompletionPhotos";

const completionSchema = z.object({
  completionNotes: z.string().min(20, "Please provide detailed notes (minimum 20 characters)"),
  boundaryData: z.object({
    coordinates: z.array(z.object({
      lat: z.number(),
      lng: z.number(),
    })).min(3, "At least 3 points required for boundary"),
    area: z.number().optional(),
  }),
  photos: z.array(z.object({
    url: z.string(),
    description: z.string(),
    category: z.enum(["exterior", "interior", "boundary", "landmark"]),
  })).min(4, "At least 4 photos required"),
});

type CompletionFormData = z.infer<typeof completionSchema>;

interface CompletionFormProps {
  jobId: string;
  propertyTitle: string;
  onSubmit: (data: CompletionFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function CompletionForm({
  jobId,
  propertyTitle,
  onSubmit,
  isSubmitting = false,
}: CompletionFormProps) {
  const [step, setStep] = useState<"boundary" | "photos" | "notes">("boundary");
  const [boundaryData, setBoundaryData] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompletionFormData>({
    resolver: zodResolver(completionSchema),
  });

  const handleFormSubmit = async (data: CompletionFormData) => {
    const completeData = {
      ...data,
      boundaryData,
      photos,
    };
    await onSubmit(completeData);
  };

  const isStepComplete = (stepName: string) => {
    if (stepName === "boundary") return boundaryData !== null;
    if (stepName === "photos") return photos.length >= 4;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {["boundary", "photos", "notes"].map((stepName, index) => (
              <div key={stepName} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      step === stepName
                        ? "border-primary bg-primary text-white"
                        : isStepComplete(stepName)
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {isStepComplete(stepName) ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className="text-xs mt-2 font-medium capitalize">
                    {stepName}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`h-0.5 flex-1 ${
                      isStepComplete(stepName) ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Property Info */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Marking Job</CardTitle>
          <CardDescription>{propertyTitle}</CardDescription>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Step 1: Boundary Upload */}
        {step === "boundary" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Mark Property Boundaries</CardTitle>
              <CardDescription>
                Draw the property boundaries on the map by marking the corners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BoundaryUpload
                jobId={jobId}
                onBoundaryComplete={(data) => {
                  setBoundaryData(data);
                  setStep("photos");
                }}
                initialData={boundaryData}
              />
            </CardContent>
          </Card>
        )}

        {/* Step 2: Photo Upload */}
        {step === "photos" && (
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Upload Property Photos</CardTitle>
              <CardDescription>
                Upload at least 4 clear photos of the property (exterior, interior, boundaries)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompletionPhotos
                photos={photos}
                onPhotosChange={setPhotos}
                minPhotos={4}
              />
            </CardContent>
            <CardFooter className="border-t flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("boundary")}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => setStep("notes")}
                disabled={photos.length < 4}
              >
                Continue
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Completion Notes */}
        {step === "notes" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Completion Notes</CardTitle>
                <CardDescription>
                  Provide detailed notes about the marking process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="completionNotes">
                    Completion Notes <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="completionNotes"
                    placeholder="Describe the property location, any challenges faced, landmarks nearby, accessibility notes, etc."
                    rows={6}
                    {...register("completionNotes")}
                    className={errors.completionNotes ? "border-red-500" : ""}
                  />
                  {errors.completionNotes && (
                    <p className="text-sm text-red-600">
                      {errors.completionNotes.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Minimum 20 characters required
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Ready to Submit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Boundary Marked</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Photos Uploaded</span>
                  <span className="font-medium">{photos.length} photos</span>
                </div>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm space-y-2">
                    <p className="font-semibold text-yellow-900">
                      Before Submitting
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-800">
                      <li>Double-check that boundaries are accurately marked</li>
                      <li>Ensure all photos are clear and well-lit</li>
                      <li>Verify completion notes are detailed and accurate</li>
                      <li>Initial payment of ₦1,000 will be credited immediately</li>
                      <li>Remaining payment after owner confirmation (2-3 days)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("photos")}
                disabled={isSubmitting}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !boundaryData || photos.length < 4}
                className="flex-1"
              >
                {isSubmitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Completion
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}