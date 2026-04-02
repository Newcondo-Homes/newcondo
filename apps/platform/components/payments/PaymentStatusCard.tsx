"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/components/card";
import { Badge } from "@newcondo/ui/components/badge";
import { Progress } from "@newcondo/ui/components/progress";
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PaymentStatusCardProps {
  status: "HELD" | "RELEASED" | "REFUNDED" | "PENDING" | "FAILED";
  amount: number;
  currency?: string;
  confirmationPeriodEnd?: Date;
  isReleased: boolean;
  releasedAt?: Date;
  description?: string;
  className?: string;
}

export function PaymentStatusCard({
  status,
  amount,
  currency = "NGN",
  confirmationPeriodEnd,
  isReleased,
  releasedAt,
  description,
  className,
}: PaymentStatusCardProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "HELD":
        return {
          icon: Lock,
          label: "Payment Held",
          variant: "secondary" as const,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          description:
            "Your payment is securely held during the confirmation period",
        };
      case "RELEASED":
        return {
          icon: Unlock,
          label: "Payment Released",
          variant: "success" as const,
          color: "text-green-600",
          bgColor: "bg-green-50",
          description: "Payment has been released to respective parties",
        };
      case "REFUNDED":
        return {
          icon: CheckCircle2,
          label: "Refunded",
          variant: "default" as const,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          description: "Payment has been refunded to your account",
        };
      case "FAILED":
        return {
          icon: XCircle,
          label: "Payment Failed",
          variant: "destructive" as const,
          color: "text-red-600",
          bgColor: "bg-red-50",
          description: "Payment could not be processed",
        };
      default:
        return {
          icon: HelpCircle,
          label: "Pending",
          variant: "outline" as const,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          description: "Payment is being processed",
        };
    }
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;

  // Calculate time remaining for held payments
  const getTimeRemaining = () => {
    if (!confirmationPeriodEnd) return null;

    const now = new Date();
    const end = new Date(confirmationPeriodEnd);
    const totalMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const remainingMs = end.getTime() - now.getTime();

    if (remainingMs <= 0) return null;

    const percentage = ((totalMs - remainingMs) / totalMs) * 100;
    return {
      text: formatDistanceToNow(end, { addSuffix: true }),
      percentage: Math.min(100, Math.max(0, percentage)),
    };
  };

  const timeRemaining = status === "HELD" ? getTimeRemaining() : null;

  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Payment Status</CardTitle>
          <Badge variant={config.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Display */}
        <div className={`p-4 rounded-lg ${config.bgColor}`}>
          <p className="text-sm text-muted-foreground mb-1">Amount</p>
          <p className={`text-2xl font-bold ${config.color}`}>
            {formatAmount(amount)}
          </p>
        </div>

        {/* Status Description */}
        <p className="text-sm text-muted-foreground">
          {description || config.description}
        </p>

        {/* Confirmation Period Progress (for HELD status) */}
        {status === "HELD" && timeRemaining && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Confirmation Period
              </span>
              <span className="font-medium">{timeRemaining.text}</span>
            </div>
            <Progress value={timeRemaining.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              You have until{" "}
              {confirmationPeriodEnd
                ? new Date(confirmationPeriodEnd).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "N/A"}{" "}
              to confirm or dispute this payment
            </p>
          </div>
        )}

        {/* Release Information */}
        {isReleased && releasedAt && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>
                Released{" "}
                {formatDistanceToNow(new Date(releasedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </div>
        )}

        {/* Additional Info for Different Statuses */}
        {status === "HELD" && (
          <div className="pt-4 border-t">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Funds are securely held in virtual accounts</li>
                  <li>You can confirm or dispute within 24 hours</li>
                  <li>After confirmation period, funds are auto-released</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {status === "REFUNDED" && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Note: Platform service fees are non-refundable as per our terms of
              service.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}