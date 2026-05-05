"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@newcondo/ui/components/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@newcondo/ui/components/form";
import { Textarea } from "@newcondo/ui/components/textarea";
import { RadioGroup, RadioGroupItem } from "@newcondo/ui/components/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Badge } from "@newcondo/ui/components/badge";
import { Separator } from "@newcondo/ui/components/separator";
import { CheckCircle2, XCircle, AlertTriangle, Loader2, MapPin, Clock, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

const verificationSchema = z.object({
  isCorrectProperty: z.enum(["yes", "no"], {
    required_error: "Please confirm if this is your property",
  }),
  verificationNotes: z.string().optional(),
  rejectionReason: z.string().optional(),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface BoundaryCoordinate {
  lat: number;
  lng: number;
}

interface BoundaryData {
  coordinates?: BoundaryCoordinate[];
  area?: number;
  [key: string]: unknown;
}

interface PropertyVerificationFormProps {
  markingJobId?: string;
  propertyDetails: {
    title: string;
    address: string;
    images: string[];
  };
  markingDetails: {
    agentName: string;
    markedAt: string;
    completionImages: string[];
    completionNotes?: string;
    boundaryData?: BoundaryData;
  };
  onVerify: (data: { isApproved: boolean; notes?: string; reason?: string }) => Promise<void>;
  onCancel?: () => void;
}

export function PropertyVerificationForm({
  propertyDetails,
  markingDetails,
  onVerify,
  onCancel,
}: PropertyVerificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      isCorrectProperty: undefined,
      verificationNotes: "",
      rejectionReason: "",
    },
  });

  const isCorrectProperty = form.watch("isCorrectProperty");

  const onSubmit = async (data: VerificationFormData) => {
    setIsSubmitting(true);

    try {
      const isApproved = data.isCorrectProperty === "yes";

      await onVerify({
        isApproved,
        notes: data.verificationNotes,
        reason: isApproved ? undefined : data.rejectionReason,
      });

      toast.success(
        isApproved
          ? "Property verified successfully!"
          : "Marking rejected. A new marking job can be initiated."
      );
    } catch (error) {
      toast.error("Failed to submit verification. Please try again.");
      console.error("Verification error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Property Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Property Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Property Title</p>
            <p className="text-lg font-semibold">{propertyDetails.title}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p className="text-base">{propertyDetails.address}</p>
          </div>
        </CardContent>
      </Card>

      {/* Marking Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Marking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Marked By</p>
              <p className="text-base font-semibold">{markingDetails.agentName}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-muted-foreground">Marked At</p>
              <p className="text-base flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(markingDetails.markedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {markingDetails.completionNotes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Agent Notes</p>
              <Alert>
                <AlertDescription>{markingDetails.completionNotes}</AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completion Images */}
      {markingDetails.completionImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Property Marking Images</CardTitle>
            <CardDescription>
              Review the images captured by the agent during property marking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Image Display */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
              <Image
                src={markingDetails.completionImages[selectedImageIndex]}
                alt={`Marking image ${selectedImageIndex + 1}`}
                fill
                className="object-cover"
                priority
              />
            </div>

            {/* Image Thumbnails */}
            {markingDetails.completionImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {markingDetails.completionImages.map((image, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-md border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-primary ring-2 ring-primary ring-offset-2"
                        : "border-transparent hover:border-muted-foreground"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Image {selectedImageIndex + 1} of {markingDetails.completionImages.length}
              </span>
              <Badge variant="secondary">
                {markingDetails.completionImages.length} images uploaded
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Verification Form */}
      <Card>
        <CardHeader>
          <CardTitle>Verify Property Marking</CardTitle>
          <CardDescription>
            Please confirm if the marked property matches your property. Your verification is
            required to complete this marking job.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Confirmation Question */}
              <FormField
                control={form.control}
                name="isCorrectProperty"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">
                      Is this the correct property?
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent">
                          <RadioGroupItem value="yes" id="yes" />
                          <label
                            htmlFor="yes"
                            className="flex flex-1 cursor-pointer items-center gap-3"
                          >
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                              <p className="font-medium">Yes, this is my property</p>
                              <p className="text-sm text-muted-foreground">
                                The marking is accurate and matches my property
                              </p>
                            </div>
                          </label>
                        </div>

                        <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent">
                          <RadioGroupItem value="no" id="no" />
                          <label
                            htmlFor="no"
                            className="flex flex-1 cursor-pointer items-center gap-3"
                          >
                            <XCircle className="h-5 w-5 text-red-600" />
                            <div>
                              <p className="font-medium">No, this is not my property</p>
                              <p className="text-sm text-muted-foreground">
                                The marked property is incorrect or doesn&apos;t match
                              </p>
                            </div>
                          </label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Additional Notes (Always visible) */}
              <FormField
                control={form.control}
                name="verificationNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional comments or observations..."
                        className="min-h-[100px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Share any feedback about the marking process or property details
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rejection Reason (Only if "No" is selected) */}
              {isCorrectProperty === "no" && (
                <FormField
                  control={form.control}
                  name="rejectionReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-red-600">
                        Reason for Rejection <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please explain why this marking is incorrect..."
                          className="min-h-[120px] resize-none border-red-200 focus-visible:ring-red-500"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-red-600">
                        This information will help the agent understand the issue
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Warning Alert for Rejection */}
              {isCorrectProperty === "no" && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Rejecting this marking will require you to
                    initiate a new marking job and pay the marking fee again. The agent will
                    receive partial compensation for their effort.
                  </AlertDescription>
                </Alert>
              )}

              {/* Info Alert for Approval */}
              {isCorrectProperty === "yes" && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    Once verified, the full marking fee will be released to the agent, and your
                    property will be ready for listing.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || !isCorrectProperty}
            className="ml-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : isCorrectProperty === "yes" ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Verify & Approve
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Reject Marking
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}