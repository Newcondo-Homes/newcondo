'use client';

import { useTranslations } from 'next-intl';

export function LoginContent({ keyPrefix, className }: { keyPrefix: string; className?: string }) {
  const t = useTranslations('auth');
  return <span className={className}>{t(keyPrefix)}</span>;
}