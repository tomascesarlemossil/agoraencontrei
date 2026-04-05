function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border" style={{ borderColor: '#e8e4dc' }}>
      {/* Image placeholder */}
      <div className="h-52 bg-gray-200 animate-pulse" />

      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-1.5">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>

        {/* Location */}
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />

        {/* Features row */}
        <div className="flex items-center gap-3">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-10" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-10" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-10" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-14" />
        </div>

        {/* Price */}
        <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mt-3" />
      </div>
    </div>
  )
}

export default function ImoveisLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="h-7 bg-gray-200 rounded animate-pulse w-48" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mt-2" />
        </div>
        <div className="h-11 bg-gray-200 rounded-2xl animate-pulse w-36" />
      </div>

      {/* Filters placeholder */}
      <div className="h-14 bg-gray-100 rounded-2xl animate-pulse mb-6" />

      {/* Map CTA banner placeholder */}
      <div className="h-20 rounded-2xl animate-pulse mb-6" style={{ backgroundColor: '#e8e4dc' }} />

      {/* Grid of skeleton cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  )
}
