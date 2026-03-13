export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-gray-50 border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-10 mb-8 text-center">
        <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-3"></div>
        <div className="h-5 bg-gray-200 rounded w-72 mx-auto mb-6"></div>
        <div className="flex gap-3 justify-center">
          <div className="h-9 bg-gray-200 rounded-md w-32"></div>
          <div className="h-9 bg-gray-200 rounded-md w-28"></div>
        </div>
      </div>

      {/* Categories skeleton */}
      <div className="mb-8">
        <div className="h-6 bg-gray-200 rounded w-20 mb-3"></div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded-md w-16"></div>
          ))}
        </div>
      </div>

      {/* Posts skeleton */}
      <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="h-44 bg-gray-100"></div>
            <div className="p-4">
              <div className="h-3 bg-gray-200 rounded w-12 mb-3"></div>
              <div className="h-5 bg-gray-200 rounded w-full mb-1.5"></div>
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-100 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-100 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
