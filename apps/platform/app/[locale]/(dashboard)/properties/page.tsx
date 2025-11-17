import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { PropertyGrid } from '@/components/properties/PropertyGrid';
import { PropertySearch } from '@/components/properties/PropertySearch';
import { PropertyFilters } from '@/components/properties/PropertyFilters';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: 'properties' });

  return {
    title: t('browse.title'),
    description: t('browse.description'),
  };
}

export default async function PropertiesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const t = await getTranslations({ locale, namespace: 'properties' });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('browse.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('browse.subtitle')}</p>
        </div>
        <Button asChild>
          <Link href={`/${locale}/properties/create`}>
            <Plus className="mr-2 h-4 w-4" />
            {t('browse.listProperty')}
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <PropertySearch locale={locale} />
        <PropertyFilters locale={locale} />
      </div>

      {/* Property Grid */}
      <PropertyGrid locale={locale} searchParams={searchParams} />
    </div>
  );
}