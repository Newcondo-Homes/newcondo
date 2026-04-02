// apps/platform/components/rentals/RentalHistoryTable.tsx
'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@newcondo/ui/components/shared/DataTable';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@newcondo/ui/components/button';
import { Eye, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@newcondo/ui/components/dropdown-menu';
import { RentalStatus } from '@newcondo/db';

interface Rental {
  id: string;
  propertyTitle: string;
  unitNumber?: string;
  renterName: string;
  renterEmail: string;
  startDate: Date;
  endDate?: Date;
  monthlyRent: number;
  status: RentalStatus;
  isConfirmed: boolean;
  confirmedAt?: Date;
}

interface RentalHistoryTableProps {
  rentals: Rental[];
  onViewDetails: (rental: Rental) => void;
}

export function RentalHistoryTable({
  rentals,
  onViewDetails,
}: RentalHistoryTableProps) {
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: RentalStatus, isConfirmed: boolean) => {
    if (status === 'PENDING_CONFIRMATION') {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          Pending Confirmation
        </Badge>
      );
    }

    if (status === 'ACTIVE' && !isConfirmed) {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700">
          Active (Unconfirmed)
        </Badge>
      );
    }

    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'EXPIRED':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            Expired
          </Badge>
        );
      case 'TERMINATED':
        return <Badge variant="destructive">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const columns: ColumnDef<Rental>[] = [
    {
      accessorKey: 'propertyTitle',
      header: 'Property',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.propertyTitle}</div>
          {row.original.unitNumber && (
            <div className="text-sm text-muted-foreground">
              Unit: {row.original.unitNumber}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'renterName',
      header: 'Renter',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.renterName}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.renterEmail}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'Start Date',
      cell: ({ row }) => formatDate(row.original.startDate),
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) =>
        row.original.endDate ? formatDate(row.original.endDate) : 'Ongoing',
    },
    {
      accessorKey: 'monthlyRent',
      header: 'Monthly Rent',
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.monthlyRent)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        getStatusBadge(row.original.status, row.original.isConfirmed),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(row.original)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rentals}
      searchKey="propertyTitle"
      searchPlaceholder="Search by property..."
    />
  );
}