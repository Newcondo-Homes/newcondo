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
import { Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface UserActivity {
  id: string;
  user: string;
  email: string;
  role: string;
  lastActive: string;
  actions: number;
  status: 'active' | 'inactive';
}

export default function UserActivityTable() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['user-activity', page, pageSize],
    queryFn: async () => {
      // TODO: Replace with actual API call
      const response = await fetch(
        `/api/admin/analytics/user-activity?page=${page}&pageSize=${pageSize}`
      );
      return response.json();
    },
  });

  if (isLoading) {
    return <Skeleton className="h-96" />;
  }

  // Mock data - replace with actual data
  const mockActivity: UserActivity[] = [
    {
      id: '1',
      user: 'John Doe',
      email: 'john.doe@example.com',
      role: 'OWNER',
      lastActive: '2 minutes ago',
      actions: 45,
      status: 'active',
    },
    {
      id: '2',
      user: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: 'AGENT',
      lastActive: '15 minutes ago',
      actions: 32,
      status: 'active',
    },
    {
      id: '3',
      user: 'Mike Johnson',
      email: 'mike.j@example.com',
      role: 'RENTER',
      lastActive: '1 hour ago',
      actions: 18,
      status: 'active',
    },
    {
      id: '4',
      user: 'Sarah Wilson',
      email: 'sarah.w@example.com',
      role: 'AGENT',
      lastActive: '3 hours ago',
      actions: 67,
      status: 'active',
    },
    {
      id: '5',
      user: 'David Brown',
      email: 'david.b@example.com',
      role: 'OWNER',
      lastActive: '2 days ago',
      actions: 12,
      status: 'inactive',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead>Actions (30d)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockActivity.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell className="font-medium">{activity.user}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {activity.email}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{activity.role}</Badge>
                </TableCell>
                <TableCell className="text-sm">{activity.lastActive}</TableCell>
                <TableCell>{activity.actions}</TableCell>
                <TableCell>
                  <ActivityStatus status={activity.status} />
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
          Showing {((page - 1) * pageSize) + 1} to {page * pageSize} of 250 users
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
            disabled={page * pageSize >= 250}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function ActivityStatus({ status }: { status: 'active' | 'inactive' }) {
  const config = {
    active: {
      label: 'Active',
      className: 'bg-green-50 text-green-700 border-green-200',
    },
    inactive: {
      label: 'Inactive',
      className: 'bg-gray-50 text-gray-700 border-gray-200',
    },
  }[status];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}