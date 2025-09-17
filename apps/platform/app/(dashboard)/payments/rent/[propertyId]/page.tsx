// apps/platform/app/(dashboard)/payments/rent/[propertyId]/page.tsx
import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import PaymentForm from '@/components/payments/PaymentForm'
import PropertyDetails from '@/components/properties/PropertyDetails'
import VirtualAccountInfo from '@/components/payments/VirtualAccountInfo'
import LoadingSpinner from '@/components/shared/feedback/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@newcondo/ui'
import { Badge } from '@newcondo/ui'
import { CalendarDays, MapPin, Building2 } from 'lucide-react'

interface PageProps {
  params: {
    propertyId: string
  }
  searchParams: {
    unitId?: string
    rentalId?: string
  }
}

export const metadata: Metadata = {
  title: 'Pay Rent | NewCondo',
  description: 'Pay your rent securely using Flutterwave',
}

export default async function RentPaymentPage({ params, searchParams }: PageProps) {
  const { propertyId } = params
  const { unitId, rentalId } = searchParams

  // This would typically fetch data from your API
  // For now, we'll simulate the data structure
  const propertyData = {
    id: propertyId,
    title: 'Modern 2-Bedroom Apartment',
    address: '123 Victoria Island, Lagos',
    monthlyRent: 500000,
    currency: 'NGN',
    landlord: {
      name: 'John Doe',
      phone: '+234 801 234 5678'
    },
    virtualAccount: {
      accountNumber: '0123456789',
      accountName: 'NEWCONDO-' + propertyId.slice(-6).toUpperCase(),
      bankCode: '044',
      bankName: 'Access Bank'
    }
  }

  if (!propertyData) {
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Pay Rent</h1>
          <p className="text-muted-foreground">
            Complete your rent payment for this property
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Property Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Property Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{propertyData.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    {propertyData.address}
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Monthly Rent</span>
                    <span className="text-xl font-bold">
                      ₦{propertyData.monthlyRent.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground">Landlord</p>
                  <p className="font-medium">{propertyData.landlord.name}</p>
                  <p className="text-sm text-muted-foreground">{propertyData.landlord.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Virtual Account Info */}
            <div className="mt-4">
              <Suspense fallback={<LoadingSpinner />}>
                <VirtualAccountInfo virtualAccount={propertyData.virtualAccount} />
              </Suspense>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Suspense 
              fallback={
                <Card>
                  <CardHeader>
                    <CardTitle>Loading Payment Form...</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <LoadingSpinner />
                  </CardContent>
                </Card>
              }
            >
              <PaymentForm
                propertyId={propertyId}
                unitId={unitId}
                rentalId={rentalId}
                amount={propertyData.monthlyRent}
                currency={propertyData.currency}
                paymentType="RENT"
                propertyTitle={propertyData.title}
              />
            </Suspense>
          </div>
        </div>

        {/* Important Notes */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Payment Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Payment confirmation period: 7 days after successful payment</li>
              <li>Funds are held securely until confirmation is complete</li>
              <li>Contact landlord if you need assistance with payment</li>
              <li>Keep your payment receipt for records</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}