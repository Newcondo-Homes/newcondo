import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import { locales, rtlLocales } from '@newcondo/i18n';
import { Providers } from '@/components/providers';
import { Toaster } from '@newcondo/ui';
import '@/app/globals.css';

const inter = Inter({ subsets: ['latin'] });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'metadata' });

  return {
    title: {
      template: `%s | ${t('siteName')}`,
      default: t('siteName'),
    },
    description: t('siteDescription'),
    keywords: t('keywords'),
    authors: [{ name: 'Newcondo' }],
    creator: 'Newcondo',
    publisher: 'Newcondo',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    alternates: {
      canonical: '/',
      languages: {
        en: '/en',
        fr: '/fr',
        pcm: '/pcm',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale,
      url: '/',
      title: t('siteName'),
      description: t('siteDescription'),
      siteName: t('siteName'),
    },
    twitter: {
      card: 'summary_large_image',
      title: t('siteName'),
      description: t('siteDescription'),
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get messages for this locale
  const messages = await getMessages();

  // Check if RTL
  const isRTL = rtlLocales.includes(locale as any);

  return (
    <html lang={locale} dir={isRTL ? 'rtl' : 'ltr'} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}