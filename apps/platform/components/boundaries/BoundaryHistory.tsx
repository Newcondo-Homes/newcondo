// apps/platform/components/boundaries/BoundaryHistory.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  User,
  Clock,
  CheckCircle,
  Edit,
  AlertTriangle,
} from 'lucide-react';

interface BoundaryChange {
  id: string;
  action: 'CREATED' | 'UPDATED' | 'VERIFIED' | 'DISPUTED';
  performedBy: string;
  performedByName: string;
  timestamp: Date;
  notes?: string;
  coordinatesCount: number;
  isVerified: boolean;
}

interface BoundaryHistoryProps {
  changes: BoundaryChange[];
  onViewChange?: (changeId: string) => void;
}

export function BoundaryHistory({
  changes,
  onViewChange,
}: BoundaryHistoryProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionIcon = (action: BoundaryChange['action']) => {
    switch (action) {
      case 'CREATED':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'UPDATED':
        return <Edit className="h-4 w-4 text-orange-500" />;
      case 'VERIFIED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'DISPUTED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getActionBadge = (action: BoundaryChange['action']) => {
    switch (action) {
      case 'CREATED':
        return <Badge className="bg-blue-500">Created</Badge>;
      case 'UPDATED':
        return <Badge className="bg-orange-500">Updated</Badge>;
      case 'VERIFIED':
        return <Badge className="bg-green-500">Verified</Badge>;
      case 'DISPUTED':
        return <Badge variant="destructive">Disputed</Badge>;
    }
  };

  if (changes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No boundary change history available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Boundary Change History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {changes.map((change, index) => (
            <div
              key={change.id}
              className={`relative pb-4 ${
                index !== changes.length - 1 ? 'border-b' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                  {getActionIcon(change.action)}
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getActionBadge(change.action)}
                    {change.isVerified && (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {change.performedByName}
                      </span>
                      <span className="text-muted-foreground">
                        marked {change.coordinatesCount} boundary points
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(change.timestamp)}</span>
                    </div>

                    {change.notes && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {change.notes}
                      </p>
                    )}
                  </div>

                  {onViewChange && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewChange(change.id)}
                      className="mt-2"
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}