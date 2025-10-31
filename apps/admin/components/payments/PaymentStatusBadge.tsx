// apps/admin/src/components/payments/PaymentStatusBadge.tsx
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  XCircle,
  Ban,
  RefreshCw,
  Lock,
  Unlock,
} from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function PaymentStatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: PaymentStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      {
        label: string;
        className: string;
        icon: React.ReactNode;
      }
    > = {
      SUCCESS: {
        label: 'Success',
        className: 'bg-green-500 hover:bg-green-600 text-white',
        icon: <CheckCircle className="h-3 w-3" />,
      },
      PENDING: {
        label: 'Pending',
        className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        icon: <Clock className="h-3 w-3" />,
      },
      FAILED: {
        label: 'Failed',
        className: 'bg-red-500 hover:bg-red-600 text-white',
        icon: <XCircle className="h-3 w-3" />,
      },
      CANCELLED: {
        label: 'Cancelled',
        className: 'bg-gray-500 hover:bg-gray-600 text-white',
        icon: <Ban className="h-3 w-3" />,
      },
      REFUNDED: {
        label: 'Refunded',
        className: 'bg-purple-500 hover:bg-purple-600 text-white',
        icon: <RefreshCw className="h-3 w-3" />,
      },
      HELD: {
        label: 'Held',
        className: 'bg-blue-500 hover:bg-blue-600 text-white',
        icon: <Lock className="h-3 w-3" />,
      },
      RELEASED: {
        label: 'Released',
        className: 'bg-emerald-500 hover:bg-emerald-600 text-white',
        icon: <Unlock className="h-3 w-3" />,
      },
    };

    return configs[status] || configs.PENDING;
  };

  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <Badge className={`${config.className} ${sizeClasses[size]}`}>
      {showIcon && <span className="mr-1.5">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}