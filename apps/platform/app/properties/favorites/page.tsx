import { Suspense } from 'react'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/api/auth'
import { Navbar } from '@/components/shared/navigation/Navbar'
import { PropertyCard } from '@/components/properties/PropertyCard'
import { EmptyState } from '@/components/shared/feedback/EmptyState'
import { Breadcrumbs } from '@/components/shared/navigation/Breadcrumbs'
import { PropertyGridSkeleton } from '@/components/properties/PropertyGridSkeleton'

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
  const user = await getCurrentUser()
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
        title="No favorite properties yet"
        description="Start browsing properties and click the heart icon to save them here for easy access later."
        actionLabel="Browse Properties"
        actionHref="/properties"
        icon="💔"
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
              showFavoriteButton={true}
              isFavorited={true}
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

// Mock function - replace with actual API call
async function getFavoriteProperties(userId: string, sortBy: string) {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  // Mock favorite properties data - replace with actual API call
  const mockFavorites = [
    {
      id: "fav1",
      userId,
      propertyId: "prop1",
      createdAt: new Date('2024-05-20T10:00:00Z'),
      property: {
        id: "prop1",
        title: "Modern 2-Bedroom Apartment in Lekki",
        price: 1800000,
        currency: "NGN",
        images: [
          { url: 'https://placehold.co/600x400/FFF/000?text=Apartment+1', isPrimary: true },
        ],
        address: "123 Banana Island Rd, Ikoyi",
        bedrooms: 2,
        bathrooms: 2,
        propertyType: "APARTMENT",
        features: ["Parking", "Generator"]
      }
    },
    {
      id: "fav2",
      userId,
      propertyId: "prop2",
      createdAt: new Date('2024-05-18T10:00:00Z'),
      property: {
        id: "prop2",
        title: "Spacious 4-Bedroom Duplex in Lekki",
        price: 5500000,
        currency: "NGN",
        images: [
          { url: 'https://placehold.co/600x400/FFF/000?text=Duplex+1', isPrimary: true },
        ],
        address: "456 Main St, Lekki Phase 1",
        bedrooms: 4,
        bathrooms: 3,
        propertyType: "DUPLEX",
        features: ["Security", "Swimming Pool"]
      }
    },
    {
      id: "fav3",
      userId,
      propertyId: "prop3",
      createdAt: new Date('2024-05-22T10:00:00Z'),
      property: {
        id: "prop3",
        title: "Cozy Studio Flat in Ikoyi",
        price: 800000,
        currency: "NGN",
        images: [
          { url: 'https://placehold.co/600x400/FFF/000?text=Studio+Flat', isPrimary: true },
        ],
        address: "789 Royal Rd, Ikoyi",
        bedrooms: 1,
        bathrooms: 1,
        propertyType: "APARTMENT",
        features: ["Fitted Kitchen", "24/7 Power"]
      }
    },
  ]

  // Sort the mock data based on the sortBy parameter
  let sortedFavorites = [...mockFavorites];
  switch (sortBy) {
    case 'oldest':
      sortedFavorites.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      break;
    case 'price-low':
      sortedFavorites.sort((a, b) => a.property.price - b.property.price);
      break;
    case 'price-high':
      sortedFavorites.sort((a, b) => b.property.price - a.property.price);
      break;
    case 'alphabetical':
      sortedFavorites.sort((a, b) => a.property.title.localeCompare(b.property.title));
      break;
    case 'newest':
    default:
      sortedFavorites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
  }

  return sortedFavorites;
}
