'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface RevenueSource {
  source: string;
  amount: number;
  percentage: number;
  change: number;
  transactions: number;
}

export default function RevenueBreakdownTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['revenue-breakdown'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/admin/analytics/revenue-breakdown`);
      return response.json();
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  // Mock data - replace with actual data
  const mockData: RevenueSource[] = [
    {
      source: 'Rent Commission',
      amount: 2490000,
      percentage: 60.5,
      change: 12.3,
      transactions: 1245,
    },
    {
      source: 'Property Marking Service',
      amount: 750000,
      percentage: 18.2,
      change: -3.1,
      transactions: 375,
    },
    {
      source: 'Premium Subscriptions',
      amount: 582000,
      percentage: 14.1,
      change: 8.7,
      transactions: 194,
    },
    {
      source: 'Service Fees',
      amount: 298000,
      percentage: 7.2,
      change: 5.4,
      transactions: 1520,
    },
  ];

  const totalRevenue = mockData.reduce((sum, item) => sum + item.amount, 0);
  const totalTransactions = mockData.reduce((sum, item) => sum + item.transactions, 0);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Revenue Source</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-center">% of Total</TableHead>
            <TableHead className="text-center">Change</TableHead>
            <TableHead className="text-center">Transactions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockData.map((item) => (
            <TableRow key={item.source}>
              <TableCell className="font-medium">{item.source}</TableCell>
              <TableCell className="text-right font-semibold">
                ₦{item.amount.toLocaleString()}
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <span>{item.percentage}%</span>
                  <div className="w-20 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${item.percentage}%` }} 
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <div className={`flex items-center justify-center gap-1 ${
                  item.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.change > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span className="font-semibold">
                    {item.change > 0 ? '+' : ''}{item.change}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                {item.transactions.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold">Total</TableCell>
            <TableCell className="text-right font-bold">
              ₦{totalRevenue.toLocaleString()}
            </TableCell>
            <TableCell className="text-center font-bold">100%</TableCell>
            <TableCell className="text-center">-</TableCell>
            <TableCell className="text-center font-bold">
              {totalTransactions.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}