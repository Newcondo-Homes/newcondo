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