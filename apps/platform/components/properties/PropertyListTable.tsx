// apps/platform/components/properties/PropertyListTable.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/DataTable';
import { PropertyStatusBadge } from './PropertyStatusBadge';
import { PropertyActionMenu } from './PropertyActionMenu';
import { Badge } from '@/components/ui/badge';
import { Eye, Home } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  propertyType: string;
  price: number;
  status: string;
  adminApprovalStatus: string;
  isAvailable: boolean;
  viewCount: number;
  createdAt: Date;
  structure: 'SINGLE_UNIT' | 'MULTI_FAMILY';
  totalUnits?: number;
  availableUnits?: number;
}

interface PropertyListTableProps {
  properties: Property[];
  onView: (propertyId: string) => void;
  onEdit: (propertyId: string) => void;
  onDelete: (propertyId: string) => void;
}

export function PropertyListTable({
  properties,
  onView,
  onEdit,
  onDelete,
}: PropertyListTableProps) {
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

  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: 'title',
      header: 'Property',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium flex items-center gap-2">
            <Home className="h-4 w-4 text-muted-foreground" />
            {row.original.title}
          </div>
          <div className="text-sm text-muted-foreground">
            {row.original.address}
          </div>
          <div className="text-xs text-muted-foreground">
            {row.original.city}, {row.original.state}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'propertyType',
      header: 'Type',
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.propertyType}</Badge>
      ),
    },
    {
      accessorKey: 'structure',
      header: 'Structure',
      cell: ({ row }) => (
        <div>
          <Badge
            variant={
              row.original.structure === 'MULTI_FAMILY' ? 'default' : 'outline'
            }
          >
            {row.original.structure === 'MULTI_FAMILY'
              ? 'Multi-Family'
              : 'Single Unit'}
          </Badge>
          {row.original.structure === 'MULTI_FAMILY' && (
            <div className="text-xs text-muted-foreground mt-1">
              {row.original.availableUnits}/{row.original.totalUnits} units available
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: ({ row }) => (
        <div className="font-semibold">{formatCurrency(row.original.price)}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <PropertyStatusBadge
          status={row.original.status}
          adminApprovalStatus={row.original.adminApprovalStatus}
          isAvailable={row.original.isAvailable}
        />
      ),
    },
    {
      accessorKey: 'viewCount',
      header: 'Views',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {row.original.viewCount.toLocaleString()}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <div className="text-sm">{formatDate(row.original.createdAt)}</div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <PropertyActionMenu
          property={row.original}
          onView={() => onView(row.original.id)}
          onEdit={() => onEdit(row.original.id)}
          onDelete={() => onDelete(row.original.id)}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={properties}
      searchKey="title"
      searchPlaceholder="Search properties..."
    />
  );
}