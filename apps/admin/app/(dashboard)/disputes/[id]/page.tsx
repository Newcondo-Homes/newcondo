import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { DisputeTimeline } from '@/components/admin/disputes/DisputeTimeline';
import { DisputeResolutionForm } from '@/components/admin/disputes/DisputeResolutionForm';
import { DisputeEvidence } from '@/components/admin/disputes/DisputeEvidence';
import { DisputeParties } from '@/components/admin/disputes/DisputeParties';
import { RefundCalculator } from '@/components/admin/disputes/RefundCalculator';
import { CommunicationLog } from '@/components/admin/disputes/CommunicationLog';
import { Skeleton } from '@/components/ui/skeleton';
import { getDisputeDetails } from '@/lib/api/admin/disputes';

interface DisputeResolutionPageProps {
  params: {
    id: string;
  };
}

export default async function DisputeResolutionPage({
  params,
}: DisputeResolutionPageProps) {
  const dispute = await getDisputeDetails(params.id);

  if (!dispute) {
    notFound();
  }

  const isUrgent = new Date(dispute.payment.confirmationPeriodEnd!) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Dispute Resolution
          </h1>
          <p className="text-muted-foreground mt-2">
            Dispute ID: {dispute.id}
          </p>
        </div>
        <div className="flex gap-2">
          {isUrgent && (
            <Badge variant="destructive">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Urgent
            </Badge>
          )}
          <Badge
            variant={
              dispute.status === 'RESOLVED'
                ? 'default'
                : dispute.status === 'REJECTED'
                ? 'destructive'
                : 'secondary'
            }
          >
            {dispute.status}
          </Badge>
        </div>
      </div>

      {isUrgent && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Confirmation Period Expired</AlertTitle>
          <AlertDescription>
            The 24-hour confirmation period has ended. Resolve this dispute
            immediately to prevent automatic fund release.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Refund Policy</AlertTitle>
        <AlertDescription>
          Service fees ({dispute.payment.platformFee} NGN) are non-refundable.
          Refunds will include Flutterwave transaction reversal fees (doubled for
          protection).
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dispute Details</CardTitle>
            <CardDescription>Case information</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Reason
                </dt>
                <dd className="mt-1 text-sm">{dispute.reason}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Filed By
                </dt>
                <dd className="mt-1 text-sm">
                  {dispute.renter.name} ({dispute.renter.email})
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Filed At
                </dt>
                <dd className="mt-1 text-sm">
                  {new Date(dispute.createdAt).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Payment Amount
                </dt>
                <dd className="mt-1 text-sm font-semibold">
                  {dispute.payment.amount.toLocaleString()} {dispute.payment.currency}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Refund Calculation</CardTitle>
            <CardDescription>Amount breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <RefundCalculator payment={dispute.payment} />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evidence Submitted</CardTitle>
          <CardDescription>
            Files and documentation provided by disputing party
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-48" />}>
            <DisputeEvidence evidence={dispute.evidence} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Involved Parties</CardTitle>
          <CardDescription>
            All parties involved in this transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <DisputeParties
              renter={dispute.renter}
              owner={dispute.owner}
              agents={dispute.agents}
              property={dispute.property}
            />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Communication Log</CardTitle>
          <CardDescription>
            Messages and notes related to this dispute
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96" />}>
            <CommunicationLog disputeId={dispute.id} />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Activity history</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96" />}>
            <DisputeTimeline events={dispute.timeline} />
          </Suspense>
        </CardContent>
      </Card>

      <Separator />

      {dispute.status === 'PENDING' || dispute.status === 'INVESTIGATING' ? (
        <DisputeResolutionForm dispute={dispute} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Decision
                </dt>
                <dd className="mt-1 text-sm font-semibold">
                  {dispute.resolution}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Admin Notes
                </dt>
                <dd className="mt-1 text-sm">{dispute.resolutionNotes}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Resolved By
                </dt>
                <dd className="mt-1 text-sm">
                  {dispute.resolvedByAdmin?.name} on{' '}
                  {new Date(dispute.resolvedAt!).toLocaleString()}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}









// // apps/admin/src/app/(dashboard)/disputes/[id]/page.tsx
// import { notFound } from 'next/navigation';
// import { Suspense } from 'react';
// import Link from 'next/link';
// // These components are assumed to be defined externally in the actual project
// import { DisputeHeader } from '@/components/admin/disputes/DisputeHeader';
// import { DisputeDetails } from '@/components/admin/disputes/DisputeDetails';
// import { DisputeComparison } from '@/components/admin/disputes/DisputeComparison';
// import { DisputeActions } from '@/components/admin/disputes/DisputeActions';
// import { DisputeTimeline } from '@/components/admin/disputes/DisputeTimeline';
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@newcondo/ui';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui';
// import { Button } from '@newcondo/ui';
// import { ArrowLeft } from 'lucide-react';

// interface DisputePageProps {
//   params: {
//     id: string;
//   };
// }

// // NOTE: In a real environment, you would need to define the type for Dispute
// // and handle environment variable access robustly.

// async function getDispute(id: string) {
//   // This API call is retained as it is part of the original Next.js structure
//   const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/disputes/${id}`, {
//     cache: 'no-store',
//     headers: {
//       'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`,
//     },
//   });

//   if (!response.ok) {
//     if (response.status === 404) return null;
//     throw new Error('Failed to fetch dispute');
//   }

//   return response.json();
// }

// export async function generateMetadata({ params }: DisputePageProps) {
//   const dispute = await getDispute(params.id);
  
//   if (!dispute) {
//     return {
//       title: 'Dispute Not Found',
//     };
//   }

//   return {
//     title: `Dispute #${dispute.id.slice(0, 8)} | Admin Dashboard`,
//     description: `Resolve boundary dispute for properties`,
//   };
// }

// export default async function DisputePage({ params }: DisputePageProps) {
//   const dispute = await getDispute(params.id);

//   if (!dispute) {
//     notFound();
//   }

//   return (
//     <div className="space-y-6">
//       {/* Back Button */}
//       <Link href="/admin/disputes">
//         <Button variant="ghost" size="sm">
//           <ArrowLeft className="mr-2 h-4 w-4" />
//           Back to Disputes
//         </Button>
//       </Link>

//       {/* Header with dispute status and actions */}
//       {/* Assumes DisputeHeader is correctly imported and receives 'dispute' prop */}
//       <DisputeHeader dispute={dispute} />

//       {/* Main Content */}
//       <div className="grid gap-6 lg:grid-cols-3">
//         {/* Left Column - Dispute Details */}
//         <div className="lg:col-span-2 space-y-6">
//           <Tabs defaultValue="details" className="w-full">
//             <TabsList className="grid w-full grid-cols-3">
//               <TabsTrigger value="details">Details</TabsTrigger>
//               <TabsTrigger value="comparison">Comparison</TabsTrigger>
//               <TabsTrigger value="timeline">Timeline</TabsTrigger>
//             </TabsList>

//             <TabsContent value="details" className="space-y-6">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Dispute Information</CardTitle>
//                   <CardDescription>
//                     Review the details of this boundary conflict
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <Suspense fallback={<DetailsSkeleton />}>
//                     {/* Assumes DisputeDetails is correctly imported */}
//                     <DisputeDetails dispute={dispute} />
//                   </Suspense>
//                 </CardContent>
//               </Card>

//               {/* Original Property */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Original Property</CardTitle>
//                   <CardDescription>
//                     The property that was listed first
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <Suspense fallback={<PropertySkeleton />}>
//                     <PropertyCard propertyId={dispute.originalPropertyId} />
//                   </Suspense>
//                 </CardContent>
//               </Card>

//               {/* Duplicate Property */}
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Disputed Property</CardTitle>
//                   <CardDescription>
//                     The property reported as duplicate
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <Suspense fallback={<PropertySkeleton />}>
//                     <PropertyCard propertyId={dispute.duplicatePropertyId} />
//                   </Suspense>
//                 </CardContent>
//               </Card>

//               {/* Reporter Information */}
//               {dispute.reportedBy && (
//                 <Card>
//                   <CardHeader>
//                     <CardTitle>Reported By</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <Suspense fallback={<UserSkeleton />}>
//                       <UserInfo userId={dispute.reportedBy} />
//                     </Suspense>
//                   </CardContent>
//                 </Card>
//               )}
//             </TabsContent>

//             <TabsContent value="comparison">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Property Comparison</CardTitle>
//                   <CardDescription>
//                     Side-by-side comparison of boundary markings
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <Suspense fallback={<ComparisonSkeleton />}>
//                     {/* Assumes DisputeComparison is correctly imported */}
//                     <DisputeComparison 
//                       originalId={dispute.originalPropertyId}
//                       duplicateId={dispute.duplicatePropertyId}
//                     />
//                   </Suspense>
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="timeline">
//               <Card>
//                 <CardHeader>
//                   <CardTitle>Dispute Timeline</CardTitle>
//                   <CardDescription>
//                     History of dispute resolution activities
//                   </CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <Suspense fallback={<TimelineSkeleton />}>
//                     {/* Assumes DisputeTimeline is correctly imported */}
//                     <DisputeTimeline disputeId={dispute.id} />
//                   </Suspense>
//                 </CardContent>
//               </Card>
//             </TabsContent>
//           </Tabs>
//         </div>

//         {/* Right Column - Actions & Info */}
//         <div className="space-y-6">
//           <Card>
//             <CardHeader>
//               <CardTitle>Resolution Actions</CardTitle>
//             </CardHeader>
//             <CardContent>
//               {/* Assumes DisputeActions is correctly imported */}
//               <DisputeActions dispute={dispute} />
//             </CardContent>
//           </Card>

//           {/* Status Card */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Dispute Status</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <DisputeStatusInfo dispute={dispute} />
//             </CardContent>
//           </Card>

//           {/* Quick Facts */}
//           <Card>
//             <CardHeader>
//               <CardTitle>Quick Facts</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <QuickFacts dispute={dispute} />
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Component implementations
// function PropertyCard({ propertyId }: { propertyId: string }) {
//   // Fetch and display property information
//   return (
//     <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
//       <p className="text-lg font-semibold truncate">Property: {propertyId.slice(0, 8)}...</p>
//       <p className="text-sm text-muted-foreground">Detailed property information goes here (e.g., boundaries, owners, map data).</p>
//       <Link href={`/admin/properties/${propertyId}`} className="text-blue-600 hover:text-blue-500 text-sm mt-2 inline-block">
//         View Full Property Details
//       </Link>
//     </div>
//   );
// }

// function UserInfo({ userId }: { userId: string }) {
//   // Fetch and display user information
//   return (
//     <div className="flex items-center space-x-3">
//       <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
//         U
//       </div>
//       <div>
//         <p className="text-sm font-medium">User ID: {userId.slice(0, 8)}...</p>
//         <p className="text-xs text-muted-foreground">Name and contact info, if available.</p>
//       </div>
//       <Link href={`/admin/users/${userId}`} className="ml-auto text-blue-600 hover:text-blue-500 text-sm">
//         View Profile
//       </Link>
//     </div>
//   );
// }

// function DisputeStatusInfo({ dispute }: { dispute: any }) {
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case 'CONFIRMED_DUPLICATE':
//         return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/50';
//       case 'NOT_DUPLICATE':
//         return 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/50';
//       case 'RESOLVED':
//         return 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/50';
//       default: // PENDING, INVESTIGATING
//         return 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/50';
//     }
//   };

//   return (
//     <div className="space-y-3">
//       <div className={`px-3 py-2 rounded-lg ${getStatusColor(dispute.status)}`}>
//         <p className="text-sm font-semibold uppercase tracking-wider text-center">
//           {dispute.status.replace('_', ' ')}
//         </p>
//       </div>

//       {dispute.resolution && (
//         <div className="pt-3 border-t">
//           <p className="text-sm font-medium mb-1">Resolution Notes</p>
//           <p className="text-sm text-muted-foreground italic">{dispute.resolution}</p>
//         </div>
//       )}

//       {dispute.resolvedAt && (
//         <div className="pt-3 border-t">
//           <p className="text-sm font-medium mb-1">Resolved On</p>
//           <p className="text-sm text-muted-foreground">
//             {new Date(dispute.resolvedAt).toLocaleString()}
//           </p>
//         </div>
//       )}

//       {dispute.resolvedBy && (
//         <div className="pt-3 border-t">
//           <p className="text-sm font-medium mb-1">Resolved By</p>
//           <p className="text-sm text-muted-foreground">
//             Admin ID: {dispute.resolvedBy}
//           </p>
//         </div>
//       )}
//     </div>
//   );
// }

// function QuickFacts({ dispute }: { dispute: any }) {
//   const facts = [
//     {
//       label: 'Reported',
//       value: new Date(dispute.createdAt).toLocaleDateString(),
//     },
//     {
//       label: 'Status',
//       value: dispute.status.replace('_', ' '),
//     },
//   ];

//   if (dispute.reportedBy) {
//     facts.push({
//       label: 'Reporter',
//       value: `User ID: ${dispute.reportedBy.slice(0, 8)}...`,
//     });
//   }

//   if (dispute.resolvedAt) {
//     const daysSinceResolved = Math.floor(
//       (Date.now() - new Date(dispute.resolvedAt).getTime()) / (1000 * 60 * 60 * 24)
//     );
//     facts.push({
//       label: 'Resolved',
//       value: `${daysSinceResolved} days ago`,
//     });
//   } else {
//     const daysPending = Math.floor(
//       (Date.now() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60 * 24)
//     );
//     facts.push({
//       label: 'Pending',
//       value: `${daysPending} days`,
//     });
//   }

//   return (
//     <div className="space-y-3">
//       {facts.map((fact, index) => (
//         <div key={index} className="flex justify-between items-center">
//           <span className="text-sm text-muted-foreground">{fact.label}</span>
//           <span className="text-sm font-medium">{fact.value}</span>
//         </div>
//       ))}
//     </div>
//   );
// }

// // Skeleton components

// // Skeleton for the Dispute Details card
// function DetailsSkeleton() {
//   return (
//     <div className="space-y-4">
//       {[...Array(6)].map((_, i) => (
//         <div key={i} className="flex justify-between items-center">
//           <div className="h-4 w-32 bg-muted animate-pulse rounded" />
//           <div className="h-4 w-40 bg-muted animate-pulse rounded" />
//         </div>
//       ))}
//     </div>
//   );
// }

// // Skeleton for the Property Card (Completion)
// function PropertySkeleton() {
//   return (
//     <div className="space-y-4">
//       <div className="h-40 w-full bg-muted animate-pulse rounded" />
//       <div className="space-y-2">
//         <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
//         <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
//         <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
//       </div>
//     </div>
//   );
// }

// // Skeleton for the User Info card
// function UserSkeleton() {
//   return (
//     <div className="flex items-center space-x-4">
//       <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
//       <div className="space-y-2">
//         <div className="h-4 w-32 bg-muted animate-pulse rounded" />
//         <div className="h-4 w-48 bg-muted animate-pulse rounded" />
//       </div>
//     </div>
//   );
// }

// // Skeleton for the Comparison tab
// function ComparisonSkeleton() {
//   return (
//     <div className="grid grid-cols-2 gap-6 p-4">
//       <div className="space-y-3 p-4 border rounded-lg bg-gray-50/50">
//         <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
//         {[...Array(5)].map((_, i) => (
//           <div key={`comp-a-${i}`} className="h-4 w-full bg-muted animate-pulse rounded" />
//         ))}
//       </div>
//       <div className="space-y-3 p-4 border rounded-lg bg-gray-50/50">
//         <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
//         {[...Array(5)].map((_, i) => (
//           <div key={`comp-b-${i}`} className="h-4 w-full bg-muted animate-pulse rounded" />
//         ))}
//       </div>
//     </div>
//   );
// }

// // Skeleton for the Timeline tab
// function TimelineSkeleton() {
//   return (
//     <div className="space-y-8 p-4">
//       {[...Array(3)].map((_, i) => (
//         <div key={`timeline-${i}`} className="flex space-x-4">
//           <div className="w-2 h-20 bg-blue-200 rounded-full" />
//           <div className="space-y-2 py-1">
//             <div className="h-5 w-48 bg-muted animate-pulse rounded" />
//             <div className="h-4 w-64 bg-muted animate-pulse rounded" />
//             <div className="h-3 w-32 bg-muted animate-pulse rounded" />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }














