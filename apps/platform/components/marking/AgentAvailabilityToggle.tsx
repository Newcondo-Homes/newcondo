"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, MapPin, AlertCircle } from "lucide-react";

interface AgentAvailabilityToggleProps {
  userId: string;
  initialAvailability: boolean;
  serviceAreas?: string[];
}

export default function AgentAvailabilityToggle({
  userId,
  initialAvailability,
  serviceAreas = [],
}: AgentAvailabilityToggleProps) {
  const [isAvailable, setIsAvailable] = useState(initialAvailability);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateAvailabilityMutation = useMutation({
    mutationFn: async (available: boolean) => {
      const response = await fetch(`/api/agents/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailableForMarking: available }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update availability");
      }

      return response.json();
    },
    onMutate: async (available) => {
      // Optimistically update UI
      setIsAvailable(available);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agent-profile", userId] });
      toast({
        title: "Availability Updated",
        description: `You are now ${data.isAvailableForMarking ? "available" : "unavailable"} for marking jobs.`,
        variant: "default",
      });
    },
    onError: (error: Error, previousValue) => {
      // Revert optimistic update
      setIsAvailable(!previousValue);
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggle = (checked: boolean) => {
    if (serviceAreas.length === 0 && checked) {
      toast({
        title: "Service Areas Required",
        description: "Please set up your service areas before becoming available for marking jobs.",
        variant: "destructive",
      });
      return;
    }

    updateAvailabilityMutation.mutate(checked);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Marking Job Availability</span>
          <Badge
            variant={isAvailable ? "default" : "secondary"}
            className={isAvailable ? "bg-green-600" : "bg-gray-400"}
          >
            {isAvailable ? (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Available
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Unavailable
              </span>
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          Toggle your availability to receive property marking job assignments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="availability-toggle" className="text-base">
              Available for Marking Jobs
            </Label>
            <p className="text-sm text-gray-500">
              {isAvailable
                ? "You will receive notifications for new marking jobs in your service areas"
                : "You won't receive any marking job assignments"}
            </p>
          </div>
          <Switch
            id="availability-toggle"
            checked={isAvailable}
            onCheckedChange={handleToggle}
            disabled={updateAvailabilityMutation.isPending}
          />
        </div>

        {serviceAreas.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4" />
              Your Service Areas
            </div>
            <div className="flex flex-wrap gap-2">
              {serviceAreas.map((area, index) => (
                <Badge key={index} variant="outline">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-800">
                No Service Areas Set
              </p>
              <p className="text-sm text-yellow-700">
                Add your service areas in your profile settings to start receiving marking job assignments.
              </p>
            </div>
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">How It Works</h4>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>When available, you'll receive notifications for jobs in your service areas</li>
            <li>Jobs are assigned on a first-come, first-served basis</li>
            <li>You'll have a 3-hour window to complete each assigned job</li>
            <li>Earn 25% of the marking fee (₦5,000) per completed job</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}