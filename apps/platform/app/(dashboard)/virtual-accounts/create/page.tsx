// apps/platform/app/(dashboard)/virtual-accounts/create/page.tsx

import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { VirtualAccountCreationForm } from '@/components/virtual-accounts/VirtualAccountCreationForm';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner';
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs';
import { auth } from '@newcondo/auth';

interface PageProps {
  searchParams: Promise<{
    propertyId?: string;
    returnUrl?: string;
  }>;
}

async function getUserProperties(userId: string) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/properties?ownerId=${userId}&status=PUBLISHED`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user properties');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching user properties:', error);
    return { properties: [] };
  }
}

async function checkExistingVirtualAccount(propertyId?: string) {
  if (!propertyId) return null;

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/virtual-accounts?propertyId=${propertyId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 },
    });

    if (response.ok) {
      const result = await response.json();
      return result.virtualAccount || null;
    }

    return null;
  } catch (error) {
    console.error('Error checking existing virtual account:', error);
    return null;
  }
}

export default async function CreateVirtualAccountPage({ searchParams }: PageProps) {
  const { propertyId, returnUrl } = await searchParams;

  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Check user role - only owners and agents can create virtual accounts
  if (!['OWNER', 'AGENT'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const breadcrumbItems = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Virtual Accounts', href: '/virtual-accounts' },
    { label: 'Create Account' },
  ];

  // Get user properties for dropdown
  const propertiesData = await getUserProperties(session.user.id);

  // Check if there's already a virtual account for the selected property
  const existingVirtualAccount = propertyId
    ? await checkExistingVirtualAccount(propertyId)
    : null;

  // If virtual account already exists for this property, redirect to it
  if (existingVirtualAccount) {
    redirect(`/virtual-accounts/${existingVirtualAccount.id}`);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-semibold text-gray-900">
              Create Virtual Account
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Create a dedicated virtual account to receive payments for your property
            </p>
          </div>

          <div className="p-6">
            {/* Information Card */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    Virtual Account Benefits
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Automatic rent collection from tenants</li>
                      <li>Real-time transaction notifications</li>
                      <li>Secure fund holding and management</li>
                      <li>Detailed transaction history and statements</li>
                      <li>Seamless integration with property listings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <Suspense fallback={<LoadingSpinner />}>
              <VirtualAccountCreationForm
                userId={session.user.id}
                userRole={session.user.role}
                properties={propertiesData.properties || []}
                preSelectedPropertyId={propertyId}
                returnUrl={returnUrl}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Create Virtual Account | NewCondo',
  description: 'Create a dedicated virtual account to receive payments for your property',
};