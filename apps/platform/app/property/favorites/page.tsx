import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@newcondo/auth'
import Navbar from '@/components/shared/navigation/Navbar'
import PropertyCard from '@/components/properties/PropertyCard'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs'
import { PropertyGridSkeleton } from '@/components/properties/PropertyGridSkeleton'
import type { PropertyResponse } from '@/lib/api/properties'

export const metadata: Metadata = {
  title: 'Favorite Properties | NewCondo',
  description: 'View and manage your saved favorite properties.',
}

interface FavoritesPageProps {
  searchParams: {
    sortBy?: string
  }
}

export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  // Check authentication
  const session = await getServerSession()

  const user = session?.user
  if (!user) {
    redirect('/login?callbackUrl=/properties/favorites')
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Properties', href: '/properties' },
    { label: 'Favorites', href: '/properties/favorites', current: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumbs items={breadcrumbs} />

          <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Favorite Properties
              </h1>
              <p className="text-gray-600 mt-2">
                Properties you've saved for later viewing
              </p>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <FavoritesSortSelect defaultValue={searchParams.sortBy} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={<PropertyGridSkeleton />}>
          <FavoriteProperties
            userId={user.id}
            sortBy={searchParams.sortBy || 'newest'}
          />
        </Suspense>
      </div>
    </div>
  )
}

// Favorites sort select component
function FavoritesSortSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <form method="GET" className="inline">
      <select
        name="sortBy"
        defaultValue={defaultValue || 'newest'}
        onChange={(e) => {
          const form = e.target.closest('form') as HTMLFormElement
          form.submit()
        }}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="newest">Recently Added</option>
        <option value="oldest">Oldest First</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="alphabetical">Alphabetical</option>
      </select>
    </form>
  )
}

// Favorite properties component
async function FavoriteProperties({
  userId,
  sortBy
}: {
  userId: string
  sortBy: string
}) {
  const favorites = await getFavoriteProperties(userId, sortBy)

  if (!favorites || favorites.length === 0) {
    return (
      <EmptyState
        variant="favorites"
        title="No favorite properties yet"
        description="Start browsing properties and click the heart icon to save them here for easy access later."
        actionText="Browse Properties"
        onAction={undefined}
      />
    )
  }

  return (
    <div>
      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          <span className="font-semibold text-gray-900">
            {favorites.length}
          </span> favorite properties
        </p>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {favorites.map((favorite) => (
          <div key={favorite.id} className="relative">
            <PropertyCard
              property={favorite.property}
              showComparison={false}
              className="h-full"
            />

            {/* Favorite Date Badge */}
            <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              Saved {new Date(favorite.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Select All
            </button>
            <button className="text-sm text-red-600 hover:text-red-700 transition-colors">
              Remove Selected
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Compare Selected
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              Share Collection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function makeMockProperty(overrides: {
  id: string
  title: string
  price: number
  address: string
  city: string
  state: string
  bedrooms: number
  bathrooms: number
  propertyType: string
  features: string[]
  imageUrl: string
}): PropertyResponse {
  const now = new Date().toISOString()
  return {
    id: overrides.id,
    title: overrides.title,
    description: '',
    structure: 'SINGLE_UNIT' as any,
    price: overrides.price as any,
    currency: 'NGN',
    address: overrides.address,
    city: overrides.city,
    state: overrides.state,
    country: 'Nigeria',
    gpsCoordinates: null,
    boundaryCoordinates: null,
    boundaryVerified: false,
    boundaryMarkedBy: null,
    boundaryMarkedAt: null,
    boundaryImages: [],
    buildingFingerprint: null,
    totalUnits: null,
    availableUnits: null,
    buildingFeatures: [],
    propertyType: overrides.propertyType as any,
    bedrooms: overrides.bedrooms,
    bathrooms: overrides.bathrooms,
    area: null,
    features: overrides.features,
    ownerId: 'mock-owner',
    agentId: null,
    isOwnerListing: true,
    status: 'PUBLISHED' as any,
    adminApprovalStatus: 'APPROVED' as any,
    rejectionReason: null,
    approvedAt: null,
    approvedBy: null,
    isAvailable: true,
    availableFrom: null,
    isPaymentLocked: false,
    paymentLockExpiry: null,
    shareableLink: null,
    viewCount: 0,
    favoriteCount: 0,
    createdAt: now as any,
    updatedAt: now as any,
    images: [{ id: `${overrides.id}-img`, url: overrides.imageUrl, altText: null, isPrimary: true, order: 0 }],
    owner: { id: 'mock-owner', name: null, email: 'owner@example.com', phone: null, verificationStatus: 'VERIFIED' },
  }
}

// Mock function - replace with actual API call
async function getFavoriteProperties(userId: string, sortBy: string) {
  await new Promise(resolve => setTimeout(resolve, 300))
 
  const mockFavorites = [
    {
      id: 'fav1',
      userId,
      propertyId: 'prop1',
      createdAt: new Date('2024-05-20T10:00:00Z'),
      property: makeMockProperty({
        id: 'prop1',
        title: 'Modern 2-Bedroom Apartment in Lekki',
        price: 1800000,
        address: '123 Banana Island Rd, Ikoyi',
        city: 'Lagos',
        state: 'Lagos',
        bedrooms: 2,
        bathrooms: 2,
        propertyType: 'APARTMENT',
        features: ['Parking', 'Generator'],
        imageUrl: 'https://placehold.co/600x400/FFF/000?text=Apartment+1',
      }),
    },
    {
      id: 'fav2',
      userId,
      propertyId: 'prop2',
      createdAt: new Date('2024-05-18T10:00:00Z'),
      property: makeMockProperty({
        id: 'prop2',
        title: 'Spacious 4-Bedroom Duplex in Lekki',
        price: 5500000,
        address: '456 Main St, Lekki Phase 1',
        city: 'Lagos',
        state: 'Lagos',
        bedrooms: 4,
        bathrooms: 3,
        propertyType: 'DUPLEX',
        features: ['Security', 'Swimming Pool'],
        imageUrl: 'https://placehold.co/600x400/FFF/000?text=Duplex+1',
      }),
    },
    {
      id: 'fav3',
      userId,
      propertyId: 'prop3',
      createdAt: new Date('2024-05-22T10:00:00Z'),
      property: makeMockProperty({
        id: 'prop3',
        title: 'Cozy Studio Flat in Ikoyi',
        price: 800000,
        address: '789 Royal Rd, Ikoyi',
        city: 'Lagos',
        state: 'Lagos',
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 'APARTMENT',
        features: ['Fitted Kitchen', '24/7 Power'],
        imageUrl: 'https://placehold.co/600x400/FFF/000?text=Studio+Flat',
      }),
    },
  ]
 
  const sorted = [...mockFavorites]
  switch (sortBy) {
    case 'oldest':
      sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); break
    case 'price-low':
      sorted.sort((a, b) => Number(a.property.price) - Number(b.property.price)); break
    case 'price-high':
      sorted.sort((a, b) => Number(b.property.price) - Number(a.property.price)); break
    case 'alphabetical':
      sorted.sort((a, b) => a.property.title.localeCompare(b.property.title)); break
    default:
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
 
  return sorted
}
