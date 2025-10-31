"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  FileCheck,
  CreditCard,
  BarChart3,
  MapPin,
  Copy,
  AlertTriangle,
  Settings,
  HelpCircle,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  label: string;
  icon: any;
  href: string;
  badge?: number;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
    { label: "Users", icon: Users, href: "/admin/users", badge: 23 },
    { label: "Properties", icon: Building2, href: "/admin/properties", badge: 15 },
    { label: "Verifications", icon: FileCheck, href: "/admin/verifications", badge: 42 },
    { label: "Payments", icon: CreditCard, href: "/admin/payments" },
    { label: "Analytics", icon: BarChart3, href: "/admin/analytics" },
    { label: "Marking Jobs", icon: MapPin, href: "/admin/marking", badge: 8 },
    { label: "Duplicates", icon: Copy, href: "/admin/duplicates", badge: 5 },
    { label: "Disputes", icon: AlertTriangle, href: "/admin/disputes", badge: 3 },
    { label: "Support", icon: HelpCircle, href: "/admin/support", badge: 12 },
    { label: "Settings", icon: Settings, href: "/admin/settings" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-white border-r transition-all duration-300",
          isOpen ? "w-64" : "w-20",
          "md:z-40"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {isOpen ? (
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <span className="font-bold text-xl">Newcondo</span>
            </Link>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold">N</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative group",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100",
                  !isOpen && "justify-center"
                )}
              >
                <Icon className={cn("flex-shrink-0", isOpen ? "h-5 w-5" : "h-6 w-6")} />
                {isOpen && (
                  <>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}

                {/* Tooltip for collapsed sidebar */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 bg-red-500 px-1.5 py-0.5 rounded-full text-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile (at bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors",
              !isOpen && "justify-center"
            )}
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0" />
            {isOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Admin User</p>
                <p className="text-xs text-gray-500 truncate">admin@newcondo.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}