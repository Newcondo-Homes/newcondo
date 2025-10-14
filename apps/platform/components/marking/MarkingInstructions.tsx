'use client';

import { CheckCircle2, MapPin, Camera, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MarkingInstructionsProps {
  markingType: 'self' | 'assigned' | 'known_person';
  propertyAddress?: string;
  contactPerson?: {
    name: string;
    phone: string;
  };
  timeSlot?: {
    start: Date;
    end: Date;
  };
}

export default function MarkingInstructions({
  markingType,
  propertyAddress,
  contactPerson,
  timeSlot,
}: MarkingInstructionsProps) {
  const getSelfMarkingSteps = () => [
    {
      icon: MapPin,
      title: 'Arrive at Property Location',
      description: 'Ensure you are physically present at the property you want to mark.',
    },
    {
      icon: Clock,
      title: 'Enable Location Services',
      description: 'Your device GPS must be enabled for accurate property marking.',
    },
    {
      icon: MapPin,
      title: 'View Satellite Map',
      description: 'The map will auto-zoom to your current location showing satellite view.',
    },
    {
      icon: Camera,
      title: 'Draw Property Boundary',
      description: 'Draw a box/polygon around your property on the satellite map to mark boundaries.',
    },
    {
      icon: CheckCircle2,
      title: 'Capture Property Photos',
      description: 'Take clear photos of key areas: entrance, living room, bedrooms, kitchen, and bathrooms.',
    },
    {
      icon: CheckCircle2,
      title: 'Submit Marking',
      description: 'Review and submit your property marking for verification.',
    },
  ];

  const getAgentMarkingSteps = () => [
    {
      icon: Clock,
      title: 'Time Window',
      description: timeSlot
        ? `Complete marking between ${new Date(timeSlot.start).toLocaleTimeString()} - ${new Date(timeSlot.end).toLocaleTimeString()}`
        : 'You have 3 hours from assignment to complete this job.',
    },
    {
      icon: MapPin,
      title: 'Navigate to Property',
      description: propertyAddress || 'Use the provided address to locate the property.',
    },
    {
      icon: AlertCircle,
      title: 'Contact Guide Person',
      description: contactPerson
        ? `Contact ${contactPerson.name} at ${contactPerson.phone} for property access.`
        : 'Contact the property owner or guide for access.',
    },
    {
      icon: Camera,
      title: 'Verify Property Identity',
      description: 'Use provided images to confirm you are at the correct property.',
    },
    {
      icon: MapPin,
      title: 'Mark Property Boundaries',
      description: 'Enable GPS and draw boundaries on the satellite map when you arrive.',
    },
    {
      icon: Camera,
      title: 'Capture Interior Photos',
      description: 'Take clear photos of entrance, living areas, bedrooms, kitchen, and bathrooms.',
    },
    {
      icon: CheckCircle2,
      title: 'Submit for Confirmation',
      description: 'Submit marking. Owner has 2-3 days to confirm. Partial payment released on submission.',
    },
  ];

  const getKnownPersonSteps = () => [
    {
      icon: AlertCircle,
      title: 'Share Marking Link',
      description: 'Send the unique marking link to your trusted person.',
    },
    {
      icon: MapPin,
      title: 'Person Arrives at Property',
      description: 'They must be physically present at the property location.',
    },
    {
      icon: Clock,
      title: 'Open Marking Link',
      description: 'They should open the link when they arrive at the property.',
    },
    {
      icon: MapPin,
      title: 'Follow Marking Process',
      description: 'They will be guided through boundary marking and photo capture.',
    },
    {
      icon: CheckCircle2,
      title: 'You Confirm Marking',
      description: 'Review the marking and photos submitted by your person and confirm.',
    },
  ];

  const steps =
    markingType === 'self'
      ? getSelfMarkingSteps()
      : markingType === 'assigned'
      ? getAgentMarkingSteps()
      : getKnownPersonSteps();

  const getTitle = () => {
    switch (markingType) {
      case 'self':
        return 'How to Mark Your Property';
      case 'assigned':
        return 'Agent Marking Instructions';
      case 'known_person':
        return 'Marking via Known Person';
      default:
        return 'Property Marking Instructions';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{getTitle()}</CardTitle>
        <CardDescription>
          {markingType === 'self' && 'Follow these steps to mark your property yourself'}
          {markingType === 'assigned' && 'Complete this marking job within the allocated time'}
          {markingType === 'known_person' && 'Share the link and guide your person through marking'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {markingType === 'assigned' && timeSlot && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              <strong>Time Remaining:</strong> Complete within{' '}
              {Math.ceil((new Date(timeSlot.end).getTime() - Date.now()) / (1000 * 60))} minutes
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="font-medium text-sm mb-1">
                    {index + 1}. {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {markingType === 'assigned' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> If you cannot complete within the time window, the job will be
              reassigned to the next agent in queue. Partial compensation (₦1,000) is provided on submission.
            </AlertDescription>
          </Alert>
        )}

        {markingType === 'self' && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> You must be physically present at the property location. GPS verification
              is required and marking from a different location will be rejected.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}





// "use client";

// import React from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
// import { AlertCircle, Camera, CheckCircle, Clock, MapPin, Phone, Upload } from 'lucide-react';
// import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui';

// interface MarkingInstructionsProps {
//   isAgent?: boolean;
//   contactPerson?: {
//     name: string;
//     phone: string;
//   };
//   propertyAddress?: string;
//   accessInstructions?: string;
//   timeSlotExpiry?: Date;
//   hasProvidedImages?: boolean;
// }

// export const MarkingInstructions: React.FC<MarkingInstructionsProps> = ({
//   isAgent = false,
//   contactPerson,
//   propertyAddress,
//   accessInstructions,
//   timeSlotExpiry,
//   hasProvidedImages = false,
// }) => {
//   const steps = isAgent ? agentSteps : ownerSteps;

//   return (
//     <div className="space-y-6">
//       {/* Time Warning for Agents */}
//       {isAgent && timeSlotExpiry && (
//         <Alert variant="destructive">
//           <Clock className="h-4 w-4" />
//           <AlertTitle>Time Window Active</AlertTitle>
//           <AlertDescription>
//             You have until {new Date(timeSlotExpiry).toLocaleString()} to complete this marking job.
//             Please ensure you mark the property within this 3-hour window.
//           </AlertDescription>
//         </Alert>
//       )}

//       {/* Contact Information for Agents */}
//       {isAgent && contactPerson && (
//         <Card>
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Phone className="h-5 w-5" />
//               Contact Information
//             </CardTitle>
//             <CardDescription>
//               Reach out to this person for property access
//             </CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-2">
//             <div>
//               <span className="font-semibold">Name:</span> {contactPerson.name}
//             </div>
//             <div>
//               <span className="font-semibold">Phone:</span>{' '}
//               <a href={`tel:${contactPerson.phone}`} className="text-blue-600 hover:underline">
//                 {contactPerson.phone}
//               </a>
//             </div>
//             {propertyAddress && (
//               <div>
//                 <span className="font-semibold">Address:</span> {propertyAddress}
//               </div>
//             )}
//             {accessInstructions && (
//               <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
//                 <span className="font-semibold">Access Instructions:</span>
//                 <p className="mt-1 text-sm">{accessInstructions}</p>
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       {/* Image Availability Notice for Agents */}
//       {isAgent && (
//         <Alert variant={hasProvidedImages ? 'default' : 'destructive'}>
//           <Camera className="h-4 w-4" />
//           <AlertTitle>Property Images</AlertTitle>
//           <AlertDescription>
//             {hasProvidedImages
//               ? 'The property owner has provided reference images. Use them to identify the building.'
//               : 'The property owner has not provided images. Use the contact person and address to locate the property.'}
//           </AlertDescription>
//         </Alert>
//       )}

//       {/* Main Instructions */}
//       <Card>
//         <CardHeader>
//           <CardTitle>
//             {isAgent ? 'Agent Marking Instructions' : 'Property Marking Instructions'}
//           </CardTitle>
//           <CardDescription>
//             Follow these steps carefully to complete the marking process
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <div className="space-y-6">
//             {steps.map((step, index) => (
//               <div key={index} className="flex gap-4">
//                 <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
//                   {index + 1}
//                 </div>
//                 <div className="flex-1">
//                   <h3 className="font-semibold text-lg flex items-center gap-2 mb-2">
//                     {step.icon}
//                     {step.title}
//                   </h3>
//                   <p className="text-muted-foreground mb-3">{step.description}</p>
//                   {step.tips && step.tips.length > 0 && (
//                     <ul className="space-y-1 text-sm">
//                       {step.tips.map((tip, tipIndex) => (
//                         <li key={tipIndex} className="flex items-start gap-2">
//                           <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
//                           <span>{tip}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </CardContent>
//       </Card>

//       {/* Important Notes */}
//       <Alert>
//         <AlertCircle className="h-4 w-4" />
//         <AlertTitle>Important Notes</AlertTitle>
//         <AlertDescription>
//           <ul className="list-disc list-inside space-y-1 mt-2">
//             <li>Ensure accurate boundary marking to prevent disputes</li>
//             <li>Take clear photos of all key areas of the property</li>
//             {isAgent && <li>Complete the marking within the 3-hour time window</li>}
//             {!isAgent && <li>Verify the marking within 2-3 days of completion</li>}
//             <li>Contact support if you encounter any issues</li>
//           </ul>
//         </AlertDescription>
//       </Alert>
//     </div>
//   );
// };

// // Owner Steps
// const ownerSteps = [
//   {
//     title: 'Position Yourself at the Property',
//     description: 'Go to the physical location of your property. Your GPS coordinates will be automatically detected.',
//     icon: <MapPin className="h-5 w-5" />,
//     tips: [
//       'Stand near or inside the property for accurate GPS positioning',
//       'Ensure your device location services are enabled',
//       'Wait for the map to auto-zoom to your location',
//     ],
//   },
//   {
//     title: 'Switch to Satellite View',
//     description: 'The map will automatically switch to satellite view, showing aerial imagery of your property.',
//     icon: <Camera className="h-5 w-5" />,
//     tips: [
//       'Identify your property building from the aerial view',
//       'Look for distinctive features like roof shape or surrounding structures',
//       'Zoom in if needed for better visibility',
//     ],
//   },
//   {
//     title: 'Draw Property Boundary',
//     description: 'Use the drawing tool to create a mask that covers your entire property.',
//     icon: <MapPin className="h-5 w-5" />,
//     tips: [
//       'Click to start drawing, then click at each corner of your property',
//       'Double-click or click the starting point to complete the boundary',
//       'The boundary should include the building and any associated land',
//       'Keep the boundary tight to your property to avoid overlaps',
//     ],
//   },
//   {
//     title: 'Upload Property Photos',
//     description: 'Take or upload clear photos of key areas of your property.',
//     icon: <Upload className="h-5 w-5" />,
//     tips: [
//       'Capture the front entrance, living areas, bedrooms, bathroom, and kitchen',
//       'Use good lighting for clear, high-quality images',
//       'Include unique features that distinguish your property',
//       'Upload at least 5-10 photos for comprehensive coverage',
//     ],
//   },
//   {
//     title: 'Review and Submit',
//     description: 'Review all information and submit for verification. Your property will be saved with its unique boundary.',
//     icon: <CheckCircle className="h-5 w-5" />,
//     tips: [
//       'Double-check the boundary accuracy',
//       'Ensure all required photos are uploaded',
//       'Review contact information for accuracy',
//       'Submit when ready for admin approval',
//     ],
//   },
// ];

// // Agent Steps
// const agentSteps = [
//   {
//     title: 'Contact the Property Guide',
//     description: 'Call the contact person provided to arrange access and get directions to the property.',
//     icon: <Phone className="h-5 w-5" />,
//     tips: [
//       'Introduce yourself as a Newcondo marking agent',
//       'Confirm the best time to visit within your 3-hour window',
//       'Ask for any specific access instructions',
//       'Note any landmarks to help locate the property',
//     ],
//   },
//   {
//     title: 'Locate the Property',
//     description: 'Travel to the property using the provided address and reference images (if available).',
//     icon: <MapPin className="h-5 w-5" />,
//     tips: [
//       'Use the address and contact person to find the property',
//       'Compare the building with reference images if provided',
//       'Verify you are at the correct location before proceeding',
//       'Contact the guide if you have trouble locating the property',
//     ],
//   },
//   {
//     title: 'Mark Property Boundary',
//     description: 'At the property location, use the satellite view to draw an accurate boundary mask.',
//     icon: <Camera className="h-5 w-5" />,
//     tips: [
//       'Ensure you are physically at or very near the property',
//       'The map will auto-zoom to your GPS location',
//       'Draw the boundary carefully to match the actual property',
//       'Include only the property area, avoid neighboring properties',
//     ],
//   },
//   {
//     title: 'Photograph Key Areas',
//     description: 'Take comprehensive photos of the property interior and exterior.',
//     icon: <Upload className="h-5 w-5" />,
//     tips: [
//       'Capture front entrance, living room, all bedrooms, bathroom, and kitchen',
//       'Take exterior shots showing the building facade',
//       'Include any unique features or amenities',
//       'Ensure photos are clear, well-lit, and in focus',
//       'Upload at least 8-12 photos for verification',
//     ],
//   },
//   {
//     title: 'Submit for Owner Verification',
//     description: 'Submit the completed marking. The property owner will verify within 2-3 days.',
//     icon: <CheckCircle className="h-5 w-5" />,
//     tips: [
//       'Review all photos before submitting',
//       'Ensure the boundary is accurate',
//       'Add any relevant notes about the property',
//       'Wait for owner confirmation to receive full payment',
//     ],
//   },
// ];