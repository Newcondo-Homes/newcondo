'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Globe, Check } from 'lucide-react';
import { locales, localeLabels, type Locale } from '../../../i18n';

export default function AdminLanguageSwitcher() {
  const t = useTranslations('common.languageSwitcher');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      // Remove current locale from pathname and add new locale
      const pathWithoutLocale = pathname.replace(`/${locale}`, '');
      const newPath = `/${newLocale}${pathWithoutLocale}`;
      
      router.replace(newPath);
      setIsOpen(false);
    });
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        aria-label={t('ariaLabel')}
        disabled={isPending}
      >
        <Globe className="w-4 h-4" />
        <span>{localeLabels[locale as Locale]}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 z-20 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="py-1">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  disabled={isPending}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    locale === loc
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="font-medium">{localeLabels[loc]}</span>
                  {locale === loc && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                {t('footer')}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Loading Indicator */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-lg">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}