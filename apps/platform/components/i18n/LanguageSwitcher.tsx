'use client';

import { useTransition } from 'react';
// import { useLocale } from 'next-intl';
import { useLocale } from '@newcondo/i18n';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '@newcondo/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@newcondo/ui/components/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';

export function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const {locale: currentLocale, changeLocale} = useLocale();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === currentLocale) return;

    startTransition(() => {
      // Replace the locale in the pathname
      changeLocale(newLocale);
      
      const segments = pathname.split('/');
      segments[1] = newLocale;
      const newPathname = segments.join('/');
      
      router.replace(newPathname);
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          <Globe className="h-4 w-4 mr-2" />
          {localeNames[currentLocale as Locale]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className="flex items-center justify-between"
          >
            <span>{localeNames[locale]}</span>
            {locale === currentLocale && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}