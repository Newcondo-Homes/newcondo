import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';

export default function AuthLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div>
          <Link href={`/${locale}`} className="text-3xl font-bold">
            Newcondo
          </Link>
        </div>
        
        <div className="space-y-4">
          <AuthContent keyPrefix="branding.tagline" className="text-4xl font-bold" />
          <AuthContent keyPrefix="branding.description" className="text-lg text-white/90" />
        </div>

        <div className="text-sm text-white/70">
          <AuthContent keyPrefix="branding.footer" />
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b">
          <Link href={`/${locale}`} className="text-2xl font-bold text-primary">
            Newcondo
          </Link>
          <LanguageSwitcher />
        </div>

        {/* Language switcher for desktop */}
        <div className="hidden lg:flex justify-end p-4">
          <LanguageSwitcher />
        </div>

        {/* Auth content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthContent({ keyPrefix, className }: { keyPrefix: string; className?: string }) {
  const t = useTranslations('auth');
  return <p className={className}>{t(keyPrefix)}</p>;
}