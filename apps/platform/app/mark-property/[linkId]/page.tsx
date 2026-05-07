// apps/platform/app/mark-property/[linkId]/page.tsx
import { Metadata } from 'next';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';
import { Skeleton } from '@newcondo/ui';
import { Alert, AlertDescription } from '@newcondo/ui';
import { MapPin, AlertCircle } from 'lucide-react';
import MarkingInstructions from '@/components/marking/MarkingInstructions';
import { MarkPropertySelf } from '@/components/marking/MarkPropertySelf';

interface PageProps {
  params: {
    linkId: string;
  };
}

// generateMetadata doesn't need params — static metadata is sufficient here
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Mark Property | Newcondo',
    description: 'Mark property boundaries for Newcondo listing',
  };
}

export default function MarkPropertyPublicPage({ params }: PageProps) {
  const { linkId } = params;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container max-w-4xl py-12 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Mark Property</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            You&apos;ve been invited to mark a property on Newcondo. Follow the instructions
            below to complete the marking process.
          </p>
        </div>

        {/* Important Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This is a one-time link. Please complete the marking process in one session. Make
            sure you&apos;re at the property location before starting.
          </AlertDescription>
        </Alert>

        {/* Link Validation & Property Details */}
        <Suspense fallback={<PropertyDetailsSkeleton />}>
          <PropertyDetailsCard linkId={linkId} />
        </Suspense>

        {/* Marking Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Marking Instructions</CardTitle>
            <CardDescription>
              Follow these steps to accurately mark the property boundaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MarkingInstructions markingType="known_person" />
          </CardContent>
        </Card>

        {/* Marking Interface */}
        <Suspense fallback={<MarkingInterfaceSkeleton />}>
          <MarkingInterface linkId={linkId} />
        </Suspense>
      </div>
    </div>
  );
}

// PropertyDetailsCard receives linkId for future API use but renders placeholder data for now
async function PropertyDetailsCard({ linkId }: { linkId: string }) {
  // TODO: fetch property details by linkId from the API
  void linkId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
        <CardDescription>
          Information about the property you&apos;re marking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Property Type</p>
            <p className="text-lg font-semibold">Apartment</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Location</p>
            <p className="text-lg font-semibold">Lagos, Nigeria</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
            <p className="text-lg font-semibold">John Doe</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Contact Phone</p>
            <p className="text-lg font-semibold">+234 XXX XXX XXXX</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">Address</p>
          <p className="text-base">123 Example Street, Lekki Phase 1, Lagos</p>
        </div>
      </CardContent>
    </Card>
  );
}

async function MarkingInterface({ linkId }: { linkId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mark Property Boundaries</CardTitle>
        <CardDescription>
          Use the map below to draw the property boundaries accurately
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MarkPropertySelf propertyId={linkId} propertyAddress="" />
      </CardContent>
    </Card>
  );
}

// ─── Loading skeletons ────────────────────────────────────────────────────────

function PropertyDetailsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-32" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

function MarkingInterfaceSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-96 w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}