"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@newcondo/ui/components/switch";
import { Label } from "@newcondo/ui/components/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Badge } from "@newcondo/ui/components/badge";
import { toast } from '@newcondo/ui'
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
      toast.success('Availability Updated', {
        description: `You are now ${data.isAvailableForMarking ? "available" : "unavailable"} for marking jobs.`,
      });
    },
    onError: (error: Error, previousValue) => {
      // Revert optimistic update
      setIsAvailable(!previousValue);
      toast.error('Update Failed', {
        description: error.message,
      });
    },
  });

  const handleToggle = (checked: boolean) => {
    if (serviceAreas.length === 0 && checked) {
      toast("Service Areas Required", {
        description: "Please set up your service areas before becoming available for marking jobs.",
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
            <li>When available, you&apos;ll receive notifications for jobs in your service areas</li>
            <li>Jobs are assigned on a first-come, first-served basis</li>
            <li>You&apos;ll have a 3-hour window to complete each assigned job</li>
            <li>Earn 25% of the marking fee (₦5,000) per completed job</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}








// // apps/platform/components/marking/AgentAvailabilityToggle.tsx
// 'use client';

// import { useState, useEffect } from 'react';
// import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// interface AgentAvailabilityToggleProps {
//   isAvailable: boolean;
//   onToggle: (isAvailable: boolean) => Promise<void>;
//   onSuccess?: () => void;
//   onError?: (error: string) => void;
//   disabled?: boolean;
//   compact?: boolean;
//   availableJobsNearby?: number;
// }

// export function AgentAvailabilityToggle({
//   isAvailable,
//   onToggle,
//   onSuccess,
//   onError,
//   disabled = false,
//   compact = false,
//   availableJobsNearby = 0,
// }: AgentAvailabilityToggleProps) {
//   const [isEnabled, setIsEnabled] = useState(isAvailable);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [showConfirmation, setShowConfirmation] = useState(false);

//   useEffect(() => {
//     setIsEnabled(isAvailable);
//   }, [isAvailable]);

//   const handleToggle = async () => {
//     if (!isEnabled) {
//       // Going from available to unavailable - show confirmation
//       setShowConfirmation(true);
//       return;
//     }

//     // Going from unavailable to available
//     await executeToggle(true);
//   };

//   const executeToggle = async (newState: boolean) => {
//     setIsLoading(true);
//     setError(null);
//     setShowConfirmation(false);

//     try {
//       await onToggle(newState);
//       setIsEnabled(newState);
//       onSuccess?.();
//     } catch (err) {
//       const errorMessage = err instanceof Error ? err.message : 'Failed to update availability';
//       setError(errorMessage);
//       onError?.(errorMessage);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   if (compact) {
//     return (
//       <button
//         onClick={handleToggle}
//         disabled={disabled || isLoading}
//         className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${
//           isEnabled
//             ? 'bg-green-100 text-green-700 hover:bg-green-200'
//             : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//         } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
//       >
//         {isLoading ? (
//           <>
//             <Loader2 className="w-4 h-4 animate-spin" />
//             Updating...
//           </>
//         ) : (
//           <>
//             {isEnabled ? (
//               <>
//                 <CheckCircle className="w-4 h-4" />
//                 Available for Jobs
//               </>
//             ) : (
//               <>
//                 <AlertCircle className="w-4 h-4" />
//                 Offline
//               </>
//             )}
//           </>
//         )}
//       </button>
//     );
//   }

//   return (
//     <div className="space-y-4">
//       {error && (
//         <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
//           <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
//           <div>
//             <p className="text-sm font-semibold text-red-900">Error</p>
//             <p className="text-sm text-red-700">{error}</p>
//           </div>
//         </div>
//       )}

//       {showConfirmation && (
//         <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
//           <div className="flex items-start gap-3 mb-4">
//             <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
//             <div>
//               <h3 className="font-semibold text-yellow-900">Going Offline?</h3>
//               <p className="text-sm text-yellow-700 mt-1">
//                 You won't be able to receive new marking job assignments when offline. Your current queue position will be maintained.
//               </p>
//             </div>
//           </div>

//           <div className="flex gap-2">
//             <button
//               onClick={() => executeToggle(false)}
//               disabled={isLoading}
//               className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50"
//             >
//               {isLoading ? 'Setting Offline...' : 'Go Offline'}
//             </button>
//             <button
//               onClick={() => setShowConfirmation(false)}
//               disabled={isLoading}
//               className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
//             >
//               Stay Available
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Main Toggle Section */}
//       <div className={`p-4 rounded-lg border-2 transition-all ${
//         isEnabled
//           ? 'bg-green-50 border-green-300'
//           : 'bg-gray-50 border-gray-300'
//       }`}>
//         <div className="flex items-center justify-between mb-3">
//           <div>
//             <h3 className="text-lg font-bold text-gray-900">Availability Status</h3>
//             <p className={`text-sm ${isEnabled ? 'text-green-700' : 'text-gray-600'}`}>
//               {isEnabled ? 'You are available for marking jobs' : 'You are currently offline'}
//             </p>
//           </div>

//           <button
//             onClick={handleToggle}
//             disabled={disabled || isLoading || showConfirmation}
//             className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
//               isEnabled ? 'bg-green-600' : 'bg-gray-400'
//             } ${disabled || isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
//           >
//             <span
//               className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${
//                 isEnabled ? 'translate-x-7' : 'translate-x-1'
//               }`}
//             />
//           </button>
//         </div>

//         {/* Status Info */}
//         <div className="space-y-2">
//           {isEnabled && availableJobsNearby > 0 && (
//             <div className="flex items-center gap-2 p-2 bg-green-100 rounded">
//               <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
//               <span className="text-sm font-semibold text-green-700">
//                 {availableJobsNearby} marking job{availableJobsNearby !== 1 ? 's' : ''} available nearby
//               </span>
//             </div>
//           )}

//           {isEnabled && (
//             <div className="text-sm text-green-700">
//               <p>✓ You will receive notifications for new marking jobs in your service areas</p>
//               <p>✓ You can be assigned jobs on a first-come, first-served basis</p>
//               <p>✓ You have 3 hours to complete each marking job</p>
//             </div>
//           )}

//           {!isEnabled && (
//             <div className="text-sm text-gray-600">
//               <p>• You won't receive new job assignments</p>
//               <p>• Active jobs will continue as normal</p>
//               <p>• You can go back online anytime</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Service Areas Info */}
//       <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
//         <p className="text-xs text-blue-600 mb-2 font-semibold">SERVICE AREAS</p>
//         <p className="text-sm text-blue-700">
//           You will receive jobs from properties within your registered service areas. Update your service areas in settings to expand your reach.
//         </p>
//       </div>
//     </div>
//   );
// }