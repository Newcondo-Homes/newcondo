'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@newcondo/ui/components/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@newcondo/ui/components/table';
import { Clock, CheckCircle, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';

type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'HELD' | 'RELEASED';

interface Payment {
  id: string;
  amount: number | { toNumber: () => number };
  currency: string;
  status: PaymentStatus;
  paymentType: string;
  description?: string | null;
  failureReason?: string | null;
  createdAt: Date;
  paidAt?: Date | null;
  rentalId?: string | null;
  rental?: {
    id: string;
    property: {
      id: string;
      title: string;
      address: string;
      city: string;
      state: string;
    };
    unit?: { id: string; unitNumber: string } | null;
  } | null;
}

interface Rental {
  id: string;
  isConfirmed: boolean;
  confirmationDeadline?: Date | null;
  property: { id: string; title: string; address: string };
  unit?: { unitNumber: string } | null;
  payments: { id: string; status: string }[];
}

interface PaymentHistoryTableProps {
  payments: Payment[];
  rentals: Rental[];
  filterStatus?: 'pending' | 'held' | 'completed' | 'refunded';
}

const STATUS_CONFIG: Record<PaymentStatus, {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  icon: React.ReactNode;
}> = {
  PENDING:   { label: 'Pending',   variant: 'secondary',    icon: <Clock className="h-3 w-3" /> },
  SUCCESS:   { label: 'Success',   variant: 'default',      icon: <CheckCircle className="h-3 w-3" /> },
  FAILED:    { label: 'Failed',    variant: 'destructive',  icon: <XCircle className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelled', variant: 'outline',      icon: <XCircle className="h-3 w-3" /> },
  REFUNDED:  { label: 'Refunded',  variant: 'secondary',    icon: <ArrowUpRight className="h-3 w-3" /> },
  HELD:      { label: 'Held',      variant: 'secondary',    icon: <Clock className="h-3 w-3" /> },
  RELEASED:  { label: 'Released',  variant: 'default',      icon: <CheckCircle className="h-3 w-3" /> },
};

function formatAmount(amount: number | { toNumber: () => number }, currency = 'NGN') {
  const value = typeof amount === 'object' ? amount.toNumber() : amount;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(value);
}

function getConfirmationDeadlineWarning(rental: Rental) {
  if (rental.isConfirmed || !rental.confirmationDeadline) return null;
  const hoursLeft = (new Date(rental.confirmationDeadline).getTime() - Date.now()) / 36e5;
  if (hoursLeft <= 0) return 'expired';
  if (hoursLeft <= 6) return 'critical';
  if (hoursLeft <= 12) return 'warning';
  return null;
}

export function PaymentHistoryTable({ payments, rentals, filterStatus }: PaymentHistoryTableProps) {
  // Build a map of rentalId → rental for quick lookup
  const rentalMap = new Map(rentals.map((r) => [r.id, r]));

  if (payments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
        <AlertTriangle className="h-8 w-8 opacity-40" />
        <p className="font-medium">No payments found</p>
        <p className="text-sm">
          {filterStatus === 'pending'
            ? 'You have no rentals awaiting confirmation.'
            : filterStatus === 'held'
            ? 'No funds are currently held in escrow.'
            : filterStatus === 'refunded'
            ? 'You have no refunded payments.'
            : 'Your payment history will appear here.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => {
            const statusConfig = STATUS_CONFIG[payment.status] ?? STATUS_CONFIG.PENDING;
            const rental = payment.rentalId ? rentalMap.get(payment.rentalId) : undefined;
            const deadlineWarning = rental ? getConfirmationDeadlineWarning(rental) : null;

            const propertyTitle = payment.rental?.property.title
              ?? rental?.property.title
              ?? '—';

            const unitLabel = payment.rental?.unit?.unitNumber
              ?? rental?.unit?.unitNumber;

            return (
              <TableRow key={payment.id}>
                {/* Property */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm leading-tight">{propertyTitle}</span>
                    {unitLabel && (
                      <span className="text-xs text-muted-foreground">Unit {unitLabel}</span>
                    )}
                    {deadlineWarning && deadlineWarning !== 'expired' && (
                      <span className={`text-xs font-medium ${
                        deadlineWarning === 'critical' ? 'text-red-600' : 'text-amber-600'
                      }`}>
                        {deadlineWarning === 'critical' ? '⚠ Confirm soon!' : '⏰ Deadline approaching'}
                      </span>
                    )}
                    {deadlineWarning === 'expired' && (
                      <span className="text-xs text-muted-foreground">Confirmation expired</span>
                    )}
                  </div>
                </TableCell>

                {/* Type */}
                <TableCell>
                  <span className="text-xs text-muted-foreground capitalize">
                    {payment.paymentType.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </TableCell>

                {/* Amount */}
                <TableCell className="font-semibold text-sm">
                  {formatAmount(payment.amount, payment.currency)}
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge variant={statusConfig.variant} className="flex w-fit items-center gap-1">
                    {statusConfig.icon}
                    {statusConfig.label}
                  </Badge>
                </TableCell>

                {/* Date */}
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(payment.createdAt), 'dd MMM yyyy')}
                </TableCell>

                {/* Action */}
                <TableCell className="text-right">
                  {payment.status === 'HELD' && payment.rentalId && (
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/payments/confirmation/${payment.rentalId}`}>
                        Confirm
                      </Link>
                    </Button>
                  )}
                  {payment.status === 'FAILED' && (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/payments/failed?paymentId=${payment.id}&amount=${
                        typeof payment.amount === 'object'
                          ? payment.amount.toNumber()
                          : payment.amount
                      }`}>
                        Retry
                      </Link>
                    </Button>
                  )}
                  {['SUCCESS', 'RELEASED'].includes(payment.status) && payment.rentalId && (
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/dashboard/payments/history/${payment.id}`}>
                        View
                      </Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}