export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen">
      <main className="px-6 md:px-10 py-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Image panel */}
          <div className="lg:w-[50%]">
            <div className="w-full aspect-[3/2] bg-gray-200 rounded-sm animate-pulse" />
            <div className="flex gap-3 mt-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-20 h-20 bg-gray-200 rounded-sm animate-pulse flex-shrink-0" />
              ))}
            </div>
          </div>
          {/* Details panel */}
          <div className="lg:w-[50%] space-y-4 pt-2">
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-1/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-12 w-full bg-gray-200 rounded animate-pulse mt-6" />
            <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        {/* Tabs */}
        <div className="mt-10">
          <div className="flex gap-4 border-b border-gray-200 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 w-28 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width: `${85 - i * 8}%` }} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
