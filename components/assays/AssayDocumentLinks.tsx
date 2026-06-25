import { getTargetDocumentHref, type AssayDocument, type TargetDocumentSource } from "@/lib/assays";

interface Props {
  documents: AssayDocument[];
  source?: TargetDocumentSource;
}

function getFileLabel(extension: string) {
  if (!extension) return "File";
  return extension.toUpperCase();
}

export default function AssayDocumentLinks({ documents, source = "product" }: Props) {
  if (documents.length === 0) return null;

  return (
    <div className="mt-4 border-t border-[#dce8f0] pt-4">
      <p className="mb-2 text-xs font-bold uppercase text-[#5c7284]">Target Documents</p>
      <div className="flex flex-wrap gap-2">
        {documents.map((document) => (
          <a
            key={document.id}
            href={getTargetDocumentHref(document, source)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[#b9d9ec] bg-[#eef8fc] px-3 py-2 text-xs font-semibold text-[#145f8c] transition-colors hover:border-[#1582b8] hover:bg-white"
          >
            {document.title} ({getFileLabel(document.file_extension)})
          </a>
        ))}
      </div>
    </div>
  );
}
