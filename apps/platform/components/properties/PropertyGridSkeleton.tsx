// apps/platform/components/properties/PropertyGridSkeleton.tsx

export function PropertyGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-gray-200" />
          <div className="p-3 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-2 pt-1">
              <div className="h-3 bg-gray-200 rounded w-10" />
              <div className="h-3 bg-gray-200 rounded w-10" />
              <div className="h-3 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}