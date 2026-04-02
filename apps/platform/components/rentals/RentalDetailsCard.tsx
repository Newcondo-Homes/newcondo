// apps/platform/components/rentals/RentalDetailsCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Separator } from '@newcondo/ui/components/separator';
import {
  Calendar,
  DollarSign,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { RentalStatus } from '@newcondo/db';

interface RentalDetailsCardProps {
  rental: {
    id: string;
    propertyTitle: string;
    propertyAddress: string;
    unitNumber?: string;
    startDate: Date;
    endDate?: Date;
    monthlyRent: number;
    status: RentalStatus;
    isConfirmed: boolean;
    confirmedAt?: Date;
    confirmationDeadline?: Date;
  };
}

export function RentalDetailsCard({ rental }: RentalDetailsCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: RentalStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'PENDING_CONFIRMATION':
        return 'bg-yellow-500';
      case 'EXPIRED':
        return 'bg-gray-500';
      case 'TERMINATED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{rental.propertyTitle}</CardTitle>
            {rental.unitNumber && (
              <p className="text-sm text-muted-foreground mt-1">
                Unit: {rental.unitNumber}
              </p>
            )}
          </div>
          <Badge className={getStatusColor(rental.status)}>
            {rental.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{rental.propertyAddress}</span>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Start Date</span>
            </div>
            <p className="font-medium">{formatDate(rental.startDate)}</p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>End Date</span>
            </div>
            <p className="font-medium">
              {rental.endDate ? formatDate(rental.endDate) : 'Ongoing'}
            </p>
          </div>
        </div>

        <Separator />

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>Monthly Rent</span>
          </div>
          <p className="text-2xl font-bold">
            {formatCurrency(rental.monthlyRent)}
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Confirmation Status</h4>
          <div className="flex items-center gap-2">
            {rental.isConfirmed ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-green-700">
                    Confirmed
                  </p>
                  {rental.confirmedAt && (
                    <p className="text-xs text-muted-foreground">
                      Confirmed on {formatDate(rental.confirmedAt)}
                    </p>
                  )}
                </div>
              </>
            ) : rental.status === 'PENDING_CONFIRMATION' ? (
              <>
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-yellow-700">
                    Pending Confirmation
                  </p>
                  {rental.confirmationDeadline && (
                    <p className="text-xs text-muted-foreground">
                      Deadline: {formatDate(rental.confirmationDeadline)}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-700">
                    Not Confirmed
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}