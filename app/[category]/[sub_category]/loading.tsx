export default function SubCategoryLoading() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-[#f8fafd] py-10 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gray-200 animate-pulse" />
            <div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-44 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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
    </main>
  );
}
