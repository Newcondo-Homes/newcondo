"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Building2,
  Users,
  Home,
  DollarSign,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CommissionBreakdownProps {
  totalAmount: number;
  rentAmount: number;
  platformCommission: number;
  platformServiceFee: number;
  listingAgentCommission?: number;
  subAgentCommission?: number;
  propertyOwnerAmount: number;
  currency?: string;
  hasListingAgent: boolean;
  hasSubAgent: boolean;
  className?: string;
}

export function CommissionBreakdown({
  totalAmount,
  rentAmount,
  platformCommission,
  platformServiceFee,
  listingAgentCommission = 0,
  subAgentCommission = 0,
  propertyOwnerAmount,
  currency = "NGN",
  hasListingAgent,
  hasSubAgent,
  className,
}: CommissionBreakdownProps) {
  const formatAmount = (value: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number, total: number) => {
    return ((value / total) * 100).toFixed(1);
  };

  const breakdownItems = [
    {
      icon: Home,
      label: "Rent Amount",
      amount: rentAmount,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      isMain: true,
    },
    {
      icon: DollarSign,
      label: "Platform Service Fee",
      amount: platformServiceFee,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      tooltip: "Non-refundable transaction processing fee",
    },
  ];

  const distributionItems = [
    {
      icon: Building2,
      label: "Platform Commission",
      amount: platformCommission,
      percentage: formatPercentage(platformCommission, rentAmount),
      color: "text-green-600",
      bgColor: "bg-green-50",
      tooltip: hasListingAgent
        ? "10% of rent (50% of total 20% commission)"
        : "20% of rent (full commission)",
    },
  ];

  if (hasListingAgent) {
    if (hasSubAgent) {
      distributionItems.push({
        icon: Users,
        label: "Listing Agent",
        amount: listingAgentCommission,
        percentage: formatPercentage(listingAgentCommission, rentAmount),
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        tooltip: "5% of rent (25% of agent share)",
      });
      distributionItems.push({
        icon: Users,
        label: "Sub-Agent",
        amount: subAgentCommission,
        percentage: formatPercentage(subAgentCommission, rentAmount),
        color: "text-amber-600",
        bgColor: "bg-amber-50",
        tooltip: "5% of rent (25% of agent share)",
      });
    } else {
      distributionItems.push({
        icon: Users,
        label: "Listing Agent",
        amount: listingAgentCommission,
        percentage: formatPercentage(listingAgentCommission, rentAmount),
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        tooltip: "10% of rent (50% of total commission)",
      });
    }
  }

  distributionItems.push({
    icon: Home,
    label: "Property Owner",
    amount: propertyOwnerAmount,
    percentage: formatPercentage(propertyOwnerAmount, rentAmount),
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    tooltip: "Net amount after commission deduction",
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Commission Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Amount */}
        <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground mb-1">Total Payment</p>
          <p className="text-3xl font-bold text-primary">
            {formatAmount(totalAmount)}
          </p>
        </div>

        {/* Payment Composition */}
        <div>
          <h4 className="text-sm font-medium mb-3">Payment Composition</h4>
          <div className="space-y-3">
            {breakdownItems.map((item, index) => {
              const ItemIcon = item.icon;
              return (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${item.bgColor}`}
                >
                  <div className="flex items-center gap-3">
                    <ItemIcon className={`h-4 w-4 ${item.color}`} />
                    <div>
                      <p
                        className={`text-sm font-medium ${
                          item.isMain ? "text-base" : ""
                        }`}
                      >
                        {item.label}
                      </p>
                      {item.tooltip && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                <Info className="h-3 w-3" />
                                Info
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{item.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      item.isMain ? "text-lg" : "text-sm"
                    } ${item.color}`}
                  >
                    {formatAmount(item.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Commission Distribution */}
        <div>
          <h4 className="text-sm font-medium mb-3">
            Commission Distribution (from Rent)
          </h4>
          <div className="space-y-3">
            {distributionItems.map((item, index) => {
              const ItemIcon = item.icon;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ItemIcon className={`h-4 w-4 ${item.color}`} />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                        {item.tooltip && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{item.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${item.color}`}>
                        {formatAmount(item.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.percentage}% of rent
                      </p>
                    </div>
                  </div>
                  {index < distributionItems.length - 1 && (
                    <div className="w-full bg-border h-px" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total Distributed:</span>
            <span className="font-medium">
              {formatAmount(
                platformCommission +
                  listingAgentCommission +
                  subAgentCommission +
                  propertyOwnerAmount
              )}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            * Commissions are automatically distributed after the 24-hour
            confirmation period
          </p>
        </div>
      </CardContent>
    </Card>
  );
}