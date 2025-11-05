// apps/platform/components/properties/PropertyDashboard.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { PropertyStatsCards } from './PropertyStatsCards';
import { PropertyListTable } from './PropertyListTable';
import { FilterBar, FilterConfig } from '@/components/shared/FilterBar';
import { EmptyState } from '@/components/shared/EmptyState';

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

interface PropertyDashboardProps {
  properties: Property[];
  stats: {
    total: number;
    published: number;
    rented: number;
    pending: number;
    totalViews: number;
    totalRevenue: number;
  };
  onCreateProperty: () => void;
  onViewProperty: (propertyId: string) => void;
  onEditProperty: (propertyId: string) => void;
  onDeleteProperty: (propertyId: string) => void;
  userRole: 'OWNER' | 'AGENT';
}

export function PropertyDashboard({
  properties,
  stats,
  onCreateProperty,
  onViewProperty,
  onEditProperty,
  onDeleteProperty,
  userRole,
}: PropertyDashboardProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const filters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Published', value: 'PUBLISHED' },
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Rented', value: 'RENTED' },
        { label: 'Unavailable', value: 'UNAVAILABLE' },
      ],
    },
    {
      key: 'propertyType',
      label: 'Type',
      options: [
        { label: 'Apartment', value: 'APARTMENT' },
        { label: 'House', value: 'HOUSE' },
        { label: 'Duplex', value: 'DUPLEX' },
        { label: 'Room', value: 'ROOM' },
        { label: 'Office', value: 'OFFICE' },
        { label: 'Shop', value: 'SHOP' },
      ],
    },
    {
      key: 'structure',
      label: 'Structure',
      options: [
        { label: 'Single Unit', value: 'SINGLE_UNIT' },
        { label: 'Multi-Family', value: 'MULTI_FAMILY' },
      ],
    },
    {
      key: 'adminApprovalStatus',
      label: 'Approval',
      options: [
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Rejected', value: 'REJECTED' },
      ],
    },
  ];

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
  };

  const filteredProperties = properties.filter((property) => {
    return Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      return property[key as keyof Property] === value;
    });
  });

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <PropertyStatsCards stats={stats} userRole={userRole} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Properties</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track your property listings
          </p>
        </div>
        <Button onClick={onCreateProperty}>
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />

      {/* View Toggle */}
      <div className="flex justify-end">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'grid')}>
          <TabsList>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="grid">
              <LayoutGrid className="h-4 w-4 mr-2" />
              Grid
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Properties List/Grid */}
      {filteredProperties.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No properties found"
          description={
            properties.length === 0
              ? 'Get started by creating your first property listing'
              : 'No properties match your current filters'
          }
          action={
            properties.length === 0
              ? {
                  label: 'Create Property',
                  onClick: onCreateProperty,
                }
              : undefined
          }
        />
      ) : (
        <PropertyListTable
          properties={filteredProperties}
          onView={onViewProperty}
          onEdit={onEditProperty}
          onDelete={onDeleteProperty}
        />
      )}
    </div>
  );
}