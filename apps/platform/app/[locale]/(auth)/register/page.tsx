import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import RegisterForm  from '@/components/auth/RegisterForm';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: t('register.title'),
    description: t('register.description'),
  };
}

export default function RegisterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <RegisterContent keyPrefix="register.title" className="text-3xl font-bold" />
        <RegisterContent keyPrefix="register.subtitle" className="text-muted-foreground" />
      </div>


      {/*  TODO: see if you'll pass locale to RegisterForm for internationalization */}
      {/* <RegisterForm locale={locale} /> */}
      <RegisterForm />


      <div className="text-center text-sm">
        <RegisterContent keyPrefix="register.haveAccount" className="text-muted-foreground inline" />
        {' '}
        <Link
          href={`/${locale}/login`}
          className="font-medium text-primary hover:underline"
        >
          <RegisterContent keyPrefix="register.signInLink" className="inline" />
        </Link>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            <RegisterContent keyPrefix="register.orContinueWith" />
          </span>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground">
        <RegisterContent keyPrefix="register.agreement" />
        {' '}
        <Link href={`/${locale}/terms`} className="underline hover:text-primary">
          <RegisterContent keyPrefix="register.termsLink" className="inline" />
        </Link>
        {' '}
        <RegisterContent keyPrefix="register.and" />
        {' '}
        <Link href={`/${locale}/privacy`} className="underline hover:text-primary">
          <RegisterContent keyPrefix="register.privacyLink" className="inline" />
        </Link>
      </div>
    </div>
  );
}

function RegisterContent({ keyPrefix, className }: { keyPrefix: string; className?: string }) {
  const t = useTranslations('auth');
  return <span className={className}>{t(keyPrefix)}</span>;
}