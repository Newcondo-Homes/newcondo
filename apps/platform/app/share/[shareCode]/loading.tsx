// apps/platform/app/share/[shareCode]/loading.tsx
export default function SharedPropertyLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Images Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="h-96 md:h-[600px] bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, idx) => (
              <div
                key={idx}
                className="h-44 md:h-[290px] bg-gray-200 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Details Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <div className="h-9 w-3/4 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Features */}
            <div className="flex gap-6">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>

            {/* Description */}
            <div>
              <div className="h-7 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <div className="h-7 w-48 bg-gray-200 rounded mb-3 animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="h-6 w-full bg-gray-200 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>

          {/* Booking Card Skeleton */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border shadow-lg p-6 sticky top-24">
              <div className="mb-6">
                <div className="h-10 w-48 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
              </div>

              <div className="h-12 w-full bg-gray-200 rounded-lg mb-3 animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded mx-auto animate-pulse" />

              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="h-5 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-32 bg-gray-200 rounded mb-3 animate-pulse" />
                <div className="h-6 w-28 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}