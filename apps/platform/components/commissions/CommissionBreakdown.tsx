// apps/platform/components/commissions/CommissionBreakdown.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Badge } from '@newcondo/ui/components/badge';
import { Progress } from '@newcondo/ui/components/progress';
import {
  Home,
  Users,
  DollarSign,
  TrendingUp,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@newcondo/ui/components/tooltip';

interface PropertyCommission {
  propertyId: string;
  propertyTitle: string;
  totalRent: number;
  platformFee: number; // 20% of rent
  yourShare: number; // 50% of platform fee
  subAgentShare: number; // 50% of your share if sub-agent involved
  netEarnings: number;
  hasSubAgent: boolean;
  subAgentName?: string;
  status: 'PENDING' | 'RELEASED' | 'HELD';
}

interface CommissionBreakdownProps {
  commissions: PropertyCommission[];
  currency?: string;
}

export function CommissionBreakdown({
  commissions,
  currency = 'NGN',
}: CommissionBreakdownProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: PropertyCommission['status']) => {
    switch (status) {
      case 'RELEASED':
        return <Badge className="bg-green-500">Released</Badge>;
      case 'HELD':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            Held (24h period)
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            Pending
          </Badge>
        );
    }
  };

  const totalEarnings = commissions.reduce(
    (sum, c) => sum + c.netEarnings,
    0
  );
  const totalRent = commissions.reduce((sum, c) => sum + c.totalRent, 0);

  if (commissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            No commission data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Commission Breakdown</CardTitle>
        <div className="flex items-center gap-4 mt-2 text-sm">
          <div>
            <span className="text-muted-foreground">Total Rent:</span>
            <span className="font-semibold ml-2">
              {formatCurrency(totalRent)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Your Earnings:</span>
            <span className="font-semibold ml-2 text-green-600">
              {formatCurrency(totalEarnings)}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {commissions.map((commission) => (
          <Card key={commission.propertyId} className="border-2">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold">{commission.propertyTitle}</h4>
                  </div>
                  {commission.hasSubAgent && commission.subAgentName && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Sub-agent: {commission.subAgentName}</span>
                    </div>
                  )}
                </div>
                {getStatusBadge(commission.status)}
              </div>

              <div className="space-y-3">
                {/* Total Rent */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Rent</span>
                  <span className="font-medium">
                    {formatCurrency(commission.totalRent)}
                  </span>
                </div>

                {/* Platform Fee (20%) */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">
                      Platform Fee (20%)
                    </span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Newcondo takes 20% of the rent as platform fee</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-medium text-orange-600">
                    -{formatCurrency(commission.platformFee)}
                  </span>
                </div>

                <div className="border-t pt-3">
                  {/* Your Share (50% of platform fee) */}
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">
                        Your Commission Share
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              You receive 50% of the platform fee (10% of total
                              rent)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(commission.yourShare)}
                    </span>
                  </div>

                  {/* Sub-agent Share if applicable */}
                  {commission.hasSubAgent && (
                    <div className="flex items-center justify-between text-sm mb-2">
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">
                          Sub-agent Share (50%)
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3 w-3 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                Sub-agent receives 50% of your commission (5% of
                                total rent)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <span className="font-medium text-orange-600">
                        -{formatCurrency(commission.subAgentShare)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Net Earnings */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="font-semibold">Your Net Earnings</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(commission.netEarnings)}
                  </span>
                </div>

                {/* Visual Progress */}
                <div className="space-y-1">
                  <Progress
                    value={(commission.netEarnings / commission.totalRent) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {((commission.netEarnings / commission.totalRent) * 100).toFixed(
                      1
                    )}
                    % of total rent
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}