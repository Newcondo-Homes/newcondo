// apps/platform/components/marketing/PropertyPromotionCard.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Button } from '@newcondo/ui/components/button';
import { Progress } from '@newcondo/ui/components/progress';
import {
  TrendingUp,
  Eye,
  Users,
  DollarSign,
  Share2,
  ExternalLink,
} from 'lucide-react';

interface PromotionStats {
  totalViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  totalShares: number;
  potentialRevenue: number;
}

interface PropertyPromotionCardProps {
  propertyId: string;
  propertyTitle: string;
  isPromoted: boolean;
  promotionType: 'PUBLIC' | 'PERMISSION_BASED' | 'RESTRICTED' | 'REQUEST_BASED';
  stats?: PromotionStats;
  onViewDetails?: () => void;
}

export function PropertyPromotionCard({
  propertyTitle,
  isPromoted,
  promotionType,
  stats,
  onViewDetails,
}: PropertyPromotionCardProps) {
  const getPromotionBadge = () => {
    if (!isPromoted) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700">
          Not Promoted
        </Badge>
      );
    }

    switch (promotionType) {
      case 'PUBLIC':
        return <Badge className="bg-green-500">Public Promotion</Badge>;
      case 'PERMISSION_BASED':
        return <Badge className="bg-blue-500">Permission-Based</Badge>;
      case 'REQUEST_BASED':
        return <Badge className="bg-purple-500">Request-Based</Badge>;
      case 'RESTRICTED':
        return <Badge variant="destructive">Restricted</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{propertyTitle}</CardTitle>
            {getPromotionBadge()}
          </div>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPromoted && stats ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>Total Views</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Unique Visitors</span>
                </div>
                <p className="text-2xl font-bold">{stats.uniqueVisitors}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                  <span>Total Shares</span>
                </div>
                <p className="text-2xl font-bold">{stats.totalShares}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Potential Revenue</span>
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.potentialRevenue)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Conversion Rate</span>
                <span className="font-medium">{stats.conversionRate}%</span>
              </div>
              <Progress value={stats.conversionRate} className="h-2" />
            </div>

            {onViewDetails && (
              <Button onClick={onViewDetails} variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Detailed Analytics
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isPromoted
                ? 'No promotion data available yet'
                : 'Enable promotion to start tracking performance'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}