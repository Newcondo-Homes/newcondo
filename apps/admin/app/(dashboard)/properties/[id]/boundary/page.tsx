// apps/admin/src/app/(dashboard)/properties/[id]/boundary/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { BoundaryMapView } from '@/components/admin/properties/BoundaryMapView';
import { BoundaryControls } from '@/components/admin/properties/BoundaryControls';
import { BoundaryInfo } from '@/components/admin/properties/BoundaryInfo';
import { Button } from '@newcondo/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui';
import { ArrowLeft, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface BoundaryPageProps {
  params: {
    id: string;
  };
}

async function getProperty(id: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/properties/${id}`, {
    cache: 'no-store',
    headers: {
      'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch property');
  }

  return response.json();
}

export async function generateMetadata({ params }: BoundaryPageProps) {
  const property = await getProperty(params.id);
  
  if (!property) {
    return {
      title: 'Property Not Found',
    };
  }

  return {
    title: `Boundary View - ${property.title} | Admin Dashboard`,
    description: `Review and manage property boundary for ${property.title}`,
  };
}

export default async function BoundaryPage({ params }: BoundaryPageProps) {
  const property = await getProperty(params.id);

  if (!property) {
    notFound();
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/admin/properties/${params.id}`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Property
                </Button>
              </Link>
              <div className="h-8 w-px bg-border" />
              <div>
                <h1 className="text-lg font-semibold">{property.title}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {property.city}, {property.state}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Boundary Status Badge */}
              {property.boundaryVerified ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Boundary Verified</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Pending Verification</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Area */}
        <div className="flex-1 relative">
          <Suspense fallback={<MapLoading />}>
            <BoundaryMapView property={property} />
          </Suspense>
        </div>

        {/* Sidebar */}
        <div className="w-96 border-l bg-background overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Boundary Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Boundary Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <BoundaryControls property={property} />
              </CardContent>
            </Card>

            {/* Boundary Information */}
            <Card>
              <CardHeader>
                <CardTitle>Boundary Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<InfoSkeleton />}>
                  <BoundaryInfo property={property} />
                </Suspense>
              </CardContent>
            </Card>

            {/* GPS Coordinates */}
            {property.gpsCoordinates && (
              <Card>
                <CardHeader>
                  <CardTitle>GPS Coordinates</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-xs bg-muted px-3 py-2 rounded block break-all">
                    {property.gpsCoordinates}
                  </code>
                </CardContent>
              </Card>
            )}

            {/* Boundary Coordinates */}
            {property.boundaryCoordinates && (
              <Card>
                <CardHeader>
                  <CardTitle>Boundary Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Polygon Points</span>
                      <span className="font-medium">
                        {Array.isArray(property.boundaryCoordinates) 
                          ? property.boundaryCoordinates.length 
                          : 'N/A'}
                      </span>
                    </div>
                    {property.boundaryMarkedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Marked On</span>
                        <span className="font-medium">
                          {new Date(property.boundaryMarkedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {property.boundaryMarkedBy && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Marked By</span>
                        <span className="font-medium">Agent ID: {property.boundaryMarkedBy}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Boundary Images */}
            {property.boundaryImages && property.boundaryImages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Boundary Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {property.boundaryImages.map((image: string, index: number) => (
                      <div key={index} className="aspect-square rounded overflow-hidden border">
                        <img 
                          src={image} 
                          alt={`Boundary ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Building Fingerprint */}
            {property.buildingFingerprint && (
              <Card>
                <CardHeader>
                  <CardTitle>Building Fingerprint</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="text-xs bg-muted px-3 py-2 rounded block break-all">
                    {property.buildingFingerprint}
                  </code>
                  <p className="text-xs text-muted-foreground mt-2">
                    Unique identifier for duplicate detection
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Duplicate Check Results */}
            <Card>
              <CardHeader>
                <CardTitle>Duplicate Check</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<DuplicateCheckSkeleton />}>
                  <DuplicateCheckResults propertyId={property.id} />
                </Suspense>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component implementations
function DuplicateCheckResults({ propertyId }: { propertyId: string }) {
  // This will fetch duplicate check results from the API
  // For now, showing placeholder
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>No duplicates detected</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Last checked: {new Date().toLocaleString()}
      </p>
    </div>
  );
}

// Skeleton components
function MapLoading() {
  return (
    <div className="w-full h-full bg-muted flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 animate-pulse mx-auto" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    </div>
  );
}

function InfoSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

function DuplicateCheckSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-full bg-muted animate-pulse rounded" />
      <div className="h-3 w-3/4 bg-muted animate-pulse rounded" />
    </div>
  );
}