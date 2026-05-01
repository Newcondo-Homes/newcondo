import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import LoginForm  from '@/components/auth/LoginForm';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: t('login.title'),
    description: t('login.description'),
  };
}

export default function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <LoginContent keyPrefix="login.title" className="text-3xl font-bold" />
        <LoginContent keyPrefix="login.subtitle" className="text-muted-foreground" />
      </div>

      // TODO: see if you'll pass locale to loginform for internationalization
      {/* <LoginForm locale={locale} /> */}
      <LoginForm  />


      <div className="text-center text-sm">
        <LoginContent keyPrefix="login.noAccount" className="text-muted-foreground inline" />
        {' '}
        <Link
          href={`/${locale}/register`}
          className="font-medium text-primary hover:underline"
        >
          <LoginContent keyPrefix="login.signUpLink" className="inline" />
        </Link>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            <LoginContent keyPrefix="login.orContinueWith" />
          </span>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        <LoginContent keyPrefix="login.terms" />
        {' '}
        <Link href={`/${locale}/terms`} className="underline hover:text-primary">
          <LoginContent keyPrefix="login.termsLink" className="inline" />
        </Link>
        {' '}
        <LoginContent keyPrefix="login.and" />
        {' '}
        <Link href={`/${locale}/privacy`} className="underline hover:text-primary">
          <LoginContent keyPrefix="login.privacyLink" className="inline" />
        </Link>
      </div>
    </div>
  );
}

function LoginContent({ keyPrefix, className }: { keyPrefix: string; className?: string }) {
  const t = useTranslations('auth');
  return <span className={className}>{t(keyPrefix)}</span>;
}