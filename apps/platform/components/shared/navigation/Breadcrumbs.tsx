'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@newcondo/ui/lib/utils';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
    >
      <Link
        href="/dashboard"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={item.href} className="flex items-center space-x-1">
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}