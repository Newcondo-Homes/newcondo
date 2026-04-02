// apps/platform/components/properties/UnitCard.tsx
'use client';

import { Card, CardContent, CardHeader } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@newcondo/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@newcondo/ui/components/dropdown-menu';
import {
  DollarSign,
  Bed,
  Bath,
  Maximize,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ArrowUpCircle,
} from 'lucide-react';

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

interface UnitCardProps {
  unit: PropertyUnit;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function UnitCard({ unit, onView, onEdit, onDelete }: UnitCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: PropertyUnit['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-green-500">Available</Badge>;
      case 'OCCUPIED':
        return <Badge className="bg-blue-500">Occupied</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-orange-500">Maintenance</Badge>;
      case 'RESERVED':
        return <Badge className="bg-purple-500">Reserved</Badge>;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">Unit {unit.unitNumber}</h3>
            {unit.floor !== undefined && (
              <p className="text-sm text-muted-foreground">
                <ArrowUpCircle className="h-3 w-3 inline mr-1" />
                Floor {unit.floor}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(unit.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Unit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Unit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Monthly Rent</span>
          </div>
          <span className="text-xl font-bold">{formatCurrency(unit.price)}</span>
        </div>

        {/* Unit Details */}
        <div className="grid grid-cols-3 gap-2">
          {unit.bedrooms !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <span>{unit.bedrooms} Bed</span>
            </div>
          )}
          {unit.bathrooms !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <span>{unit.bathrooms} Bath</span>
            </div>
          )}
          {unit.area && (
            <div className="flex items-center gap-2 text-sm">
              <Maximize className="h-4 w-4 text-muted-foreground" />
              <span>{unit.area}</span>
            </div>
          )}
        </div>

        {/* Features */}
        {unit.features.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {unit.features.slice(0, 3).map((feature) => (
              <Badge key={feature} variant="outline" className="text-xs">
                {feature}
              </Badge>
            ))}
            {unit.features.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{unit.features.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Action Button */}
        <Button onClick={onView} variant="outline" className="w-full">
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}