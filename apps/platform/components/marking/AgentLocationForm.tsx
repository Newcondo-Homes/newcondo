// apps/platform/components/marking/AgentLocationForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@newcondo/ui/components/card";
import { Button } from "@newcondo/ui/components/button";
import { Label } from "@newcondo/ui/components/label";
import { Switch } from "@newcondo/ui/components/switch";
import { MapPin, AlertCircle, CheckCircle } from "lucide-react";
import { ServiceAreaSelector } from "./ServiceAreaSelector";

const locationSchema = z.object({
  isAvailableForMarking: z.boolean(),
  serviceAreas: z.array(z.string()).min(1, "Please select at least one service area"),
});

type LocationFormData = z.infer<typeof locationSchema>;

interface AgentLocationFormProps {
  onSubmit: (data: LocationFormData) => Promise<void>;
  defaultValues?: Partial<LocationFormData>;
  isSubmitting?: boolean;
}

export function AgentLocationForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: AgentLocationFormProps) {
  const [isAvailable, setIsAvailable] = useState(
    defaultValues?.isAvailableForMarking ?? false
  );

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      isAvailableForMarking: defaultValues?.isAvailableForMarking ?? false,
      serviceAreas: defaultValues?.serviceAreas ?? [],
    },
  });

  const serviceAreas = watch("serviceAreas");

  const handleAvailabilityChange = (checked: boolean) => {
    setIsAvailable(checked);
    setValue("isAvailableForMarking", checked);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Marking Job Availability
          </CardTitle>
          <CardDescription>
            Configure your availability to receive marking job notifications
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Availability Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="availability" className="text-base font-semibold">
                Available for Marking Jobs
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications for new marking opportunities
              </p>
            </div>
            <Switch
              id="availability"
              checked={isAvailable}
              onCheckedChange={handleAvailabilityChange}
            />
          </div>

          {/* Service Areas */}
          {isAvailable && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Service Areas</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Select the areas where you&apos;re willing to accept marking jobs
                </p>
              </div>

              <ServiceAreaSelector
                selectedAreas={serviceAreas}
                onAreasChange={(areas) => setValue("serviceAreas", areas)}
              />

              {errors.serviceAreas && (
                <p className="text-sm text-red-600">{errors.serviceAreas.message}</p>
              )}
            </div>
          )}

          {/* Info Cards */}
          {isAvailable ? (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="text-sm space-y-2">
                    <p className="font-semibold text-green-900">You&apos;re Available!</p>
                    <ul className="list-disc list-inside space-y-1 text-green-800">
                      <li>You&apos;ll receive notifications for jobs in your service areas</li>
                      <li>Earn up to ₦5,000 per completed marking job</li>
                      <li>First-come-first-served queue system</li>
                      <li>3-hour time slot per job assignment</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-900">
                      Currently Unavailable
                    </p>
                    <p className="text-yellow-800 mt-1">
                      Toggle availability ON to start receiving marking job notifications
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* How it Works */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-sm space-y-3">
                <p className="font-semibold text-blue-900">How Marking Jobs Work</p>
                <ol className="list-decimal list-inside space-y-2 text-blue-800">
                  <li>Property owner requests marking in your service area</li>
                  <li>You receive instant notification (email/SMS/in-app)</li>
                  <li>Accept job to join the queue (first-come-first-served)</li>
                  <li>Get 3-hour time slot when it&apos;s your turn</li>
                  <li>Visit property, mark boundaries, upload photos</li>
                  <li>Receive ₦1,000 initial payment immediately</li>
                  <li>Get remaining ₦4,000 after owner confirmation</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting || (isAvailable && serviceAreas.length === 0)}
          >
            {isSubmitting ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}