import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { CurrencyDisplay } from '@/components/i18n/CurrencyDisplay';
import { Search, Home, Shield, Zap } from 'lucide-react';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="text-2xl font-bold text-primary">
            Newcondo
          </Link>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Button asChild variant="ghost">
              <Link href={`/${locale}/login`}>
                <HomeContent namespace="navigation" keyPrefix="login" />
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/${locale}/register`}>
                <HomeContent namespace="navigation" keyPrefix="register" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            <HomeContent namespace="home" keyPrefix="hero.title" />
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            <HomeContent namespace="home" keyPrefix="hero.subtitle" />
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  className="w-full pl-10 pr-4 py-3 rounded-lg border bg-background"
                />
              </div>
              <Button size="lg">
                <HomeContent namespace="home" keyPrefix="hero.searchButton" />
              </Button>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href={`/${locale}/properties`}>
                <HomeContent namespace="home" keyPrefix="hero.browseProperties" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`/${locale}/properties/create`}>
                <HomeContent namespace="home" keyPrefix="hero.listProperty" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            <HomeContent namespace="home" keyPrefix="features.title" />
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Shield className="h-12 w-12 text-primary" />}
              titleKey="features.secure.title"
              descKey="features.secure.description"
            />
            <FeatureCard
              icon={<Home className="h-12 w-12 text-primary" />}
              titleKey="features.verified.title"
              descKey="features.verified.description"
            />
            <FeatureCard
              icon={<Zap className="h-12 w-12 text-primary" />}
              titleKey="features.fast.title"
              descKey="features.fast.description"
            />
          </div>
        </div>
      </section>

      {/* Sample Pricing */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            <HomeContent namespace="home" keyPrefix="pricing.title" />
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            <HomeContent namespace="home" keyPrefix="pricing.subtitle" />
          </p>
          
          <div className="flex gap-4 justify-center items-center">
            <CurrencyDisplay amount={500000} locale={locale} className="text-2xl font-bold" />
            <span className="text-muted-foreground">-</span>
            <CurrencyDisplay amount={5000000} locale={locale} className="text-2xl font-bold" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 Newcondo. <HomeContent namespace="home" keyPrefix="footer.rights" /></p>
        </div>
      </footer>
    </div>
  );
}

function HomeContent({ namespace, keyPrefix }: { namespace: string; keyPrefix: string }) {
  const t = useTranslations(namespace);
  return <>{t(keyPrefix)}</>;
}

function FeatureCard({
  icon,
  titleKey,
  descKey,
}: {
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
}) {
  const t = useTranslations('home');
  
  return (
    <div className="text-center p-6 rounded-lg border bg-card">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{t(titleKey)}</h3>
      <p className="text-muted-foreground">{t(descKey)}</p>
    </div>
  );
}