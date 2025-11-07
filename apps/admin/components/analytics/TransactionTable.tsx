'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Eye, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Transaction {
  id: string;
  reference: string;
  user: string;
  type: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  date: string;
}

export default function TransactionTable() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page, pageSize],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(
        `/api/admin/analytics/transactions?page=${page}&pageSize=${pageSize}`
      );
      return response.json();
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  // Mock data - replace with actual data
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      reference: 'TXN-2024-001234',
      user: 'John Doe',
      type: 'RENT',
      amount: 1500000,
      status: 'SUCCESS',
      date: '2024-11-07 14:30',
    },
    {
      id: '2',
      reference: 'TXN-2024-001235',
      user: 'Jane Smith',
      type: 'PROPERTY_MARKING',
      amount: 20000,
      status: 'SUCCESS',
      date: '2024-11-07 13:45',
    },
    {
      id: '3',
      reference: 'TXN-2024-001236',
      user: 'Mike Johnson',
      type: 'RENT',
      amount: 2000000,
      status: 'PENDING',
      date: '2024-11-07 12:20',
    },
    {
      id: '4',
      reference: 'TXN-2024-001237',
      user: 'Sarah Wilson',
      type: 'PREMIUM_UPGRADE',
      amount: 50000,
      status: 'SUCCESS',
      date: '2024-11-07 11:15',
    },
    {
      id: '5',
      reference: 'TXN-2024-001238',
      user: 'David Brown',
      type: 'RENT',
      amount: 1200000,
      status: 'FAILED',
      date: '2024-11-07 10:30',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-mono text-sm">
                  {transaction.reference}
                </TableCell>
                <TableCell>{transaction.user}</TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.type}</Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  ₦{transaction.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <StatusBadge status={transaction.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {transaction.date}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((page - 1) * pageSize) + 1} to {page * pageSize} of 150 transactions
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page * pageSize >= 150}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'SUCCESS' | 'FAILED' | 'PENDING' }) {
  const config = {
    SUCCESS: {
      label: 'Success',
      className: 'bg-green-50 text-green-700 border-green-200',
    },
    FAILED: {
      label: 'Failed',
      className: 'bg-red-50 text-red-700 border-red-200',
    },
    PENDING: {
      label: 'Pending',
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    },
  }[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}