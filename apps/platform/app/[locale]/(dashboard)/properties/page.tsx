import { getTranslations } from 'next-intl/server';
import PropertyGrid  from '@/components/properties/PropertyGrid';
import { SearchBox } from '@/components/properties/PropertySearchWrapper';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'properties' });

  return {
    title: t('browse.title'),
    description: t('browse.description'),
  };
}

export default async function PropertiesPage({
  params,
  
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params
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
        {/*  TODO: see how to pass locale into the components that may need locale */}
        {/* <PropertySearch locale={locale} />
        <PropertyFilters locale={locale} /> */}
        <SearchBox  />
        {/*  TODO: uncomment propertfilters comment below */}
        {/* <PropertyFilters  /> */}
      </div>

      {/* Property Grid */}
      {/* <PropertyGrid locale={locale} searchParams={searchParams} /> */}
      <PropertyGrid />

    </div>
  );
}