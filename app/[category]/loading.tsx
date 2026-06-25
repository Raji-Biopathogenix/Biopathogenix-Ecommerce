export default function CategoryLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
      {[...Array(3)].map((_, si) => (
        <div key={si} className="mb-12">
          <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded overflow-hidden">
                <div className="aspect-square bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-6 w-1/2 bg-gray-200 rounded animate-pulse mt-2" />
                  <div className="h-9 bg-gray-200 rounded animate-pulse mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
