"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@newcondo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
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
import { RadioGroup, RadioGroupItem } from "@newcondo/ui/components/radio-group";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";

const resolutionSchema = z.object({
  decision: z.enum(["CONFIRMED_DUPLICATE", "NOT_DUPLICATE", "REQUIRES_INVESTIGATION"], {
    required_error: "Please select a resolution decision",
  }),
  action: z.enum(["REMOVE_DUPLICATE", "REMOVE_ORIGINAL", "KEEP_BOTH", "MERGE_LISTINGS"], {
    required_error: "Please select an action",
  }),
  resolution: z.string().min(10, "Resolution notes must be at least 10 characters"),
  notifyOwners: z.boolean().default(true),
  notifyReporter: z.boolean().default(true),
});

type ResolutionFormValues = z.infer<typeof resolutionSchema>;

interface DisputeResolutionFormProps {
  disputeId: string;
  onSubmit: (data: ResolutionFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export default function DisputeResolutionForm({
  disputeId,
  onSubmit,
  isSubmitting = false,
}: DisputeResolutionFormProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const form = useForm<ResolutionFormValues>({
    resolver: zodResolver(resolutionSchema),
    defaultValues: {
      notifyOwners: true,
      notifyReporter: true,
    },
  });

  const decision = form.watch("decision");

  const handleSubmit = async (data: ResolutionFormValues) => {
    setShowConfirmation(true);
    await onSubmit(data);
    setShowConfirmation(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resolve Boundary Dispute</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Decision */}
            <FormField
              control={form.control}
              name="decision"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Decision</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3"
                    >
                      <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="CONFIRMED_DUPLICATE" id="confirmed" />
                        <label htmlFor="confirmed" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="font-medium">Confirmed Duplicate</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            These properties represent the same physical location
                          </p>
                        </label>
                      </div>

                      <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="NOT_DUPLICATE" id="not-duplicate" />
                        <label htmlFor="not-duplicate" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Not a Duplicate</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            These are separate, distinct properties
                          </p>
                        </label>
                      </div>

                      <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                        <RadioGroupItem value="REQUIRES_INVESTIGATION" id="investigate" />
                        <label htmlFor="investigate" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-yellow-600" />
                            <span className="font-medium">Requires Further Investigation</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Need more information or on-site verification
                          </p>
                        </label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action */}
            {decision && decision !== "REQUIRES_INVESTIGATION" && (
              <FormField
                control={form.control}
                name="action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action to Take</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {decision === "CONFIRMED_DUPLICATE" && (
                          <>
                            <SelectItem value="REMOVE_DUPLICATE">
                              Remove Duplicate Listing
                            </SelectItem>
                            <SelectItem value="REMOVE_ORIGINAL">
                              Remove Original Listing
                            </SelectItem>
                            <SelectItem value="MERGE_LISTINGS">
                              Merge Both Listings
                            </SelectItem>
                          </>
                        )}
                        {decision === "NOT_DUPLICATE" && (
                          <SelectItem value="KEEP_BOTH">Keep Both Listings</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {decision === "CONFIRMED_DUPLICATE"
                        ? "Choose which listing to keep or if they should be merged"
                        : "Both properties will remain active"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Resolution Notes */}
            <FormField
              control={form.control}
              name="resolution"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resolution Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide detailed explanation of your decision and any relevant findings..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    These notes will be visible to property owners and will be logged in the system
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notification Options */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm">Notification Settings</h4>
              
              <FormField
                control={form.control}
                name="notifyOwners"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Notify both property owners of the resolution
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyReporter"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">
                      Notify the person who reported this dispute
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {/* Confirmation Alert */}
            {showConfirmation && (
              <Alert>
                <AlertDescription>
                  This action is permanent and will be logged in the system. Property owners will be notified of your decision.
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting Resolution...
                  </>
                ) : (
                  "Submit Resolution"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Reset
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}