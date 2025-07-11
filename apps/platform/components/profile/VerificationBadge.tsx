import { Badge } from "@newcondo/ui/";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface VerificationBadgeProps {
  status: string;
  showIcon?: boolean;
}

export function VerificationBadge({
  status,
  showIcon = true,
}: VerificationBadgeProps) {
  const getBadgeConfig = () => {
    switch (status) {
      case "REJECTED":
        return {
          variant: "destructive" as const,
          label: "Rejected",
          icon: <XCircle className="h-3 w-3" />,
        };
      case "PENDING":
      default:
        return {
          variant: "secondary" as const,
          label: "Pending",
          icon: <Clock className="h-3 w-3" />,
        };
      case "VERIFIED":
        return {
          variant: "default" as const,
          label: "Verified",
          icon: <CheckCircle className="h-3 w-3" />,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {showIcon && config.icon}
      {config.label}
    </Badge>
  );
}
