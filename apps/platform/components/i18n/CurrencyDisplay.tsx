'use client';

import { formatCurrency } from '@/lib/utils/currency';
// import { type Locale } from '@/i18n';

interface CurrencyDisplayProps {
  amount: number;
  locale: string;
  currency?: string;
  className?: string;
  showSymbol?: boolean;
}

export function CurrencyDisplay({
  amount,
  locale,
  currency = 'NGN',
  className,
  showSymbol = true,
}: CurrencyDisplayProps) {
  const formatted = formatCurrency(amount, currency, { showSymbol, locale });

  return <span className={className}>{formatted}</span>;
}