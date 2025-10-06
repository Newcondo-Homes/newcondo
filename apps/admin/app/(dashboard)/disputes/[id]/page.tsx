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