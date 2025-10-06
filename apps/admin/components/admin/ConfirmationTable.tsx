'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Clock, Search, Filter, Eye, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ConfirmationItem {
  id: string;
  rentalId: string;
  paymentId: string;
  renterName: string;
  renterEmail: string;
  propertyTitle: string;
  propertyAddress: string;
  unitNumber?: string;
  amount: number;
  currency: string;
  confirmationDeadline: string;
  isConfirmed: boolean;
  confirmedAt?: string;
  status: 'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'EXPIRED' | 'REFUNDED';
  timeRemaining: number; // in milliseconds
  hasDispute: boolean;
  disputeReason?: string;
}

interface ConfirmationTableProps {
  confirmations: ConfirmationItem[];
  isLoading?: boolean;
  onViewDetails: (confirmationId: string) => void;
  onForceRelease?: (confirmationId: string) => void;
  onViewDispute?: (confirmationId: string) => void;
}

export function ConfirmationTable({
  confirmations,
  isLoading = false,
  onViewDetails,
  onForceRelease,
  onViewDispute,
}: ConfirmationTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'amount' | 'created'>('deadline');

  const getStatusBadge = (status: ConfirmationItem['status']) => {
    const variants = {
      PENDING: { variant: 'secondary' as const, label: 'Pending Confirmation' },
      CONFIRMED: { variant: 'default' as const, label: 'Confirmed' },
      DISPUTED: { variant: 'destructive' as const, label: 'Disputed' },
      EXPIRED: { variant: 'outline' as const, label: 'Expired' },
      REFUNDED: { variant: 'outline' as const, label: 'Refunded' },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTimeRemainingDisplay = (timeRemaining: number) => {
    if (timeRemaining <= 0) {
      return <span className="text-red-600 font-medium">Expired</span>;
    }

    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const isUrgent = hours < 6;

    return (
      <span className={isUrgent ? 'text-orange-600 font-medium' : 'text-gray-700'}>
        {formatDistanceToNow(new Date(Date.now() + timeRemaining), { addSuffix: true })}
      </span>
    );
  };

  const filteredConfirmations = confirmations
    .filter((confirmation) => {
      const matchesSearch =
        searchQuery === '' ||
        confirmation.renterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        confirmation.renterEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        confirmation.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        confirmation.rentalId.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || confirmation.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        return a.timeRemaining - b.timeRemaining;
      } else if (sortBy === 'amount') {
        return b.amount - a.amount;
      }
      return new Date(b.confirmationDeadline).getTime() - new Date(a.confirmationDeadline).getTime();
    });

  const stats = {
    total: confirmations.length,
    pending: confirmations.filter((c) => c.status === 'PENDING').length,
    confirmed: confirmations.filter((c) => c.status === 'CONFIRMED').length,
    disputed: confirmations.filter((c) => c.status === 'DISPUTED').length,
    urgent: confirmations.filter((c) => c.timeRemaining > 0 && c.timeRemaining < 6 * 60 * 60 * 1000)
      .length,
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">Confirmed</p>
          <p className="text-2xl font-bold text-green-900">{stats.confirmed}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-700">Disputed</p>
          <p className="text-2xl font-bold text-red-900">{stats.disputed}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-700">Urgent (&lt;6h)</p>
          <p className="text-2xl font-bold text-orange-900">{stats.urgent}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by renter, email, property, or rental ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="DISPUTED">Disputed</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deadline">Time Remaining</SelectItem>
            <SelectItem value="amount">Amount</SelectItem>
            <SelectItem value="created">Created Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rental ID</TableHead>
              <TableHead>Renter</TableHead>
              <TableHead>Property</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Time Remaining</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Clock className="h-5 w-5 animate-spin mr-2" />
                    Loading confirmations...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredConfirmations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No confirmations found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredConfirmations.map((confirmation) => (
                <TableRow key={confirmation.id}>
                  <TableCell className="font-mono text-sm">
                    {confirmation.rentalId.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{confirmation.renterName}</p>
                      <p className="text-sm text-gray-500">{confirmation.renterEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{confirmation.propertyTitle}</p>
                      {confirmation.unitNumber && (
                        <p className="text-sm text-gray-500">Unit: {confirmation.unitNumber}</p>
                      )}
                      <p className="text-xs text-gray-400">{confirmation.propertyAddress}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold">
                      {confirmation.currency} {confirmation.amount.toLocaleString()}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(confirmation.status)}
                      {confirmation.hasDispute && (
                        <AlertCircle className="h-4 w-4 text-red-500" title="Has dispute" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTimeRemainingDisplay(confirmation.timeRemaining)}</TableCell>
                  <TableCell>
                    <p className="text-sm">
                      {format(new Date(confirmation.confirmationDeadline), 'MMM dd, HH:mm')}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewDetails(confirmation.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {confirmation.hasDispute && onViewDispute && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onViewDispute(confirmation.id)}
                        >
                          Dispute
                        </Button>
                      )}
                      {confirmation.status === 'PENDING' &&
                        confirmation.timeRemaining > 0 &&
                        onForceRelease && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onForceRelease(confirmation.id)}
                          >
                            Force Release
                          </Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination info */}
      {filteredConfirmations.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredConfirmations.length} of {confirmations.length} confirmations
        </div>
      )}
    </div>
  );
}