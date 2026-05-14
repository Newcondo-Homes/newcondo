import { getTranslations } from 'next-intl/server';
// import { getServerSession } from '@newcondo/auth';
import { PaymentHistory } from '@/components/payments/PaymentHistory';
import { Card, CardContent, CardHeader, CardTitle } from '@newcondo/ui';
import { CurrencyDisplay } from '@/components/i18n/CurrencyDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@newcondo/ui';
import { Wallet, ArrowUpRight, Clock } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'payments' });

  return {
    title: t('history.title'),
    description: t('history.description'),
  };
}

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  // TODO: should all the pages be checked for a session inside a component that requires a logged in user?
  // const session = await getServerSession();
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'payments' });

  // Mock data - replace with actual API calls
  const walletBalance = {
    available: 1500000,
    pending: 500000,
    total: 2000000,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('history.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('history.subtitle')}</p>
      </div>

      {/* Wallet Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('wallet.available')}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CurrencyDisplay
              amount={walletBalance.available}
              locale={locale}
              className="text-2xl font-bold"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('wallet.pending')}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CurrencyDisplay
              amount={walletBalance.pending}
              locale={locale}
              className="text-2xl font-bold"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('wallet.total')}
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CurrencyDisplay
              amount={walletBalance.total}
              locale={locale}
              className="text-2xl font-bold"
            />
          </CardContent>
        </Card>
      </div>

      {/* Payment History Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
          <TabsTrigger value="received">{t('tabs.received')}</TabsTrigger>
          <TabsTrigger value="sent">{t('tabs.sent')}</TabsTrigger>
          <TabsTrigger value="pending">{t('tabs.pending')}</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* <PaymentHistory locale={locale} filter="all" /> */}
          <PaymentHistory  />
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {/* <PaymentHistory locale={locale} filter="received" /> */}
          <PaymentHistory  />
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {/* <PaymentHistory locale={locale} filter="sent" /> */}
          <PaymentHistory  />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {/* <PaymentHistory locale={locale} filter="pending" /> */}
          <PaymentHistory  />
        </TabsContent>
      </Tabs>
    </div>
  );
}