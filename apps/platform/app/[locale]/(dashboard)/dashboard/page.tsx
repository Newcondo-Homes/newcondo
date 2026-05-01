import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from '@newcondo/auth';
import { CurrencyDisplay } from '@/components/i18n/CurrencyDisplay';
import { DateDisplay } from '@/components/i18n/DateDisplay';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@newcondo/ui';
import { Home, Wallet, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  return {
    title: t('overview.title'),
    description: t('overview.description'),
  };
}

export default async function DashboardPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession();
  const t = await getTranslations({ locale, namespace: 'dashboard' });

  // Mock data - replace with actual API calls
  const stats = {
    totalProperties: 5,
    activeRentals: 2,
    totalEarnings: 2500000,
    pendingPayments: 500000,
  };

  const recentActivities = [
    {
      id: '1',
      type: 'payment',
      description: 'Rent payment received',
      amount: 500000,
      date: new Date('2025-11-10'),
    },
    {
      id: '2',
      type: 'property',
      description: 'New property listed',
      date: new Date('2025-11-08'),
    },
    {
      id: '3',
      type: 'rental',
      description: 'Rental agreement signed',
      amount: 800000,
      date: new Date('2025-11-05'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold">
          {t('overview.welcome', { name: session?.user?.name || 'User' })}
        </h1>
        <p className="text-muted-foreground mt-2">
          {t('overview.subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Home className="h-4 w-4" />}
          title={t('stats.totalProperties')}
          value={stats.totalProperties.toString()}
          locale={locale}
        />
        <StatCard
          icon={<FileText className="h-4 w-4" />}
          title={t('stats.activeRentals')}
          value={stats.activeRentals.toString()}
          locale={locale}
        />
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          title={t('stats.totalEarnings')}
          value={<CurrencyDisplay amount={stats.totalEarnings} locale={locale} />}
          locale={locale}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          title={t('stats.pendingPayments')}
          value={<CurrencyDisplay amount={stats.pendingPayments} locale={locale} />}
          locale={locale}
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>{t('quickActions.title')}</CardTitle>
          <CardDescription>{t('quickActions.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href={`/${locale}/properties/create`} className="flex flex-col items-center gap-2">
                <Home className="h-6 w-6" />
                <span>{t('quickActions.listProperty')}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href={`/${locale}/properties`} className="flex flex-col items-center gap-2">
                <FileText className="h-6 w-6" />
                <span>{t('quickActions.browseProperties')}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4">
              <Link href={`/${locale}/payments`} className="flex flex-col items-center gap-2">
                <Wallet className="h-6 w-6" />
                <span>{t('quickActions.viewPayments')}</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('recentActivity.title')}</CardTitle>
          <CardDescription>{t('recentActivity.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium">{activity.description}</p>
                  <DateDisplay date={activity.date} locale={locale} className="text-sm text-muted-foreground" />
                </div>
                {activity.amount && (
                  <CurrencyDisplay
                    amount={activity.amount}
                    locale={locale}
                    className="font-semibold"
                  />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  locale,
}: {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  locale: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}