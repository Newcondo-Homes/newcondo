"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@newcondo/ui/components/select";
import { Textarea } from "@newcondo/ui/components/textarea";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

const disputeFormSchema = z.object({
  reason: z.enum([
    "PROPERTY_NOT_AS_DESCRIBED",
    "PROPERTY_UNAVAILABLE",
    "SAFETY_CONCERNS",
    "FRAUDULENT_LISTING",
    "WRONG_LOCATION",
    "PROPERTY_CONDITION",
    "OTHER",
  ]),
  description: z
    .string()
    .min(20, "Please provide at least 20 characters")
    .max(1000, "Description must be less than 1000 characters"),
  evidenceUrls: z.array(z.string()).optional(),
});

type DisputeFormValues = z.infer<typeof disputeFormSchema>;

interface DisputeFormProps {
  paymentId: string;
  rentalId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DisputeForm({
  paymentId,
  rentalId,
  onSuccess,
  onCancel,
}: DisputeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DisputeFormValues>({
    resolver: zodResolver(disputeFormSchema),
    defaultValues: {
      reason: "PROPERTY_NOT_AS_DESCRIBED",
      description: "",
      evidenceUrls: [],
    },
  });

  const onSubmit = async (data: DisputeFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/dispute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          rentalId,
          ...data,
          evidenceUrls: uploadedFiles,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit dispute");
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = (url: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file !== url));
  };

  const disputeReasons = [
    { value: "PROPERTY_NOT_AS_DESCRIBED", label: "Property not as described" },
    { value: "PROPERTY_UNAVAILABLE", label: "Property is unavailable" },
    { value: "SAFETY_CONCERNS", label: "Safety concerns" },
    { value: "FRAUDULENT_LISTING", label: "Suspected fraudulent listing" },
    { value: "WRONG_LOCATION", label: "Wrong location" },
    { value: "PROPERTY_CONDITION", label: "Poor property condition" },
    { value: "OTHER", label: "Other reason" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Request Refund</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Please provide details about why you&apos;re requesting a refund. This will
          be reviewed by our team.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Dispute</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {disputeReasons.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Please describe the issue in detail..."
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide as much detail as possible to help us review your
                  dispute (min. 20 characters)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Evidence (Optional)</FormLabel>
            <FormDescription className="mb-3">
              Upload photos or documents that support your dispute
            </FormDescription>

            {/* fix line 202: <img> → <Image /> */}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                {uploadedFiles.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="relative w-full h-32">
                      <Image
                        src={url}
                        alt={`Evidence ${index + 1}`}
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(url)}
                      className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <UploadButton<OurFileRouter, "disputeEvidence">
              endpoint="disputeEvidence"
              onClientUploadComplete={(res) => {
                if (res) {
                  const urls = res.map((file) => file.url);
                  setUploadedFiles((prev) => [...prev, ...urls]);
                }
              }}
              onUploadError={(uploadError: Error) => {
                setError(`Upload failed: ${uploadError.message}`);
              }}
              appearance={{
                button:
                  "bg-primary text-primary-foreground hover:bg-primary/90 text-sm",
                allowedContent: "text-muted-foreground text-xs",
              }}
            />
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Note: The platform service fee is non-refundable. If your dispute
              is approved, you will receive a refund minus the service fee and
              any applicable transaction charges.
            </AlertDescription>
          </Alert>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Dispute
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}