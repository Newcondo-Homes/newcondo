import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@newcondo/auth';
import { prisma } from '@newcondo/db';
import CheckoutForm from '@/components/payments/CheckoutForm';
import {PaymentLockStatus} from '@/components/payments/PaymentLockStatus';
import {ConflictWarning} from '@/components/payments/ConflictWarning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui/components/card';
import { Alert, AlertDescription, AlertTitle } from '@newcondo/ui/components/alert';
import { AlertTriangle } from 'lucide-react';

interface CheckoutPageProps {
  params: {
    id: string;
  };
  searchParams: {
    unitId?: string;
  };
}

async function getPropertyData(propertyId: string, unitId?: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          verificationStatus: true,
        },
      },
      agent: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      units: unitId
        ? {
            where: { id: unitId },
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          }
        : undefined,
    },
  });

  if (!property) {
    return null;
  }

  // Get the specific unit if unitId is provided
  const unit = unitId ? property.units?.[0] : null;

  // Check for active payment locks
  const locks = await prisma.paymentAttemptLog.findMany({
    where: {
      propertyId,
      unitId: unitId || null,
      status: 'LOCKED',
      createdAt: {
        gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  });

  return { property, unit, locks };
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/properties/' + params.id + '/checkout');
  }

  const data = await getPropertyData(params.id, searchParams.unitId);

  if (!data) {
    notFound();
  }

  const { property, unit, locks } = data;

  // Determine if this is a multi-unit property
  const isMultiUnit = property.structure === 'MULTI_FAMILY';
  const targetUnit = unit || null;

  // Check availability
  const isAvailable = isMultiUnit
    ? targetUnit?.isAvailable && targetUnit.status === 'AVAILABLE'
    : property.isAvailable && property.status === 'PUBLISHED';

  // Check if property/unit is payment locked
  const isLocked = isMultiUnit
    ? targetUnit?.isPaymentLocked
    : property.isPaymentLocked;

  const lockExpiry = isMultiUnit
    ? targetUnit?.paymentLockExpiry
    : property.paymentLockExpiry;

  // Check if lock is expired
  const isLockExpired = lockExpiry ? new Date(lockExpiry) < new Date() : true;

  // Determine final availability
  const canProceed = isAvailable && (!isLocked || isLockExpired);

  // Get pricing
  const price = isMultiUnit ? targetUnit?.price : property.price;
  const currency = isMultiUnit ? targetUnit?.currency : property.currency;

  if (!price) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Pricing Error</AlertTitle>
          <AlertDescription>
            Unable to determine the price for this property. Please contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Checkout</h1>
        <p className="text-muted-foreground mb-6">
          Complete your payment to secure this property
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Property/Unit Summary */}
          <div className="md:col-span-2 space-y-6">
            {/* Lock Status Indicator */}
            {locks.length > 0 && (
              <PaymentLockStatus
                locks={locks}
                propertyId={property.id}
                unitId={targetUnit?.id}
              />
            )}

            {/* Conflict Warning */}
            {!canProceed && (
              <ConflictWarning
                isLocked={isLocked && !isLockExpired}
                lockExpiry={lockExpiry}
                isAvailable={isAvailable}
              />
            )}

            {/* Property Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>{property.title}</CardTitle>
                <CardDescription>
                  {isMultiUnit && targetUnit
                    ? `Unit ${targetUnit.unitNumber} - Floor ${targetUnit.floor || 'N/A'}`
                    : property.propertyType}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  {(isMultiUnit && targetUnit?.images[0]?.url) ||
                  property.images[0]?.url ? (
                    <img
                      src={
                        (isMultiUnit ? targetUnit?.images[0]?.url : property.images[0]?.url) ||
                        '/images/placeholders/property.jpg'
                      }
                      alt={property.title}
                      className="w-32 h-24 object-cover rounded-md"
                    />
                  ) : null}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {property.address}, {property.city}, {property.state}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      {(isMultiUnit ? targetUnit?.bedrooms : property.bedrooms) && (
                        <span>
                          {isMultiUnit ? targetUnit?.bedrooms : property.bedrooms} Beds
                        </span>
                      )}
                      {(isMultiUnit ? targetUnit?.bathrooms : property.bathrooms) && (
                        <span>
                          {isMultiUnit ? targetUnit?.bathrooms : property.bathrooms} Baths
                        </span>
                      )}
                      {(isMultiUnit ? targetUnit?.area : property.area) && (
                        <span>{isMultiUnit ? targetUnit?.area : property.area}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-semibold">
                    <span>Total Amount</span>
                    <span>
                      {currency} {Number(price).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Form */}
            {canProceed ? (
              <CheckoutForm
                propertyId={property.id}
                unitId={targetUnit?.id}
                amount={Number(price)}
                currency={currency || 'NGN'}
                userId={session.user.id}
              />
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Unable to Proceed</AlertTitle>
                <AlertDescription>
                  {!isAvailable
                    ? 'This property is no longer available.'
                    : 'This property is currently locked by another payment attempt. Please try again later.'}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Sidebar - Payment Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium mb-1">Secure Payment</p>
                  <p className="text-muted-foreground">
                    Your payment is processed securely through Flutterwave
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Payment Lock</p>
                  <p className="text-muted-foreground">
                    Property will be locked for 15 minutes during payment
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">Confirmation Period</p>
                  <p className="text-muted-foreground">
                    7 days to confirm or request refund after payment
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Owner Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="font-medium">{property.owner.name || 'Property Owner'}</p>
                  <p className="text-muted-foreground">{property.owner.email}</p>
                </div>
                {property.owner.verificationStatus === 'VERIFIED' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Verified Owner</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}