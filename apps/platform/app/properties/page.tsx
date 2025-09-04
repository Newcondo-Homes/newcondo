import { Suspense } from 'react'
import { Metadata } from 'next'
import { Navbar } from '@/components/shared/navigation/Navbar'
import { PropertySearch } from '@/components/properties/PropertySearch'
import { PropertyFilters } from '@/components/properties/PropertyFilters'
import { PropertyGrid } from '@/components/properties/PropertyGrid'
import { PropertyGridSkeleton } from '@/components/properties/PropertyGridSkeleton'

export const metadata: Metadata = {
  title: 'Browse Properties | NewCondo',
  description: 'Discover amazing rental properties across Nigeria. Filter by location, price, and amenities.',
}

interface PropertiesPageProps {
  searchParams: {
    search?: string
    city?: string
    state?: string
    propertyType?: string
    minPrice?: string
    maxPrice?: string
    bedrooms?: string
    bathrooms?: string
    features?: string
    sortBy?: string
    page?: string
  }
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header Section */}
      <section className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Browse Properties
            </h1>
            <p className="text-gray-600">
              Find your perfect home from thousands of verified listings
            </p>
          </div>
          
          {/* Search Box */}
          <Suspense fallback={<div className="h-16 bg-gray-100 rounded-lg animate-pulse" />}>
            <PropertySearch initialValues={searchParams} />
          </Suspense>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Filter Properties
              </h3>
              <Suspense fallback={
                <div className="space-y-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                      <div className="h-10 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              }>
                <PropertyFilters searchParams={searchParams} />
              </Suspense>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <Suspense fallback={<div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />}>
                  <PropertyResultsCount searchParams={searchParams} />
                </Suspense>
              </div>
              
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <label htmlFor="sortBy" className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <Suspense fallback={<div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />}>
                  <PropertySortSelect defaultValue={searchParams.sortBy} />
                </Suspense>
              </div>
            </div>

            {/* Properties Grid */}
            <Suspense fallback={<PropertyGridSkeleton />}>
              <PropertyGrid searchParams={searchParams} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  )
}

// Results count component
async function PropertyResultsCount({ searchParams }: { searchParams: any }) {
  // This would normally fetch the count from your API
  const count = await getPropertyCount(searchParams)
  
  return (
    <p className="text-gray-600">
      <span className="font-semibold text-gray-900">{count.toLocaleString()}</span> properties found
    </p>
  )
}

// Sort select component
function PropertySortSelect({ defaultValue }: { defaultValue?: string }) {
  return (
    <select
      name="sortBy"
      defaultValue={defaultValue || 'newest'}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="newest">Newest First</option>
      <option value="price-low">Price: Low to High</option>
      <option value="price-high">Price: High to Low</option>
      <option value="bedrooms">Most Bedrooms</option>
      <option value="popular">Most Popular</option>
    </select>
  )
}

// Mock function - replace with actual API call
async function getPropertyCount(searchParams: any): Promise<number> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 100))
  return 1247 // Mock count
}