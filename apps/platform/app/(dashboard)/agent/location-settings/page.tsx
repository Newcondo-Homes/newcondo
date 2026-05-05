"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueueStore } from "@/store/queueStore";
import { getLocationSettings, updateLocationSettings } from "@/lib/api/queue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Label } from "@newcondo/ui/components/label";
import { Switch } from "@newcondo/ui/components/switch";
import { Alert, AlertDescription } from "@newcondo/ui/components/alert";
import { Badge } from "@newcondo/ui/components/badge";
import { Checkbox } from "@newcondo/ui/components/checkbox";
import {
  ArrowLeft,
  MapPin,
  AlertCircle,
  CheckCircle,
  Navigation,
  Radius,
} from "lucide-react";
import { LoadingSpinner } from "@/components/shared/feedback/LoadingSpinner";
import { Slider } from "@newcondo/ui/components/slider";

// Nigerian States and Cities
const NIGERIAN_LOCATIONS = {
  Lagos: ["Ikeja", "Victoria Island", "Lekki", "Surulere", "Yaba", "Ikoyi"],
  Abuja: ["Garki", "Wuse", "Maitama", "Asokoro", "Gwarinpa"],
  Rivers: ["Port Harcourt", "Obio-Akpor", "Eleme"],
  Oyo: ["Ibadan", "Ogbomoso", "Oyo"],
  Kano: ["Kano Municipal", "Fagge", "Dala"],
};

const locationSchema = z.object({
  isAvailableForMarking: z.boolean(),
  serviceAreas: z.array(z.string()).min(1, "Select at least one service area"),
  maxRadius: z.number().min(5).max(100),
  notificationsEnabled: z.boolean(),
});

type LocationFormData = z.infer<typeof locationSchema>;

export default function AgentLocationSettingsPage() {
  const router = useRouter();
  const { agentLocation, setAgentLocation } = useQueueStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const {
    // fix line 57: 'register' was destructured but never used — removed
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      isAvailableForMarking: agentLocation.isAvailable,
      serviceAreas: agentLocation.serviceAreas,
      maxRadius: agentLocation.maxRadius || 50,
      notificationsEnabled: true,
    },
  });

  const isAvailable = watch("isAvailableForMarking");
  const serviceAreas = watch("serviceAreas");
  const maxRadius = watch("maxRadius");

  // fix line 90: typed the caught error properly instead of `any`
  const fetchLocationSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const settings = await getLocationSettings();

      setValue("isAvailableForMarking", settings.isAvailableForMarking);
      setValue("serviceAreas", settings.serviceAreas || []);
      setValue("maxRadius", settings.maxRadius || 50);
      setValue("notificationsEnabled", settings.notificationsEnabled);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch settings";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setValue]);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error("Error getting location:", err);
        }
      );
    }
  };

  // fix line 79: fetchLocationSettings added to dependency array (now stable via useCallback)
  useEffect(() => {
    fetchLocationSettings();
    getCurrentLocation();
  }, [fetchLocationSettings]);

  const handleAreaToggle = (area: string) => {
    const current = serviceAreas || [];
    if (current.includes(area)) {
      setValue(
        "serviceAreas",
        current.filter((a) => a !== area)
      );
    } else {
      setValue("serviceAreas", [...current, area]);
    }
  };

  // fix line 148: typed the caught error properly instead of `any`
  const onSubmit = async (data: LocationFormData) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(false);

      await updateLocationSettings({
        isAvailableForMarking: data.isAvailableForMarking,
        serviceAreas: data.serviceAreas,
        maxRadius: data.maxRadius,
        notificationsEnabled: data.notificationsEnabled,
        coordinates: currentLocation,
      });

      setAgentLocation({
        isAvailable: data.isAvailableForMarking,
        serviceAreas: data.serviceAreas,
        maxRadius: data.maxRadius,
        coordinates: currentLocation || undefined,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save settings";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.push("/agent/marking-queue")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Queue
        </Button>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Location Settings</h1>
        <p className="text-gray-600">
          Configure your service areas and availability for marking jobs
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Availability Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Availability Status</CardTitle>
            <CardDescription>
              Control whether you receive marking job notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="isAvailableForMarking" className="text-base font-medium">
                  Available for Marking Jobs
                </Label>
                <p className="text-sm text-gray-500">
                  {isAvailable
                    ? "You will receive notifications for new jobs in your service areas"
                    // fix line 334: escaped apostrophe
                    : "You won&apos;t receive any job notifications"}
                </p>
              </div>
              <Switch
                id="isAvailableForMarking"
                checked={isAvailable}
                onCheckedChange={(checked) => setValue("isAvailableForMarking", checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Current Location */}
        <Card>
          <CardHeader>
            <CardTitle>Current Location</CardTitle>
            <CardDescription>
              Your location helps us show you nearby jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentLocation ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Navigation className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Location detected</p>
                  <p className="text-sm text-green-600">
                    Lat: {currentLocation.lat.toFixed(4)}, Lng: {currentLocation.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Location not detected</p>
                  <p className="text-sm text-gray-500">
                    Please enable location services in your browser
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Service Areas</CardTitle>
            <CardDescription>
              Select the areas where you want to receive marking jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(NIGERIAN_LOCATIONS).map(([state, cities]) => (
              <div key={state} className="space-y-3">
                <h4 className="font-semibold text-sm">{state} State</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {cities.map((city) => {
                    const areaKey = `${state}-${city}`;
                    const isSelected = serviceAreas?.includes(areaKey);

                    return (
                      <div
                        key={areaKey}
                        className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => handleAreaToggle(areaKey)}
                      >
                        <Checkbox
                          id={areaKey}
                          checked={isSelected}
                          onCheckedChange={() => handleAreaToggle(areaKey)}
                        />
                        <Label htmlFor={areaKey} className="cursor-pointer text-sm">
                          {city}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {errors.serviceAreas && (
              <p className="text-sm text-red-500">{errors.serviceAreas.message}</p>
            )}

            {serviceAreas && serviceAreas.length > 0 && (
              <div className="pt-4">
                <p className="text-sm text-gray-600 mb-2">Selected areas ({serviceAreas.length}):</p>
                <div className="flex flex-wrap gap-2">
                  {serviceAreas.map((area) => {
                    const [state, city] = area.split("-");
                    return (
                      <Badge key={area} variant="secondary">
                        {city}, {state}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Maximum Radius */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radius className="h-5 w-5" />
              Maximum Travel Distance
            </CardTitle>
            <CardDescription>
              Set the maximum distance you&apos;re willing to travel for jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Maximum Radius</Label>
                <span className="text-2xl font-bold text-blue-600">{maxRadius} km</span>
              </div>

              <Slider
                value={[maxRadius]}
                onValueChange={(value) => setValue("maxRadius", value[0])}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-gray-500">
                <span>5 km</span>
                <span>50 km</span>
                <span>100 km</span>
              </div>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Jobs within {maxRadius} km of your location will be shown to you.
                Adjust this based on your preferred travel distance.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Choose how you want to be notified about new jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notificationsEnabled" className="text-base font-medium">
                  Enable Notifications
                </Label>
                <p className="text-sm text-gray-500">
                  Receive alerts when new marking jobs are available
                </p>
              </div>
              <Switch
                id="notificationsEnabled"
                checked={watch("notificationsEnabled")}
                onCheckedChange={(checked) => setValue("notificationsEnabled", checked)}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You&apos;ll receive notifications via email, SMS, and in-app alerts when new jobs match your preferences.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Impact of Your Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Service Areas</p>
                <p className="text-2xl font-bold">{serviceAreas?.length || 0}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Max Distance</p>
                <p className="text-2xl font-bold">{maxRadius} km</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Status</p>
                <p className="text-lg font-bold">
                  {isAvailable ? (
                    <span className="text-green-600">Available</span>
                  ) : (
                    <span className="text-gray-600">Unavailable</span>
                  )}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-600">Notifications</p>
                <p className="text-lg font-bold">
                  {watch("notificationsEnabled") ? (
                    <span className="text-green-600">Enabled</span>
                  ) : (
                    <span className="text-gray-600">Disabled</span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/agent/marking-queue")}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <LoadingSpinner className="mr-2" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}