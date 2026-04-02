// apps/platform/components/referrals/SubAgentList.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@newcondo/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@newcondo/ui/components/dropdown-menu';
import { MoreHorizontal, Eye, MessageCircle, Ban } from 'lucide-react';

interface SubAgent {
  id: string;
  name: string;
  email: string;
  image?: string;
  propertiesPromoting: number;
  totalViews: number;
  totalConversions: number;
  totalEarnings: number;
  conversionRate: number;
  status: 'ACTIVE' | 'INACTIVE';
  joinedAt: Date;
}

interface SubAgentListProps {
  subAgents: SubAgent[];
  currency?: string;
  onViewDetails?: (agent: SubAgent) => void;
  onContact?: (agent: SubAgent) => void;
  onRevoke?: (agentId: string) => void;
}

export function SubAgentList({
  subAgents,
  currency = 'NGN',
  onViewDetails,
  onContact,
  onRevoke,
}: SubAgentListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      notation: 'compact',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const columns: ColumnDef<SubAgent>[] = [
    {
      accessorKey: 'name',
      header: 'Sub-Agent',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={row.original.image} alt={row.original.name} />
            <AvatarFallback>{getInitials(row.original.name)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">
              {row.original.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'propertiesPromoting',
      header: 'Properties',
      cell: ({ row }) => (
        <div className="text-center">
          <div className="font-semibold">{row.original.propertiesPromoting}</div>
          <div className="text-xs text-muted-foreground">promoting</div>
        </div>
      ),
    },
    {
      accessorKey: 'totalViews',
      header: 'Views',
      cell: ({ row }) => (
        <div className="font-medium">{row.original.totalViews.toLocaleString()}</div>
      ),
    },
    {
      accessorKey: 'totalConversions',
      header: 'Conversions',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.original.totalConversions}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.conversionRate}% rate
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'totalEarnings',
      header: 'Earnings',
      cell: ({ row }) => (
        <span className="font-semibold text-green-600">
          {formatCurrency(row.original.totalEarnings)}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) =>
        row.original.status === 'ACTIVE' ? (
          <Badge className="bg-green-500">Active</Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-50 text-gray-700">
            Inactive
          </Badge>
        ),
    },
    {
      accessorKey: 'joinedAt',
      header: 'Joined',
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.original.joinedAt)}</div>
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
            {onViewDetails && (
              <DropdownMenuItem onClick={() => onViewDetails(row.original)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            )}
            {onContact && (
              <DropdownMenuItem onClick={() => onContact(row.original)}>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Agent
              </DropdownMenuItem>
            )}
            {onRevoke && row.original.status === 'ACTIVE' && (
              <DropdownMenuItem
                onClick={() => onRevoke(row.original.id)}
                className="text-destructive"
              >
                <Ban className="h-4 w-4 mr-2" />
                Revoke Access
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={subAgents}
      searchKey="name"
      searchPlaceholder="Search sub-agents..."
    />
  );
}