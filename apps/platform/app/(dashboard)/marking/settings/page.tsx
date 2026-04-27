import { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from '@newcondo/auth';
import { prisma } from '@newcondo/db';
import AgentAvailabilityToggle from '@/components/marking/AgentAvailabilityToggle';
import MarkingServiceTerms from '@/components/marking/MarkingServiceTerms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Skeleton } from '@newcondo/ui';
import { Separator } from '@newcondo/ui';
import { useAuth } from '@/hooks/useAuth';
export const metadata: Metadata = {
  title: 'Marking Service Settings | Newcondo',
  description: 'Configure your property marking service preferences',
};

export default async function MarkingSettingsPage() {

  const session = await getServerSession();

  const { user } = useAuth();

  if (!session?.user?.id) redirect('/login');

  if (!user) redirect('/login');

  // Derive userType for MarkingServiceTerms
  const userType: 'property_owner' | 'agent' | 'renter' =
    user.role === 'OWNER' ? 'property_owner'
      : user.role === 'AGENT' ? 'agent'
        : 'renter';

  // Only AGENT, OWNER, or premium RENTERs should access this page
  const canAccessMarking =
    user.role === 'AGENT' ||
    user.role === 'OWNER' ||
    (user.role === 'RENTER' && user.isPremium);

  if (!canAccessMarking) redirect('/dashboard');

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
            userId={user.id}
            initialAvailability={user.isAvailableForMarking}
            serviceAreas={user.agentServiceAreas}
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
          <MarkingServiceTerms userType={userType} showDialog />
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