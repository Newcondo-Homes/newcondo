import { Suspense } from 'react'
import { Navbar } from '@/components/shared/navigation/Navbar'
import { SearchBox } from '@/components/properties/PropertySearch'
import { PropertyGrid } from '@/components/properties/PropertyGrid'
import { Footer } from '@/components/shared/layouts/Footer'
import { HeroSection } from '@/components/shared/layouts/HeroSection'

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />
      
      {/* Hero Section with Search */}
      <HeroSection />
      
      {/* Search Box */}
      <section className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Suspense fallback={<div className="h-16 bg-gray-100 rounded-lg animate-pulse" />}>
            <SearchBox />
          </Suspense>
        </div>
      </section>

      {/* Properties Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Discover Amazing Properties
          </h2>
          <p className="text-gray-600">
            Find your perfect home from thousands of verified listings
          </p>
        </div>

        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {Array.from({ length: 48 }).map((_, i) => (
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
          <PropertyGrid />
        </Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}