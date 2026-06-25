import type { AssayTypeConfig } from "@/lib/assays";
import Link from "next/link";

interface Props {
  config: AssayTypeConfig;
}

const RESOURCES = [
  { title: "Product Sheets", desc: "Review product support material and assay downloads.", href: "/resources/product-sheets" },
  { title: "Protocols and Guides", desc: "Find workflow documents for product setup and review.", href: "/resources/protocols-guides" },
];

export default function AssayInsights({ config }: Props) {
  return (
    <section className="bg-[#102d3f] px-6 py-16 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase text-[#a4e1d8]">Resources</p>
          <h2 className="text-3xl font-extrabold">Latest {config.label.replace(" Assays", "")} resources</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-md border border-white/15 bg-white/10 p-7">
            <p className="mb-3 text-xs font-semibold uppercase text-[#a4e1d8]">Assay support</p>
            <h3 className="mb-3 text-xl font-bold leading-snug text-white">
              Product pages now connect assay details, targets, and documents.
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-[#cfe4ee]">
              Use the admin panel to attach pathogen targets and upload PDF, Word, or Excel target lists for each product.
            </p>
            <Link
              href="/resources/blog-learning-center"
              className="inline-block rounded-md bg-[#1c9ac4] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#4fb3cf]"
            >
              Learning Center
            </Link>
          </article>

          <div className="grid gap-4">
            {RESOURCES.map((resource) => (
              <Link
                key={resource.title}
                href={resource.href}
                className="rounded-md border border-white/15 bg-white/10 p-5 transition-colors hover:bg-white/15"
              >
                <p className="font-bold text-white">{resource.title}</p>
                <p className="mt-1 text-sm text-[#cfe4ee]">{resource.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
