"use client";

import { LandingPageType } from "@/types/header";

interface ProductCatalogBannerprops {
  result?: LandingPageType;
}

export default function ProductCatalogBanner({
  result,
}: ProductCatalogBannerprops) {
  const context = result?.contexts?.[0];

  const buttonHref =
    context?.download_file || context?.btn_url || "#";

  const isDownload = Boolean(context?.download_file);

  return (
    <section className="overflow-hidden rounded-b-[24px] bg-[#0A2F5A] py-20">
      <div className="mx-auto flex max-w-[1380px] flex-col items-start justify-between gap-10 px-6 md:px-10 lg:flex-row lg:gap-20 lg:px-16">

        {/* LEFT CONTENT */}
        <div className="w-full max-w-[500px] pt-8">

          <h2 className="font-['Poppins'] text-[46px] font-light leading-[0.96] tracking-[-0.05em] text-white md:text-[58px] xl:text-[68px]">
            Explore the
            <br />

            <span className="font-semibold text-[#4BA8DA]">
              BioPathogenix
            </span>

            <br />

            <span className="font-light">
              Product Catalog
            </span>
          </h2>

          <p className="mt-8 max-w-[430px] text-[15px] leading-7 text-white/75">
            Download the complete BioPathogenix research portfolio to
            discover molecular assays, nucleic acid extraction kits,
            workflow tools, and laboratory supplies designed to support
            ever-evolving research environments.
          </p>

          <p className="mt-6 max-w-[430px] text-[15px] leading-7 text-white/75">
            Our catalog provides a convenient overview of available
            products and solutions across the BioPathogenix portfolio.
          </p>

          <a
            href={buttonHref}
            download={isDownload ? true : undefined}
            target={isDownload ? undefined : "_blank"}
            rel={isDownload ? undefined : "noreferrer"}
            className="mt-10 inline-flex items-center overflow-hidden rounded-lg bg-[#36B2E3] text-[15px] font-medium text-white shadow-md transition hover:bg-[#2799CC]"
          >
            <span className="px-7 py-3">
              Download the Catalog
            </span>

            <span className="border-l border-white/30 px-5 py-3 text-lg">
              →
            </span>
          </a>
        </div>

        {/* RIGHT IMAGE */}
        <div className="flex w-full justify-center lg:w-[520px] lg:justify-end">

          <img
            src="/fig-preview/images/bdaa2fd7c47ed7d0b8b29785c7e0fc70c1ff420e"
            alt="BioPathogenix Product Catalog"
            className="block w-full max-w-[480px] drop-shadow-[0_30px_50px_rgba(0,0,0,0.45)]"
          />
        </div>
      </div>
    </section>
  );
}