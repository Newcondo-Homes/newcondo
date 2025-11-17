'use client';

import { createContext, useContext, ReactNode } from 'react';
import { type Locale } from '@/i18n';

interface LocaleContextType {
  locale: Locale;
  direction: 'ltr' | 'rtl';
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({
  children,
  locale,
  direction = 'ltr',
}: {
  children: ReactNode;
  locale: Locale;
  direction?: 'ltr' | 'rtl';
}) {
  return (
    <LocaleContext.Provider value={{ locale, direction }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocaleContext must be used within LocaleProvider');
  }
  return context;
}