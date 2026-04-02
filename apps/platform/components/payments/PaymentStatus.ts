'use client';

import { Badge } from '@newcondo/ui/components/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@newcondo/ui/components/tooltip';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  RotateCcw, 
  Lock, 
  ArrowRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PaymentStatus = 
  | 'PENDING' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'REFUNDED' 
  | 'HELD' 
  | 'RELEASED';

interface PaymentStatusProps {
  status: PaymentStatus;
  showIcon?: boolean;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
  className?: string;
}

// export function PaymentStatus({ 
//   status, 
//   showIcon = true, 
//   showTooltip = true,
//   size = 'md',
//   variant = 'default',
//   className 
// }: PaymentStatusProps) {
//   const getStatusConfig = (status: PaymentStatus) => {
//     switch (status) {
//       case 'PENDING':
//         return {
//           label: 'Pending',
//           description: 'Payment is being processed. This may take a few moments.',
//           icon: Clock,
//           color: 'bg-yellow-100 text-yellow-800'
//         };
//       case 'SUCCESS':
//         return {
//           label: 'Successful',
//           description: 'Payment was completed successfully.',
//           icon: CheckCircle,
//           color: 'bg-green-100 text-green-800'
//         };
//       case 'FAILED':
//         return {
//           label: 'Failed',
//           description: 'Payment failed due to an error.',
//           icon: XCircle,
//           color: 'bg-red-100 text-red-800'
//         };
//       case 'CANCELLED':
//         return {
//           label: 'Cancelled',
//           description: 'The payment transaction was cancelled by the user.',
//           icon: AlertCircle,
//           color: 'bg-gray-100 text-gray-800'
//         };
//       case 'REFUNDED':
//         return {
//           label: 'Refunded',
//           description: 'The payment has been fully or partially refunded.',
//           icon: RotateCcw,
//           color: 'bg-blue-100 text-blue-800'
//         };
//       case 'HELD':
//         return {
//           label: 'Held in Escrow',
//           description: 'Payment is held securely in an escrow account until the service is confirmed.',
//           icon: Lock,
//           color: 'bg-purple-100 text-purple-800'
//         };
//       case 'RELEASED':
//         return {
//           label: 'Released',
//           description: 'Funds have been released from escrow to the recipient.',
//           icon: ArrowRight,
//           color: 'bg-indigo-100 text-indigo-800'
//         };
//       default:
//         return {
//           label: 'Unknown',
//           description: 'The payment status is unknown or invalid.',
//           icon: Info,
//           color: 'bg-gray-100 text-gray-800'
//         };
//     }
//   };

//   const { label, description, icon: Icon, color } = getStatusConfig(status);

//   const badgeSizeClasses = cn({
//     'px-2 py-0.5 text-xs': size === 'sm',
//     'px-2.5 py-1 text-sm': size === 'md',
//     'px-3 py-1.5 text-base': size === 'lg',
//   });

//   const badgeVariantClasses = cn({
//     [`${color} border-transparent`]: variant === 'default',
//     [`bg-transparent border-current`]: variant === 'minimal',
//   });

//   const badgeContent = (
//     <div className="flex items-center gap-1.5">
//       {showIcon && <Icon className={cn("h-4 w-4", {
//         'h-3 w-3': size === 'sm',
//         'h-4 w-4': size === 'md',
//         'h-5 w-5': size === 'lg',
//       })} />}
//       <span>{label}</span>
//     </div>
//   );

//   const badgeComponent = (
//     <Badge
//       variant="outline"
//       className={cn(
//         "font-semibold uppercase tracking-wider",
//         badgeSizeClasses,
//         badgeVariantClasses,
//         className
//       )}
//     >
//       {badgeContent}
//     </Badge>
//   );

//   if (showTooltip) {
//     return (
//       <TooltipProvider>
//         <Tooltip>
//           <TooltipTrigger asChild>{badgeComponent}</TooltipTrigger>
//           <TooltipContent className="max-w-[200px] text-center">
//             <p>{description}</p>
//           </TooltipContent>
//         </Tooltip>
//       </TooltipProvider>
//     );
//   }

//   return badgeComponent;
// }

export function PaymentStatus({ 
  status, 
  showIcon = true, 
  showTooltip = true,
  size = 'md',
  variant = 'default',
  className 
}: PaymentStatusProps): JSX.Element {
  const getStatusConfig = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          label: 'Pending',
          description: 'Payment is being processed. This may take a few moments.',
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800'
        };
      case 'SUCCESS':
        return {
          label: 'Successful',
          description: 'Payment was completed successfully.',
          icon: CheckCircle,
          color: 'bg-green-100 text-green-800'
        };
      case 'FAILED':
        return {
          label: 'Failed',
          description: 'Payment failed due to an error.',
          icon: XCircle,
          color: 'bg-red-100 text-red-800'
        };
      case 'CANCELLED':
        return {
          label: 'Cancelled',
          description: 'The payment transaction was cancelled by the user.',
          icon: AlertCircle,
          color: 'bg-gray-100 text-gray-800'
        };
      case 'REFUNDED':
        return {
          label: 'Refunded',
          description: 'The payment has been fully or partially refunded.',
          icon: RotateCcw,
          color: 'bg-blue-100 text-blue-800'
        };
      case 'HELD':
        return {
          label: 'Held in Escrow',
          description: 'Payment is held securely in an escrow account until the service is confirmed.',
          icon: Lock,
          color: 'bg-purple-100 text-purple-800'
        };
      case 'RELEASED':
        return {
          label: 'Released',
          description: 'Funds have been released from escrow to the recipient.',
          icon: ArrowRight,
          color: 'bg-indigo-100 text-indigo-800'
        };
      default:
        return {
          label: 'Unknown',
          description: 'The payment status is unknown or invalid.',
          icon: Info,
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  const { label, description, icon: Icon, color } = getStatusConfig(status);

  const badgeSizeClasses = cn({
    'px-2 py-0.5 text-xs': size === 'sm',
    'px-2.5 py-1 text-sm': size === 'md',
    'px-3 py-1.5 text-base': size === 'lg',
  });

  const badgeVariantClasses = cn({
    [`${color} border-transparent`]: variant === 'default',
    ['bg-transparent border-current']: variant === 'minimal',
  });

  const iconSizeClass = cn({
    'h-3 w-3': size === 'sm',
    'h-4 w-4': size === 'md',
    'h-5 w-5': size === 'lg',
  });

  const badgeContent = (
    <div className="flex items-center gap-1.5">
      {showIcon && <Icon className={iconSizeClass} />}
      <span>{label}</span>
    </div>
  );

  const badgeComponent = (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold uppercase tracking-wider",
        badgeSizeClasses,
        badgeVariantClasses,
        className
      )}
    >
      {badgeContent}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badgeComponent}</TooltipTrigger>
          <TooltipContent className="max-w-[200px] text-center">
            <p>{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badgeComponent;
}