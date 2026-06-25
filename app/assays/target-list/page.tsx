import Link from "next/link";
import { fetchTargetDocumentPreview, type TargetDocumentSource } from "@/lib/assays";

interface Props {
  searchParams?: Promise<{
    id?: string;
    source?: TargetDocumentSource;
  }>;
}

function isTargetDocumentSource(value?: string): value is TargetDocumentSource {
  return value === "product" || value === "panel";
}

export default async function TargetListPreviewPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : {};
  const source = isTargetDocumentSource(params.source) ? params.source : "product";
  const preview = await fetchTargetDocumentPreview(source, params.id || "");

  if (!preview) {
    return (
      <main className="bg-[#f5f9fc] px-6 py-16">
        <section className="mx-auto max-w-5xl rounded-md border border-[#d7e5ee] bg-white p-8">
          <p className="text-sm font-bold uppercase text-[#1582b8]">Target list</p>
          <h1 className="mt-3 text-3xl font-extrabold text-[#0b2e59]">Target list not found</h1>
          <p className="mt-4 text-[#526b7c]">Please check that the uploaded target document is active in the admin panel.</p>
          <Link href="/assays/respiratory" className="mt-6 inline-flex rounded-md bg-[#0b2e59] px-5 py-3 font-bold text-white">
            Back to assays
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-[#f5f9fc] px-6 py-12">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[#1582b8]">Target list</p>
            <h1 className="mt-2 text-3xl font-extrabold text-[#0b2e59]">{preview.title}</h1>
            <p className="mt-2 text-[#526b7c]">
              {preview.sheet_name ? `${preview.sheet_name} sheet` : "Uploaded target document"}
              {preview.target_count ? ` // ${preview.target_count} targets` : ""}
            </p>
          </div>

          {preview.file_url ? (
            <a
              href={preview.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[#236fa6] px-5 py-3 text-center font-bold text-[#236fa6] hover:bg-white"
            >
              Open uploaded file
            </a>
          ) : null}
        </div>

        {preview.preview_supported && preview.columns.length ? (
          <div className="overflow-hidden rounded-md border border-[#d7e5ee] bg-white shadow-sm">
            <div className="max-h-[70vh] overflow-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 bg-[#0b2e59] text-white">
                  <tr>
                    {preview.columns.map((column, index) => (
                      <th key={`${column}-${index}`} className="border-r border-[#294a6d] px-4 py-3 font-bold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="odd:bg-white even:bg-[#f7fbfd]">
                      {preview.columns.map((column, columnIndex) => (
                        <td key={`${column}-${columnIndex}`} className="border-t border-[#e2edf4] px-4 py-3 text-[#243544]">
                          {row[columnIndex] || ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.truncated ? (
              <p className="border-t border-[#e2edf4] bg-[#f7fbfd] px-4 py-3 text-sm text-[#526b7c]">
                Showing the first 200 rows. Open the uploaded file to review the full list.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-md border border-[#d7e5ee] bg-white p-8">
            <h2 className="text-2xl font-extrabold text-[#0b2e59]">Preview is not available</h2>
            <p className="mt-3 text-[#526b7c]">
              {preview.message || "Open the uploaded file to view this target list."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
