"use client";
import { LandingPageType } from "@/types/header";

interface ProductCatalogBannerprops {
  result?: LandingPageType;
}

export default function ProductCatalogBanner({ result }: ProductCatalogBannerprops) {
  const context = result?.contexts?.[0];
  const image = result?.images?.[0];
  const buttonHref = context?.download_file || context?.btn_url || "#";
  const isDownload = Boolean(context?.download_file);

  return (
    <section className="w-full bg-[#0a1c3f] px-5 py-16 md:px-14">
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-14 md:flex-row md:items-center md:justify-between">
        <div className="w-full max-w-[560px]">
          <h2 className="mb-6 text-[2.4rem] font-bold leading-[1.1] text-white md:text-[3rem]">
            Explore the
            <br />
            <span className="text-[#5fb8dd]">BioPathogenix</span>
            <br />
            Product Catalog
          </h2>

          <p className="mb-5 text-[0.98rem] leading-relaxed text-white/80">
            Download the complete BioPathogenix research portfolio to discover molecular assays,
            nucleic acid extraction kits, workflow tools, and laboratory supplies designed to
            support ever-evolving research environments.
          </p>

          <p className="mb-8 text-[0.98rem] leading-relaxed text-white/80">
            Our catalog provides a convenient overview of available products and solutions
            across the BioPathogenix portfolio.
          </p>

          <a
            href={buttonHref}
            className="inline-flex items-center gap-4 rounded-lg bg-[#3ab5d0] px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#2aa0bc]"
            target={isDownload ? undefined : "_blank"}
            rel={isDownload ? undefined : "noreferrer"}
            download={isDownload ? true : undefined}
          >
            Download the Catalog
            <span className="border-l border-white/30 pl-4">→</span>
          </a>
        </div>

        {image?.image && (
          <div className="w-full max-w-[440px] flex-shrink-0">
            <img
              src={image.image}
              alt={image.alt_text || "BioPathogenix product catalog cover"}
              className="w-full rounded-md shadow-[0_30px_60px_rgba(0,0,0,0.35)]"
            />
          </div>
        )}
      </div>
    </section>
  );
}
