// apps/admin/src/components/support/TicketPriority.tsx
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, Zap } from 'lucide-react';

interface TicketPriorityProps {
  priority: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function TicketPriority({
  priority,
  size = 'md',
  showIcon = true,
}: TicketPriorityProps) {
  const getPriorityConfig = (priority: string) => {
    const configs: Record<
      string,
      {
        label: string;
        className: string;
        icon: React.ReactNode;
      }
    > = {
      LOW: {
        label: 'Low',
        className: 'bg-gray-500 hover:bg-gray-600 text-white',
        icon: <Info className="h-3 w-3" />,
      },
      MEDIUM: {
        label: 'Medium',
        className: 'bg-blue-500 hover:bg-blue-600 text-white',
        icon: <AlertCircle className="h-3 w-3" />,
      },
      HIGH: {
        label: 'High',
        className: 'bg-orange-500 hover:bg-orange-600 text-white',
        icon: <AlertTriangle className="h-3 w-3" />,
      },
      URGENT: {
        label: 'Urgent',
        className: 'bg-red-500 hover:bg-red-600 text-white',
        icon: <Zap className="h-3 w-3" />,
      },
    };

    return configs[priority] || configs.MEDIUM;
  };

  const config = getPriorityConfig(priority);

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