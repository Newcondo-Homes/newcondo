// apps/platform/components/properties/UnitManagement.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Button } from '@newcondo/ui/components/button';
import { Badge } from '@newcondo/ui/components/badge';
import { Plus, LayoutGrid, List } from 'lucide-react';
import { UnitCard } from './UnitCard';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@newcondo/ui/components/select';

interface PropertyUnit {
  id: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  price: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'RESERVED';
  isAvailable: boolean;
  features: string[];
}

interface UnitManagementProps {
  propertyId: string;
  propertyTitle: string;
  units: PropertyUnit[];
  totalUnits: number;
  availableUnits: number;
  onAddUnit: () => void;
  onEditUnit: (unitId: string) => void;
  onDeleteUnit: (unitId: string) => void;
  onViewUnit: (unitId: string) => void;
}

export function UnitManagement({
  propertyId,
  propertyTitle,
  units,
  totalUnits,
  availableUnits,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
  onViewUnit,
}: UnitManagementProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredUnits = units.filter((unit) => {
    if (filterStatus === 'ALL') return true;
    return unit.status === filterStatus;
  });

  const statusCounts = {
    AVAILABLE: units.filter((u) => u.status === 'AVAILABLE').length,
    OCCUPIED: units.filter((u) => u.status === 'OCCUPIED').length,
    MAINTENANCE: units.filter((u) => u.status === 'MAINTENANCE').length,
    RESERVED: units.filter((u) => u.status === 'RESERVED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{propertyTitle}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Multi-family property with {totalUnits} units
              </p>
            </div>
            <Button onClick={onAddUnit}>
              <Plus className="h-4 w-4 mr-2" />
              Add Unit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold">{totalUnits}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-green-600">
                {statusCounts.AVAILABLE}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Occupied</p>
              <p className="text-2xl font-bold text-blue-600">
                {statusCounts.OCCUPIED}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Maintenance</p>
              <p className="text-2xl font-bold text-orange-600">
                {statusCounts.MAINTENANCE}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Reserved</p>
              <p className="text-2xl font-bold text-purple-600">
                {statusCounts.RESERVED}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters and View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Units</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="OCCUPIED">Occupied</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
              <SelectItem value="RESERVED">Reserved</SelectItem>
            </SelectContent>
          </Select>

          <Badge variant="outline">
            {filteredUnits.length} unit{filteredUnits.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Units List/Grid */}
      {filteredUnits.length === 0 ? (
        <EmptyState
          icon={Plus}
          title="No units found"
          description={
            units.length === 0
              ? 'Add units to start managing this multi-family property'
              : 'No units match your current filter'
          }
          action={
            units.length === 0
              ? {
                  label: 'Add Unit',
                  onClick: onAddUnit,
                }
              : undefined
          }
        />
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'
              : 'space-y-4'
          }
        >
          {filteredUnits.map((unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              onEdit={() => onEditUnit(unit.id)}
              onDelete={() => onDeleteUnit(unit.id)}
              onView={() => onViewUnit(unit.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}