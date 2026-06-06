// apps/platform/app/(dashboard)/properties/page.tsx
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@newcondo/auth';
import PropertiesPageClient from '@/components/properties/PropertiesPageClient';

export const metadata = {
  title: 'Browse Properties | NewCondo',
  description:
    'Find your perfect home. Browse verified properties across Nigeria.',
};

export const dynamic = 'force-dynamic';

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Resolve searchParams (Next.js 15 async searchParams)
  const params = await searchParams;

  const getString = (key: string) =>
    typeof params[key] === 'string' ? (params[key] as string) : '';

  const initialSearch = getString('q');
  const initialCity = getString('city');
  const initialState = getString('state');
  const initialType = getString('type');
  const initialMinPrice = getString('minPrice');
  const initialMaxPrice = getString('maxPrice');

  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 p-6">
          <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
          <div className="h-14 w-full rounded-xl bg-muted animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-xl bg-muted animate-pulse"
                style={{ animationDelay: `${i * 40}ms` }}
              />
            ))}
          </div>
        </div>
      }
    >
      <PropertiesPageClient
        userId={session.user.id as string}
        userRole={(session.user as { role?: string }).role ?? 'RENTER'}
        initialSearch={initialSearch}
        initialCity={initialCity}
        initialState={initialState}
        initialType={initialType}
        initialMinPrice={initialMinPrice ? Number(initialMinPrice) : undefined}
        initialMaxPrice={initialMaxPrice ? Number(initialMaxPrice) : undefined}
      />
    </Suspense>
  );
}