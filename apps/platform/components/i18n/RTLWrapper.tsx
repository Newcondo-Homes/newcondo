'use client';

import { ReactNode } from 'react';
import { useLocale } from '@newcondo/i18n/hooks/useLocale';
import { cn } from '@/lib/utils';

interface RTLWrapperProps {
  children: ReactNode;
  className?: string;
}

export function RTLWrapper({ children, className }: RTLWrapperProps) {
  // ✅ Destructure from LocaleContext — isRTL is already computed in the hook
  const { isRTL } = useLocale();

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(isRTL && 'rtl-layout', className)}
    >
      {children}
    </div>
  );
}

export function useIsRTL(): boolean {
  // ✅ isRTL is already a boolean on LocaleContext — no need to recompute
  const { isRTL } = useLocale();
  return isRTL;
}