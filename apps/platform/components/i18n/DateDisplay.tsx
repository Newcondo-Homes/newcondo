'use client';

import { formatDate, formatRelativeTime } from '@/lib/utils/locale';
import { type Locale } from '@/i18n';

interface DateDisplayProps {
  date: Date | string;
  locale: string;
  format?: 'short' | 'medium' | 'long' | 'full' | 'relative';
  className?: string;
}

export function DateDisplay({
  date,
  locale,
  format = 'medium',
  className,
}: DateDisplayProps) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const formatted =
    format === 'relative'
      ? formatRelativeTime(dateObj, locale as Locale)
      : formatDate(dateObj, locale as Locale, format);

  return <time dateTime={dateObj.toISOString()} className={className}>{formatted}</time>;
}