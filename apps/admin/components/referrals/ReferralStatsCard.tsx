// apps/admin/src/components/referrals/ReferralStatsCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ReferralStatsCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  className?: string;
}

export default function ReferralStatsCard({
  title,
  value,
  icon,
  description,
  trend,
  trendDirection = "neutral",
  className,
}: ReferralStatsCardProps) {
  const getTrendColor = () => {
    switch (trendDirection) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-1">
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <Badge variant="outline" className={cn("text-xs", getTrendColor())}>
              {trend}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}