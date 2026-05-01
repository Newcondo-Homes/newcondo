import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { getServerSession } from '@newcondo/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@newcondo/ui';
import { Button } from '@newcondo/ui';
import { Badge } from '@newcondo/ui';
import { CurrencyDisplay } from '@/components/i18n/CurrencyDisplay';
import { DateDisplay } from '@/components/i18n/DateDisplay';
import { MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'marking' });

  return {
    title: t('jobs.title'),
    description: t('jobs.description'),
  };
}

export default async function MarkingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const session = await getServerSession();
  const t = await getTranslations({ locale, namespace: 'marking' });

  // Mock data - replace with actual API calls
  const markingJobs = [
    {
      id: '1',
      propertyTitle: '3 Bedroom Apartment',
      address: 'Lekki Phase 1, Lagos',
      status: 'QUEUED',
      fee: 20000,
      requestedAt: new Date('2025-11-12'),
      queuePosition: 2,
    },
    {
      id: '2',
      propertyTitle: '2 Bedroom Flat',
      address: 'Victoria Island, Lagos',
      status: 'COMPLETED',
      fee: 20000,
      requestedAt: new Date('2025-11-10'),
      completedAt: new Date('2025-11-11'),
    },
    {
      id: '3',
      propertyTitle: 'Studio Apartment',
      address: 'Ikeja GRA, Lagos',
      status: 'ASSIGNED',
      fee: 20000,
      requestedAt: new Date('2025-11-13'),
      timeSlotExpiry: new Date('2025-11-14T15:00:00'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{t('jobs.title')}</h1>
        <p className="text-muted-foreground mt-2">{t('jobs.subtitle')}</p>
      </div>

      {/* Marking Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalJobs')}
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.completed')}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('stats.earnings')}
            </CardTitle>
            <CurrencyDisplay
              amount={160000}
              locale={locale}
              className="text-2xl font-bold"
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"></div>
          </CardContent>
        </Card>
      </div>

      {/* Marking Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('jobsList.title')}</CardTitle>
          <CardDescription>{t('jobsList.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {markingJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{job.propertyTitle}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {job.address}
                    </p>
                  </div>
                  <StatusBadge status={job.status} locale={locale} />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <DateDisplay date={job.requestedAt} locale={locale} />
                    </div>
                    {job.queuePosition && (
                      <Badge variant="secondary">
                        {t('jobsList.position')}: {job.queuePosition}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <CurrencyDisplay amount={job.fee} locale={locale} className="font-semibold" />
                    <Button size="sm" variant="outline">
                      {t('jobsList.viewDetails')}
                    </Button>
                  </div>
                </div>

                {job.timeSlotExpiry && (
                  <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950 p-2 rounded">
                    <AlertCircle className="h-4 w-4" />
                    {t('jobsList.expiresIn')}:{' '}
                    <DateDisplay date={job.timeSlotExpiry} locale={locale} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status, locale }: { status: string; locale: string }) {
  const t = useTranslations('marking');
  
  const statusConfig = {
    QUEUED: { label: t('status.queued'), variant: 'secondary' as const },
    ASSIGNED: { label: t('status.assigned'), variant: 'default' as const },
    IN_PROGRESS: { label: t('status.inProgress'), variant: 'default' as const },
    COMPLETED: { label: t('status.completed'), variant: 'success' as const },
    CANCELLED: { label: t('status.cancelled'), variant: 'destructive' as const },
    EXPIRED: { label: t('status.expired'), variant: 'destructive' as const },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.QUEUED;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}