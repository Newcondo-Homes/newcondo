// apps/admin/src/components/payments/CommissionBreakdown.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, DollarSign, Users, Building2 } from 'lucide-react';

interface CommissionBreakdownProps {
  totalAmount: number;
  agentCommission?: number;
  platformFee?: number;
  ownerAmount?: number;
  currency: string;
}

export default function CommissionBreakdown({
  totalAmount,
  agentCommission,
  platformFee,
  ownerAmount,
  currency,
}: CommissionBreakdownProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency || 'NGN',
    }).format(amount);
  };

  const formatPercentage = (amount: number, total: number) => {
    return ((amount / total) * 100).toFixed(1);
  };

  const breakdownItems = [
    {
      label: 'Agent Commission',
      amount: agentCommission,
      icon: <Users className="h-5 w-5 text-green-500" />,
      color: 'bg-green-500',
    },
    {
      label: 'Platform Fee',
      amount: platformFee,
      icon: <Building2 className="h-5 w-5 text-blue-500" />,
      color: 'bg-blue-500',
    },
    {
      label: 'Owner Amount',
      amount: ownerAmount,
      icon: <TrendingUp className="h-5 w-5 text-purple-500" />,
      color: 'bg-purple-500',
    },
  ].filter(item => item.amount !== undefined && item.amount > 0);

  // Calculate total distributed
  const totalDistributed =
    (agentCommission || 0) + (platformFee || 0) + (ownerAmount || 0);

  const hasBreakdown = breakdownItems.length > 0;

  if (!hasBreakdown) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Commission Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Total Amount */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-700">Total Amount</span>
            </div>
            <span className="text-2xl font-bold">{formatAmount(totalAmount)}</span>
          </div>

          <Separator />

          {/* Breakdown Items */}
          <div className="space-y-4">
            {breakdownItems.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {item.icon}
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatAmount(item.amount!)}</p>
                    <p className="text-xs text-gray-500">
                      {formatPercentage(item.amount!, totalAmount)}%
                    </p>
                  </div>
                </div>
                <Progress
                  value={(item.amount! / totalAmount) * 100}
                  className={`h-2 ${item.color}`}
                />
              </div>
            ))}
          </div>

          {/* Verification */}
          {totalDistributed !== totalAmount && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Total distributed (
                {formatAmount(totalDistributed)}) does not equal the total amount (
                {formatAmount(totalAmount)}).
              </p>
            </div>
          )}

          <Separator />

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {agentCommission !== undefined && agentCommission > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Agent</p>
                <p className="font-semibold text-green-600">
                  {formatAmount(agentCommission)}
                </p>
              </div>
            )}
            {platformFee !== undefined && platformFee > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Platform</p>
                <p className="font-semibold text-blue-600">
                  {formatAmount(platformFee)}
                </p>
              </div>
            )}
            {ownerAmount !== undefined && ownerAmount > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Owner</p>
                <p className="font-semibold text-purple-600">
                  {formatAmount(ownerAmount)}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}