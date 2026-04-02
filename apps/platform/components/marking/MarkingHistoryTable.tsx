// apps/platform/components/marking/MarkingHistoryTable.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@newcondo/ui/components/dropdown-menu';
import { MoreHorizontal, Eye, CheckCircle, XCircle } from 'lucide-react';

type MarkingJobStatus =
  | 'QUEUED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';

interface MarkingJob {
  id: string;
  propertyTitle: string;
  propertyAddress: string;
  status: MarkingJobStatus;
  assignedAgentName?: string;
  markingFee: number;
  requestedAt: Date;
  completedAt?: Date;
  isConfirmed: boolean;
}

interface MarkingHistoryTableProps {
  jobs: MarkingJob[];
  currency?: string;
  onViewDetails: (job: MarkingJob) => void;
  onConfirm?: (jobId: string) => void;
  onReject?: (jobId: string) => void;
}

export function MarkingHistoryTable({
  jobs,
  currency = 'NGN',
  onViewDetails,
  onConfirm,
  onReject,
}: MarkingHistoryTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: MarkingJobStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'ASSIGNED':
        return <Badge className="bg-purple-500">Assigned</Badge>;
      case 'QUEUED':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Queued
          </Badge>
        );
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'EXPIRED':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            Expired
          </Badge>
        );
    }
  };

  const columns: ColumnDef<MarkingJob>[] = [
    {
      accessorKey: 'propertyTitle',
      header: 'Property',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.propertyTitle}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.propertyAddress}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'assignedAgentName',
      header: 'Agent',
      cell: ({ row }) => (
        <span>
          {row.original.assignedAgentName || (
            <span className="text-muted-foreground">Not assigned</span>
          )}
        </span>
      ),
    },
    {
      accessorKey: 'markingFee',
      header: 'Fee',
      cell: ({ row }) => (
        <span className="font-medium">
          {formatCurrency(row.original.markingFee)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div className="space-y-1">
          {getStatusBadge(row.original.status)}
          {row.original.status === 'COMPLETED' && (
            <>
              {row.original.isConfirmed ? (
                <Badge
                  variant="outline"
                  className="ml-2 bg-green-50 text-green-700"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Confirmed
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="ml-2 bg-yellow-50 text-yellow-700"
                >
                  Awaiting Confirmation
                </Badge>
              )}
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'requestedAt',
      header: 'Requested',
      cell: ({ row }) => (
        <div>
          <div className="text-sm">{formatDate(row.original.requestedAt)}</div>
          {row.original.completedAt && (
            <div className="text-xs text-muted-foreground">
              Completed: {formatDate(row.original.completedAt)}
            </div>
          )}
        </div>
      ),
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
            {row.original.status === 'COMPLETED' &&
              !row.original.isConfirmed &&
              onConfirm && (
                <>
                  <DropdownMenuItem
                    onClick={() => onConfirm(row.original.id)}
                    className="text-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Marking
                  </DropdownMenuItem>
                  {onReject && (
                    <DropdownMenuItem
                      onClick={() => onReject(row.original.id)}
                      className="text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Marking
                    </DropdownMenuItem>
                  )}
                </>
              )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={jobs}
      searchKey="propertyTitle"
      searchPlaceholder="Search by property..."
    />
  );
}