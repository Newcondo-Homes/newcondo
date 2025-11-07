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
import { Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PropertyPerformance {
  id: string;
  title: string;
  location: string;
  type: string;
  price: number;
  views: number;
  inquiries: number;
  rentals: number;
  conversionRate: number;
  avgTimeToRent: number;
  trend: 'up' | 'down' | 'stable';
}

export default function PropertyPerformanceTable() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['property-performance', page, pageSize],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(
        `/api/admin/analytics/property-performance?page=${page}&pageSize=${pageSize}`
      );
      return response.json();
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  // Mock data - replace with actual data
  const mockProperties: PropertyPerformance[] = [
    {
      id: '1',
      title: 'Luxury 3 Bedroom Apartment',
      location: 'Lekki Phase 1, Lagos',
      type: 'APARTMENT',
      price: 2500000,
      views: 1250,
      inquiries: 89,
      rentals: 3,
      conversionRate: 7.1,
      avgTimeToRent: 12,
      trend: 'up',
    },
    {
      id: '2',
      title: 'Modern 4 Bedroom Duplex',
      location: 'Asokoro, Abuja',
      type: 'DUPLEX',
      price: 4200000,
      views: 980,
      inquiries: 67,
      rentals: 2,
      conversionRate: 6.8,
      avgTimeToRent: 15,
      trend: 'up',
    },
    {
      id: '3',
      title: 'Spacious 2 Bedroom Flat',
      location: 'Ikeja GRA, Lagos',
      type: 'APARTMENT',
      price: 1800000,
      views: 1450,
      inquiries: 102,
      rentals: 4,
      conversionRate: 7.0,
      avgTimeToRent: 10,
      trend: 'up',
    },
    {
      id: '4',
      title: 'Executive 5 Bedroom House',
      location: 'GRA, Port Harcourt',
      type: 'HOUSE',
      price: 3800000,
      views: 720,
      inquiries: 45,
      rentals: 1,
      conversionRate: 6.3,
      avgTimeToRent: 22,
      trend: 'down',
    },
    {
      id: '5',
      title: 'Cozy Studio Apartment',
      location: 'Wuse 2, Abuja',
      type: 'APARTMENT',
      price: 1200000,
      views: 1680,
      inquiries: 125,
      rentals: 5,
      conversionRate: 7.4,
      avgTimeToRent: 8,
      trend: 'up',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-center">Views</TableHead>
              <TableHead className="text-center">Inquiries</TableHead>
              <TableHead className="text-center">Rentals</TableHead>
              <TableHead className="text-center">Conv. Rate</TableHead>
              <TableHead className="text-center">Avg. Days</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockProperties.map((property) => (
              <TableRow key={property.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{property.title}</p>
                    <p className="text-xs text-muted-foreground">{property.location}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{property.type}</Badge>
                </TableCell>
                <TableCell className="font-semibold">
                  ₦{property.price.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {property.views.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  {property.inquiries}
                </TableCell>
                <TableCell className="text-center font-semibold">
                  {property.rentals}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span className="font-semibold">{property.conversionRate}%</span>
                    {property.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : property.trend === 'down' ? (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {property.avgTimeToRent} days
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((page - 1) * pageSize) + 1} to {page * pageSize} of 100 properties
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
            disabled={page * pageSize >= 100}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}