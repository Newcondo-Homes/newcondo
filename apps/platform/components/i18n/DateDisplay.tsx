'use client';

import { formatLocaleDate, formatRelativeLocaleTime} from '@/lib/utils/locale';
import { type Locale,  } from '@newcondo/i18n'

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

  const formatOptions: Intl.DateTimeFormatOptions =
    format === 'short' ? { year: 'numeric', month: 'short', day: 'numeric' } :
    format === 'long'  ? { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' } :
    format === 'full'  ? { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: 'numeric', minute: 'numeric' } :
                         { year: 'numeric', month: 'long', day: 'numeric' };

  const formatted =
    format === 'relative'
      ? formatRelativeLocaleTime(dateObj, locale as Locale)
      : formatLocaleDate(dateObj, locale as Locale, formatOptions);


  return <time dateTime={dateObj.toISOString()} className={className}>{formatted}</time>;
}