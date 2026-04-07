export default function PropertyDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-40" />
      </div>

      {/* Gallery placeholder */}
      <div className="rounded-2xl bg-gray-200 animate-pulse mb-8" style={{ height: 420 }} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title & badges */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20" />
              <div className="h-6 bg-gray-200 rounded-full animate-pulse w-24" />
            </div>
            <div className="h-7 bg-gray-200 rounded animate-pulse w-full mb-2" />
            <div className="h-7 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>

          {/* Location */}
          <div className="h-5 bg-gray-200 rounded animate-pulse w-64" />

          {/* Price */}
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />

          {/* Features grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-gray-50">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-8" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                </div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact card */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: '#e8e4dc' }}>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="space-y-1.5">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
              </div>
            </div>
            <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
          </div>

          {/* Lead form */}
          <div className="rounded-2xl border p-6 space-y-4" style={{ borderColor: '#e8e4dc' }}>
            <div className="h-5 bg-gray-200 rounded animate-pulse w-40" />
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-11 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
