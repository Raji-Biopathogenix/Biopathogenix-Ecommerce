import type { AssayTypeConfig } from "@/lib/assays";
import Link from "next/link";

interface Props {
  config: AssayTypeConfig;
}

export default function AssayCTA({ config }: Props) {
  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-md border border-[#cfe1ec] bg-[#eef8fc] p-8 text-center">
        <h2 className="mb-4 text-2xl font-extrabold text-[#0b2e59]">{config.ctaTitle}</h2>
        <p className="mx-auto mb-7 max-w-3xl leading-relaxed text-[#526b7c]">{config.ctaBody}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/contact"
            className="rounded-md bg-[#0b2e59] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#145f8c]"
          >
            Request Target Review
          </Link>
          <Link
            href="/services/assay-development"
            className="rounded-md border border-[#1582b8] bg-white px-6 py-3 text-sm font-bold text-[#145f8c] transition-colors hover:bg-[#f7fbfd]"
          >
            Custom Assay Support
          </Link>
        </div>
      </div>
    </section>
  );
}
