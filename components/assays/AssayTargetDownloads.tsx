import { getTargetDocumentHref, type AssayPanelTargetDocument } from "@/lib/assays";

interface Props {
  documents: AssayPanelTargetDocument[];
}

function getFileLabel(extension: string) {
  return extension ? extension.toUpperCase() : "FILE";
}

export default function AssayTargetDownloads({ documents }: Props) {
  if (!documents.length) {
    return (
      <section className="bg-white px-6 py-12">
        <div className="mx-auto max-w-7xl rounded-md border border-dashed border-[#c9dbe8] bg-[#f7fbfd] p-7">
          <h2 className="text-2xl font-extrabold text-[#0b2e59]">Target lists</h2>
          <p className="mt-2 text-[#526b7c]">
            Add PDF, Word, or Excel target lists from Assay Target Documents in the admin panel.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold uppercase text-[#1582b8]">Target lists</p>
          <h2 className="text-3xl font-extrabold text-[#0b2e59]">Browse assay target resources</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {documents.map((document) => (
            <a
              key={document.id}
              href={getTargetDocumentHref(document, "panel")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[#cfe1ec] bg-[#eef8fc] p-5 transition-colors hover:border-[#1582b8] hover:bg-white"
            >
              <p className="text-xs font-bold uppercase text-[#5c7284]">{document.document_type_label}</p>
              <h3 className="mt-2 text-lg font-extrabold text-[#0b2e59]">{document.title}</h3>
              {document.target_count ? (
                <p className="mt-2 text-sm font-semibold text-[#526b7c]">{document.target_count} targets</p>
              ) : null}
              <p className="mt-3 text-sm font-bold text-[#236fa6]">
                View {getFileLabel(document.file_extension)}
              </p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
