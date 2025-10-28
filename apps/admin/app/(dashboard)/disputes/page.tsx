import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DisputesTable } from '@/components/admin/disputes/DisputesTable';
import { DisputeStats } from '@/components/admin/disputes/DisputeStats';
import { DisputeFilters } from '@/components/admin/disputes/DisputeFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export default function DisputesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dispute Management</h1>
        <p className="text-muted-foreground mt-2">
          Handle payment disputes and refund requests
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Service fees are non-refundable. Ensure all disputes are thoroughly
          reviewed before processing refunds.
        </AlertDescription>
      </Alert>

      <Suspense fallback={<Skeleton className="h-32 w-full" />}>
        <DisputeStats />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Dispute Cases</CardTitle>
          <CardDescription>
            All payment disputes requiring admin review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList>
              <TabsTrigger value="pending">Pending Review</TabsTrigger>
              <TabsTrigger value="investigating">Under Investigation</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <DisputeFilters />

            <TabsContent value="pending" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <DisputesTable status="PENDING" />
              </Suspense>
            </TabsContent>

            <TabsContent value="investigating" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <DisputesTable status="INVESTIGATING" />
              </Suspense>
            </TabsContent>

            <TabsContent value="resolved" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <DisputesTable status="RESOLVED" />
              </Suspense>
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4">
              <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                <DisputesTable status="REJECTED" />
              </Suspense>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}







// // apps/admin/src/app/(dashboard)/disputes/page.tsx
// import { Suspense } from 'react';
// import { DisputeList } from '@/components/admin/disputes/DisputeList';
// import { DisputeFilters } from '@/components/admin/disputes/DisputeFilters';
// import { DisputeStats } from '@/components/admin/disputes/DisputeStats';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui';

// export const metadata = {
//   title: 'Boundary Disputes | Admin Dashboard',
//   description: 'Manage property boundary disputes and conflicts',
// };

// export default function DisputesPage({
//   searchParams,
// }: {
//   searchParams: {
//     status?: string;
//     priority?: string;
//     dateFrom?: string;
//     dateTo?: string;
//     search?: string;
//     page?: string;
//   };
// }) {
//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-3xl font-bold tracking-tight">Boundary Disputes</h1>
//         <p className="text-muted-foreground mt-2">
//           Review and resolve property boundary conflicts and duplicate reports
//         </p>
//       </div>

//       {/* Stats Overview */}
//       <Suspense fallback={<StatsLoading />}>
//         <DisputeStats />
//       </Suspense>

//       {/* Filters */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Filter Disputes</CardTitle>
//           <CardDescription>
//             Search and filter disputes by status, priority, and date range
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <DisputeFilters />
//         </CardContent>
//       </Card>

//       {/* Dispute List */}
//       <Card>
//         <CardHeader>
//           <CardTitle>All Disputes</CardTitle>
//           <CardDescription>
//             {searchParams.status && `Showing ${searchParams.status.toLowerCase()} disputes`}
//             {searchParams.priority && ` • ${searchParams.priority} priority`}
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           <Suspense fallback={<DisputeListLoading />}>
//             <DisputeList searchParams={searchParams} />
//           </Suspense>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// function StatsLoading() {
//   return (
//     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
//       {[...Array(4)].map((_, i) => (
//         <Card key={i}>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <div className="h-4 w-24 bg-muted animate-pulse rounded" />
//             <div className="h-8 w-8 bg-muted animate-pulse rounded" />
//           </CardHeader>
//           <CardContent>
//             <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
//             <div className="h-3 w-24 bg-muted animate-pulse rounded" />
//           </CardContent>
//         </Card>
//       ))}
//     </div>
//   );
// }

// function DisputeListLoading() {
//   return (
//     <div className="space-y-4">
//       {[...Array(5)].map((_, i) => (
//         <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg">
//           <div className="h-12 w-12 bg-muted animate-pulse rounded" />
//           <div className="flex-1 space-y-2">
//             <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
//             <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
//             <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
//           </div>
//           <div className="space-y-2">
//             <div className="h-6 w-24 bg-muted animate-pulse rounded" />
//             <div className="h-6 w-20 bg-muted animate-pulse rounded" />
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }