"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@newcondo/ui/card";
import { Button } from "@newcondo/ui/button";
import { 
  UserCheck, Home, AlertCircle, FileText, 
  TrendingUp, Settings, Users, CreditCard 
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
}

export function QuickActions() {
  const router = useRouter();

  const quickActions: QuickAction[] = [
    {
      title: "Verify Users",
      description: "Review pending user verifications",
      icon: UserCheck,
      href: "/admin/verifications",
      color: "text-blue-600",
      bgColor: "bg-blue-100 hover:bg-blue-200",
    },
    {
      title: "Approve Properties",
      description: "Review property listings",
      icon: Home,
      href: "/admin/properties",
      color: "text-green-600",
      bgColor: "bg-green-100 hover:bg-green-200",
    },
    {
      title: "Support Tickets",
      description: "Respond to user issues",
      icon: AlertCircle,
      href: "/admin/support",
      color: "text-orange-600",
      bgColor: "bg-orange-100 hover:bg-orange-200",
    },
    {
      title: "Marking Jobs",
      description: "Oversee property marking",
      icon: FileText,
      href: "/admin/marking-jobs",
      color: "text-purple-600",
      bgColor: "bg-purple-100 hover:bg-purple-200",
    },
    {
      title: "Analytics",
      description: "View platform insights",
      icon: TrendingUp,
      href: "/admin/analytics",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 hover:bg-emerald-200",
    },
    {
      title: "User Management",
      description: "Manage all users",
      icon: Users,
      href: "/admin/users",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 hover:bg-indigo-200",
    },
    {
      title: "Payments",
      description: "Monitor transactions",
      icon: CreditCard,
      href: "/admin/payments",
      color: "text-pink-600",
      bgColor: "bg-pink-100 hover:bg-pink-200",
    },
    {
      title: "Settings",
      description: "Configure platform",
      icon: Settings,
      href: "/admin/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-100 hover:bg-gray-200",
    },
  ];

  const handleActionClick = (href: string) => {
    router.push(href);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className={`h-auto flex flex-col items-center justify-center p-4 space-y-2 ${action.bgColor} border-none transition-colors`}
                onClick={() => handleActionClick(action.href)}
              >
                <div className={`p-3 rounded-full bg-white`}>
                  <Icon className={`h-6 w-6 ${action.color}`} />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}