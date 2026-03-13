export default function PostsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
      <div className="mb-6">
        <div className="h-7 bg-gray-200 rounded w-28 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-40"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
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
