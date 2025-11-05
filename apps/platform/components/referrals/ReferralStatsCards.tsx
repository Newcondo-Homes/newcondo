// apps/platform/components/referrals/ReferralStatsCards.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PropertyReferralStats {
  propertyId: string;
  propertyTitle: string;
  totalSubAgents: number;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  totalReferralEarnings: number;
  topPerformer?: {
    name: string;
    conversions: number;
  };
}

interface ReferralStatsCardsProps {
  properties: PropertyReferralStats[];
  currency?: string;
  onViewProperty?: (propertyId: string) => void;
}

export function ReferralStatsCards({
  properties,
  currency = 'NGN',
  onViewProperty,
}: ReferralStatsCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No referral data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <Card
          key={property.propertyId}
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => onViewProperty?.(property.propertyId)}
        >
          <CardHeader>
            <CardTitle className="text-base line-clamp-1">
              {property.propertyTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Sub-Agents</p>
                <p className="text-2xl font-bold">{property.totalSubAgents}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Views</p>
                <p className="text-2xl font-bold">
                  {property.totalViews.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Conversion Rate */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Conversion Rate</span>
                <div className="flex items-center gap-1">
                  {property.conversionRate >= 5 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-semibold">
                    {property.conversionRate}%
                  </span>
                </div>
              </div>
              <Progress value={property.conversionRate} className="h-2" />
            </div>

            {/* Conversions */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversions</span>
                <span className="font-semibold">{property.totalConversions}</span>
              </div>
            </div>

            {/* Earnings */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Referral Earnings
                </span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(property.totalReferralEarnings)}
                </span>
              </div>
            </div>

            {/* Top Performer */}
            {property.topPerformer && (
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">
                  Top Performer
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {property.topPerformer.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {property.topPerformer.conversions} conversions
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}