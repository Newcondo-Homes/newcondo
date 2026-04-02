'use client';

import { ReactNode } from 'react';
// import { useLocale } from 'next-intl';
import { useLocale } from '@newcondo/i18n';

import { rtlLocales } from '@/i18n';
import { cn } from '@/lib/utils';

interface RTLWrapperProps {
  children: ReactNode;
  className?: string;
}

export function RTLWrapper({ children, className }: RTLWrapperProps) {
  const locale = useLocale();
  const isRTL = rtlLocales.includes(locale as any);

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        isRTL && 'rtl-layout',
        className
      )}
    >
      {children}
    </div>
  );
}

// Hook to check if current locale is RTL
export function useIsRTL(): boolean {
  const locale = useLocale();
  return rtlLocales.includes(locale as any);
}