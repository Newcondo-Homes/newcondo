'use client';
// apps/platform/components/properties/RentalHistory.tsx

import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { apiClient } from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RentalHistoryProps {
  propertyId: string;
}

interface RentalRecord {
  id: string;
  renterId: string;
  renter: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  unitId?: string;
  unit?: { unitNumber: string };
  startDate: string;
  endDate: string | null;
  monthlyRent: number;
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING_CONFIRMATION';
  isConfirmed: boolean;
  confirmedAt: string | null;
  createdAt: string;
}

interface RentalHistoryResponse {
  rentals: RentalRecord[];
  summary: {
    total: number;
    active: number;
    totalRevenue: number;
    currency: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<
  RentalRecord['status'],
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  EXPIRED: { label: 'Expired', color: 'bg-gray-100 text-gray-600', icon: Clock },
  TERMINATED: { label: 'Terminated', color: 'bg-red-100 text-red-700', icon: XCircle },
  PENDING_CONFIRMATION: {
    label: 'Pending Confirmation',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
};

function formatNGN(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RentalHistory({ propertyId }: RentalHistoryProps) {
  const { data, isLoading, isError } = useQuery<RentalHistoryResponse>({
    queryKey: ['rental-history', propertyId],
    queryFn: async () => {
      const res = await apiClient.get(`/properties/${propertyId}/rentals`);
      return res.data as RentalHistoryResponse;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-24" />
          </Card>
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-red-500">
          <AlertTriangle className="mx-auto mb-2 h-8 w-8" />
          Failed to load rental history. Please try again.
        </CardContent>
      </Card>
    );
  }

  const { rentals, summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Rental History</h2>
        <p className="mt-1 text-sm text-gray-500">
          All past and current tenancies for this property
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-blue-50 p-2 text-blue-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Rentals</p>
              <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-green-50 p-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Tenants</p>
              <p className="text-2xl font-bold text-gray-900">{summary.active}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-full bg-orange-50 p-2 text-orange-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNGN(summary.totalRevenue, summary.currency)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rental list */}
      {rentals.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <h3 className="text-base font-semibold text-gray-700">No rentals yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Rental records will appear here once tenants move in.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rentals.map((rental) => {
            const cfg = statusConfig[rental.status];
            const StatusIcon = cfg.icon;

            return (
              <Card key={rental.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    {/* Tenant info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {rental.renter.name ?? rental.renter.email}
                        </p>
                        <p className="text-sm text-gray-500 truncate">{rental.renter.email}</p>
                        {rental.renter.phone && (
                          <p className="text-sm text-gray-500">{rental.renter.phone}</p>
                        )}
                        {rental.unit && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            Unit {rental.unit.unitNumber}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <Badge className={`${cfg.color} shrink-0 gap-1`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </Badge>
                  </div>

                  {/* Dates & rent */}
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-gray-400">Start Date</p>
                      <p className="font-medium text-gray-700">{formatDate(rental.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">End Date</p>
                      <p className="font-medium text-gray-700">
                        {rental.endDate ? formatDate(rental.endDate) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Monthly Rent</p>
                      <p className="font-medium text-green-700">
                        {formatNGN(Number(rental.monthlyRent))}
                      </p>
                    </div>
                  </div>

                  {/* Confirmation status */}
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-gray-400">
                      {rental.isConfirmed && rental.confirmedAt
                        ? `Confirmed ${formatDate(rental.confirmedAt)}`
                        : 'Not yet confirmed'}
                    </span>
                    <span className="text-xs text-gray-400">
                      Since {formatDate(rental.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}