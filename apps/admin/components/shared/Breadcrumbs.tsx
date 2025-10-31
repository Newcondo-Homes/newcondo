"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const generateBreadcrumbs = () => {
    const crumbs = [{ label: "Home", href: "/admin/dashboard" }];

    let href = "";
    segments.forEach((segment, index) => {
      if (segment === "admin") return;
      href += `/${segment}`;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      crumbs.push({ label, href });
    });

    return crumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex items-center space-x-2 text-sm">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={crumb.href} className="flex items-center">
            {index === 0 && <Home className="h-4 w-4 mr-2 text-gray-400" />}
            {index > 0 && <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />}
            {isLast ? (
              <span className="font-medium text-gray-900">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}