import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ConfirmationTimeline } from '@/components/admin/confirmations/ConfirmationTimeline';
import { ConfirmationActions } from '@/components/admin/confirmations/ConfirmationActions';
import { PaymentDetails } from '@/components/admin/confirmations/PaymentDetails';
import { PropertyDetails } from '@/components/admin/confirmations/PropertyDetails';
import { RenterVerification } from '@/components/admin/confirmations/RenterVerification';
import { CommissionBreakdown } from '@/components/admin/confirmations/CommissionBreakdown';
import { Skeleton } from '@/components/ui/skeleton';
import { getConfirmationDetails } from '@/lib/api/admin/confirmations';

interface ConfirmationDetailsPageProps {
  params: {
    id: string;
  };
}

export default async function ConfirmationDetailsPage({
  params,
}: ConfirmationDetailsPageProps) {
  const confirmation = await getConfirmationDetails(params.id);

  if (!confirmation) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Confirmation Details
          </h1>
          <p className="text-muted-foreground mt-2">
            Payment ID: {confirmation.id}
          </p>
        </div>
        <Badge
          variant={
            confirmation.status === 'CONFIRMED'
              ? 'default'
              : confirmation.status === 'DISPUTED'
              ? 'destructive'
              : 'secondary'
          }
        >
          {confirmation.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>Transaction details</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <PaymentDetails payment={confirmation.payment} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
            <CardDescription>Property information</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Skeleton className="h-64" />}>
              <PropertyDetails
                property={confirmation.property}
                unit={confirmation.unit}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Renter Verification</CardTitle>
          <CardDescription>
            Verification status and property confirmation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-48" />}>
            <RenterVerification
              renter={confirmation.renter}
              confirmationStatus={confirmation.confirmationStatus}
            />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commission Breakdown</CardTitle>
          <CardDescription>
            Distribution of funds after confirmation period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <CommissionBreakdown
              payment={confirmation.payment}
              property={confirmation.property}
              agents={confirmation.agents}
            />
          </Suspense>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Confirmation Timeline</CardTitle>
          <CardDescription>Activity history</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96" />}>
            <ConfirmationTimeline events={confirmation.timeline} />
          </Suspense>
        </CardContent>
      </Card>

      <Separator />

      <ConfirmationActions confirmation={confirmation} />
    </div>
  );
}