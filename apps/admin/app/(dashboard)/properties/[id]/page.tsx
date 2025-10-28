// apps/admin/src/app/(dashboard)/properties/[id]/page.tsx
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import { PropertyHeader } from '@/components/admin/properties/PropertyHeader';
import { PropertyDetails } from '@/components/admin/properties/PropertyDetails';
import { PropertyImages } from '@/components/admin/properties/PropertyImages';
import { PropertyBoundary } from '@/components/admin/properties/PropertyBoundary';
import { PropertyDocuments } from '@/components/admin/properties/PropertyDocuments';
import { PropertyActions } from '@/components/admin/properties/PropertyActions';
import { OwnerInformation } from '@/components/admin/properties/OwnerInformation';
import { PropertyUnits } from '@/components/admin/properties/PropertyUnits';
import { PropertyTimeline } from '@/components/admin/properties/PropertyTimeline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@newcondo/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui';
import { Button } from '@newcondo/ui';
import { ArrowLeft, MapPin } from 'lucide-react';

interface PropertyPageProps {
  params: {
    id: string;
  };
}

async function getProperty(id: string) {
  // This will be replaced with actual API call
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

export async function generateMetadata({ params }: PropertyPageProps) {
  const property = await getProperty(params.id);
  
  if (!property) {
    return {
      title: 'Property Not Found',
    };
  }

  return {
    title: `${property.title} | Admin Dashboard`,
    description: `Manage property listing: ${property.title}`,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const property = await getProperty(params.id);

  if (!property) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/admin/properties">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Properties
        </Button>
      </Link>

      {/* Header with property status and quick actions */}
      <PropertyHeader property={property} />

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Property Details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="images">Images</TabsTrigger>
              <TabsTrigger value="boundary">Boundary</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Information</CardTitle>
                  <CardDescription>
                    Detailed information about the property listing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<DetailsSkeleton />}>
                    <PropertyDetails property={property} />
                  </Suspense>
                </CardContent>
              </Card>

              {/* Units (for multi-family properties) */}
              {property.structure === 'MULTI_FAMILY' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Property Units</CardTitle>
                    <CardDescription>
                      {property.totalUnits} total units • {property.availableUnits} available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Suspense fallback={<UnitsSkeleton />}>
                      <PropertyUnits propertyId={property.id} />
                    </Suspense>
                  </CardContent>
                </Card>
              )}

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Location Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium">{property.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {property.city}, {property.state}, {property.country}
                        </p>
                      </div>
                    </div>

                    {property.gpsCoordinates && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium mb-2">GPS Coordinates</p>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {property.gpsCoordinates}
                        </code>
                      </div>
                    )}

                    {property.boundaryVerified ? (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <div className="h-2 w-2 rounded-full bg-green-600" />
                          Boundary verified
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t">
                        <div className="flex items-center gap-2 text-sm text-amber-600">
                          <div className="h-2 w-2 rounded-full bg-amber-600" />
                          Boundary not verified
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Owner Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Owner Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<OwnerSkeleton />}>
                    <OwnerInformation 
                      ownerId={property.ownerId}
                      agentId={property.agentId}
                      isOwnerListing={property.isOwnerListing}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images">
              <Card>
                <CardHeader>
                  <CardTitle>Property Images</CardTitle>
                  <CardDescription>
                    Review and manage property photos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<ImagesSkeleton />}>
                    <PropertyImages propertyId={property.id} />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="boundary">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Property Boundary</CardTitle>
                    <CardDescription>
                      View and manage property boundary markings
                    </CardDescription>
                  </div>
                  <Link href={`/admin/properties/${property.id}/boundary`}>
                    <Button size="sm">
                      Full Screen View
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<BoundarySkeleton />}>
                    <PropertyBoundary property={property} />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Legal Documents</CardTitle>
                  <CardDescription>
                    Review property ownership and legal documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<DocumentsSkeleton />}>
                    <PropertyDocuments propertyId={property.id} />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="timeline">
              <Card>
                <CardHeader>
                  <CardTitle>Property Timeline</CardTitle>
                  <CardDescription>
                    History of property listing activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<TimelineSkeleton />}>
                    <PropertyTimeline propertyId={property.id} />
                  </Suspense>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Actions & Quick Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <PropertyActions property={property} />
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickStats property={property} />
            </CardContent>
          </Card>

          {/* Approval Status */}
          <Card>
            <CardHeader>
              <CardTitle>Approval Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ApprovalStatus property={property} />
            </CardContent>
          </Card>

          {/* Boundary Status */}
          {property.boundaryCoordinates && (
            <Card>
              <CardHeader>
                <CardTitle>Boundary Information</CardTitle>
              </CardHeader>
              <CardContent>
                <BoundaryStatus property={property} />
              </CardContent>
            </Card>
          )}

          {/* Virtual Account */}
          {property.virtualAccount && (
            <Card>
              <CardHeader>
                <CardTitle>Virtual Account</CardTitle>
              </CardHeader>
              <CardContent>
                <Suspense fallback={<VirtualAccountSkeleton />}>
                  <VirtualAccountInfo accountId={property.virtualAccount.id} />
                </Suspense>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Component implementations
function QuickStats({ property }: { property: any }) {
  const stats = [
    {
      label: 'Property Type',
      value: property.propertyType.replace('_', ' '),
    },
    {
      label: 'Structure',
      value: property.structure === 'MULTI_FAMILY' ? 'Multi-Family' : 'Single Unit',
    },
    {
      label: 'Status',
      value: property.status,
    },
    {
      label: 'View Count',
      value: property.viewCount.toString(),
    },
    {
      label: 'Created',
      value: new Date(property.createdAt).toLocaleDateString(),
    },
  ];

  if (property.structure === 'SINGLE_UNIT' && property.price) {
    stats.unshift({
      label: 'Price',
      value: `₦${property.price.toLocaleString()}`,
    });
  }

  if (property.structure === 'MULTI_FAMILY') {
    stats.push({
      label: 'Total Units',
      value: property.totalUnits?.toString() || '0',
    });
    stats.push({
      label: 'Available Units',
      value: property.availableUnits?.toString() || '0',
    });
  }

  return (
    <div className="space-y-3">
      {stats.map((stat, index) => (
        <div key={index} className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{stat.label}</span>
          <span className="text-sm font-medium">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}

function ApprovalStatus({ property }: { property: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'text-green-600 bg-green-50';
      case 'REJECTED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-amber-600 bg-amber-50';
    }
  };

  return (
    <div className="space-y-3">
      <div className={`px-3 py-2 rounded-lg ${getStatusColor(property.adminApprovalStatus)}`}>
        <p className="text-sm font-medium text-center">
          {property.adminApprovalStatus}
        </p>
      </div>

      {property.rejectionReason && (
        <div className="pt-3 border-t">
          <p className="text-sm font-medium mb-1">Rejection Reason</p>
          <p className="text-sm text-muted-foreground">{property.rejectionReason}</p>
        </div>
      )}

      {property.approvedAt && (
        <div className="pt-3 border-t">
          <p className="text-sm font-medium mb-1">Approved On</p>
          <p className="text-sm text-muted-foreground">
            {new Date(property.approvedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}

function BoundaryStatus({ property }: { property: any }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Verified</span>
        <span className={`text-sm font-medium ${property.boundaryVerified ? 'text-green-600' : 'text-amber-600'}`}>
          {property.boundaryVerified ? 'Yes' : 'No'}
        </span>
      </div>

      {property.boundaryMarkedAt && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Marked On</span>
          <span className="text-sm font-medium">
            {new Date(property.boundaryMarkedAt).toLocaleDateString()}
          </span>
        </div>
      )}

      {property.buildingFingerprint && (
        <div className="pt-3 border-t">
          <p className="text-sm font-medium mb-1">Building Fingerprint</p>
          <code className="text-xs bg-muted px-2 py-1 rounded block overflow-hidden text-ellipsis">
            {property.buildingFingerprint}
          </code>
        </div>
      )}

      {property.boundaryImages && property.boundaryImages.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-sm font-medium mb-2">Boundary Images</p>
          <p className="text-sm text-muted-foreground">
            {property.boundaryImages.length} image(s) available
          </p>
        </div>
      )}
    </div>
  );
}

function VirtualAccountInfo({ accountId }: { accountId: string }) {
  // Fetch and display virtual account information
  return <div>Virtual account info component</div>;
}

// Skeleton components
function DetailsSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
}

function UnitsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 border rounded-lg space-y-2">
          <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
            <div className="h-6 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function OwnerSkeleton() {
  return <DetailsSkeleton />;
}

function ImagesSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="aspect-square bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}

function BoundarySkeleton() {
  return <div className="h-96 bg-muted animate-pulse rounded" />;
}

function DocumentsSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
          <div className="h-10 w-10 bg-muted animate-pulse rounded" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function VirtualAccountSkeleton() {
  return <DetailsSkeleton />;
}