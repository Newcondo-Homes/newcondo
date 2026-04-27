import { Card, CardContent } from '@newcondo/ui/components/card';
import { TrendingUp, Clock, RotateCcw, AlertCircle, Receipt } from 'lucide-react';

interface Stats {
  totalPaid: number;
  totalHeld: number;
  totalRefunded: number;
  pendingConfirmations: number;
  totalTransactions: number;
}

interface PaymentStatsProps {
  stats: Stats;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

export function PaymentStats({ stats }: PaymentStatsProps) {
  const cards = [
    {
      label: 'Total Paid',
      value: formatCurrency(stats.totalPaid),
      icon: TrendingUp,
      iconClass: 'text-green-600',
      bgClass: 'bg-green-50',
    },
    {
      label: 'Held in Escrow',
      value: formatCurrency(stats.totalHeld),
      icon: Clock,
      iconClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
    },
    {
      label: 'Total Refunded',
      value: formatCurrency(stats.totalRefunded),
      icon: RotateCcw,
      iconClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
    },
    {
      label: 'Pending Confirmation',
      value: stats.pendingConfirmations.toString(),
      icon: AlertCircle,
      iconClass: 'text-red-600',
      bgClass: 'bg-red-50',
    },
    {
      label: 'Total Transactions',
      value: stats.totalTransactions.toString(),
      icon: Receipt,
      iconClass: 'text-purple-600',
      bgClass: 'bg-purple-50',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map(({ label, value, icon: Icon, iconClass, bgClass }) => (
        <Card key={label}>
          <CardContent className="flex flex-col gap-3 pt-5 pb-5">
            <div className={`w-fit rounded-md p-2 ${bgClass}`}>
              <Icon className={`h-4 w-4 ${iconClass}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-lg font-semibold leading-tight">{value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}