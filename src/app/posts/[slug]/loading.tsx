export default function PostLoading() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
      {/* Breadcrumbs */}
      <div className="flex gap-2 mb-4">
        <div className="h-4 bg-gray-200 rounded w-10"></div>
        <div className="h-4 bg-gray-200 rounded w-10"></div>
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex gap-1.5 mb-3">
          <div className="h-5 bg-gray-200 rounded w-14"></div>
          <div className="h-5 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-9 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-9 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-28"></div>
          </div>
        </div>
        <div className="h-56 sm:h-72 bg-gray-100 rounded-lg"></div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i}>
            <div className="h-4 bg-gray-100 rounded w-full"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6 mt-1.5"></div>
          </div>
        ))}
      </div>
    </article>
  )
}
