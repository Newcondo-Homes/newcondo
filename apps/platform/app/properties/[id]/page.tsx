import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { Navbar } from '@/components/shared/navigation/Navbar'
import { PropertyDetails } from '@/components/properties/PropertyDetails'
import { PropertyImageGallery } from '@/components/properties/PropertyImageGallery'
import { PropertyMap } from '@/components/properties/PropertyMap'
import { PropertyActions } from '@/components/properties/PropertyActions'
import { SimilarProperties } from '@/components/properties/SimilarProperties'
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs'
import { LoadingSpinner } from '@/components/shared/feedback/LoadingSpinner'

interface PropertyPageProps {
  params: {
    id: string
  }
  searchParams: {
    unit?: string // For multi-family properties
  }
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  try {
    const property = await getProperty(params.id)
    
    if (!property) {
      return {
        title: 'Property Not Found | NewCondo',
        description: 'The property you are looking for could not be found.',
      }
    }

    return {
      title: `${property.title} | NewCondo`,
      description: property.description.slice(0, 155),
      openGraph: {
        title: property.title,
        description: property.description,
        images: property.images?.map(img => ({
          url: img.url,
          width: 800,
          height: 600,
          alt: img.altText || property.title,
        })) || [],
      },
    }
  } catch (error) {
    return {
      title: 'Property | NewCondo',
      description: 'View property details',
    }
  }
}

export default async function PropertyPage({ params, searchParams }: PropertyPageProps) {
  let property

  try {
    property = await getProperty(params.id)
  } catch (error) {
    console.error('Error fetching property:', error)
    notFound()
  }

  if (!property) {
    notFound()
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Properties', href: '/properties' },
    { label: property.city, href: `/properties?city=${property.city}` },
    { label: property.title, href: `/properties/${property.id}`, current: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Images Gallery */}
            <section>
              <Suspense fallback={
                <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
              }>
                <PropertyImageGallery 
                  images={property.images} 
                  title={property.title} 
                />
              </Suspense>
            </section>

            {/* Property Details */}
            <section>
              <Suspense fallback={
                <div className="space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              }>
                <PropertyDetails 
                  property={property} 
                  selectedUnit={searchParams.unit} 
                />
              </Suspense>
            </section>

            {/* Property Map & Boundaries */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Location & Boundaries
              </h3>
              <Suspense fallback={
                <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
              }>
                <PropertyMap 
                  property={property}
                  showBoundaries={true}
                  className="h-96 rounded-lg"
                />
              </Suspense>
            </section>

            {/* Similar Properties */}
            <section>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Similar Properties
              </h3>
              <Suspense fallback={
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border animate-pulse">
                      <div className="h-48 bg-gray-200 rounded-t-lg" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-gray-200 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              }>
                <SimilarProperties 
                  currentPropertyId={property.id}
                  city={property.city}
                  propertyType={property.propertyType}
                  priceRange={property.price ? {
                    min: property.price * 0.8,
                    max: property.price * 1.2
                  } : undefined}
                />
              </Suspense>
            </section>
          </div>

          {/* Sidebar - Right Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {/* Property Actions Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <Suspense fallback={
                  <div className="space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
                    <div className="h-12 bg-gray-200 rounded animate-pulse" />
                    <div className="h-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                }>
                  <PropertyActions 
                    property={property}
                    selectedUnit={searchParams.unit}
                  />
                </Suspense>
              </div>

              {/* Property Information Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Property Information
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property ID:</span>
                    <span className="font-mono text-gray-900">{property.id.slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listed:</span>
                    <span className="text-gray-900">
                      {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Views:</span>
                    <span className="text-gray-900">{property.viewCount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium ${
                      property.isAvailable 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {property.isAvailable ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share Property Card */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  Share Property
                </h4>
                <div className="flex gap-2">
                  <ShareButton 
                    platform="facebook" 
                    url={`${process.env.NEXT_PUBLIC_APP_URL}/properties/${property.id}`}
                    title={property.title}
                  />
                  <ShareButton 
                    platform="twitter" 
                    url={`${process.env.NEXT_PUBLIC_APP_URL}/properties/${property.id}`}
                    title={property.title}
                  />
                  <ShareButton 
                    platform="whatsapp" 
                    url={`${process.env.NEXT_PUBLIC_APP_URL}/properties/${property.id}`}
                    title={property.title}
                  />
                  <CopyLinkButton 
                    url={`${process.env.NEXT_PUBLIC_APP_URL}/properties/${property.id}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Share button component
function ShareButton({ 
  platform, 
  url, 
  title 
}: { 
  platform: 'facebook' | 'twitter' | 'whatsapp'
  url: string
  title: string 
}) {
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
  }

  const icons = {
    facebook: '📘',
    twitter: '🐦',
    whatsapp: '💬'
  }

  return (
    <button
      onClick={() => window.open(shareUrls[platform], '_blank')}
      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      title={`Share on ${platform}`}
    >
      {icons[platform]}
    </button>
  )
}

// Copy link button component
function CopyLinkButton({ url }: { url: string }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      title="Copy link"
    >
      🔗
    </button>
  )
}

// Mock function - replace with actual API call
async function getProperty(id: string) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Mock property data - replace with actual API call
  return {
    id,
    title: "Luxury 3-Bedroom Apartment in Victoria Island",
    description: "Beautiful modern apartment with stunning city views, premium finishes, and excellent amenities. Perfect for professionals and families looking for comfort and convenience in the heart of Lagos.",
    price: 2500000,
    currency: "NGN",
    propertyType: "APARTMENT",
    bedrooms: 3,
    bathrooms: 2,
    area: "120 sqm",
    address: "123 Ahmadu Bello Way, Victoria Island",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    features: ["Parking", "Generator", "Security", "Swimming Pool", "Gym", "24/7 Water"],
    isAvailable: true,
    availableFrom: new Date(),
    images: [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
        altText: "Living room view",
        isPrimary: true,
        order: 0
      }
    ],
    boundaryCoordinates: {
      type: "Polygon",
      coordinates: [[[6.4541, 3.4240], [6.4542, 3.4240], [6.4542, 3.4241], [6.4541, 3.4241], [6.4541, 3.4240]]]
    },
    boundaryVerified: true,
    gpsCoordinates: JSON.stringify({ lat: 6.4541, lng: 3.4240 }),
    viewCount: 1247,
    favoriteCount: 89,
    createdAt: new Date('2024-01-15'),
    owner: {
      id: "owner1",
      name: "John Doe",
      image: null
    }
  }
}