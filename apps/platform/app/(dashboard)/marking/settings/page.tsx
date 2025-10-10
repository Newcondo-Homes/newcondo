import { Metadata } from 'next';
import { Suspense } from 'react';
import { AgentAvailabilityToggle } from '@/components/marking/AgentAvailabilityToggle';
import { MarkingServiceTerms } from '@/components/marking/MarkingServiceTerms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Skeleton } from '@newcondo/ui';
import { Separator } from '@newcondo/ui';

export const metadata: Metadata = {
  title: 'Marking Service Settings | Newcondo',
  description: 'Configure your property marking service preferences',
};

export default function MarkingSettingsPage() {
  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Marking Service Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your property marking service preferences and availability
        </p>
      </div>

      <Separator />

      {/* Agent Availability Section */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Availability</CardTitle>
          <CardDescription>
            Toggle your availability to accept property marking jobs in your service area
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<AvailabilitySkeleton />}>
            <AgentAvailabilityToggle />
          </Suspense>
        </CardContent>
      </Card>

      {/* Service Areas Section */}
      <Card>
        <CardHeader>
          <CardTitle>Service Areas</CardTitle>
          <CardDescription>
            Manage the locations where you're available to mark properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ServiceAreasSkeleton />}>
            <ServiceAreasManager />
          </Suspense>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Configure how you receive marking job alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<NotificationSkeleton />}>
            <NotificationPreferences />
          </Suspense>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
          <CardDescription>
            Review the property marking service agreement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MarkingServiceTerms />
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder components (to be implemented)
function ServiceAreasManager() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Service area management coming soon</p>
    </div>
  );
}

function NotificationPreferences() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Notification preferences coming soon</p>
    </div>
  );
}

// Loading skeletons
function AvailabilitySkeleton() {
  return (
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-6 w-12" />
    </div>
  );
}

function ServiceAreasSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-48" />
    </div>
  );
}