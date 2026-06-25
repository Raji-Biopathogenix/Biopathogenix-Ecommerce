type BasicPageProps = {
  title: string;
  description?: string;
};

export default function BasicPage({ title, description }: BasicPageProps) {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-[#f8fafd] py-16 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <h1 className="text-[44px] font-bold text-[#0b2e59]">{title}</h1>
          {description ? (
            <p className="text-[#0b2e59]/70 text-lg mt-2 max-w-2xl">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-[#0b2e59]">Content coming soon</p>
          <p className="mt-2 text-sm text-gray-500">
            This section is managed in the admin and will be published soon.
          </p>
        </div>
      </div>
    </main>
  );
}
