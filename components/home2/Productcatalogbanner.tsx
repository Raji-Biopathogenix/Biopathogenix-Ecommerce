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
    <section className="overflow-hidden rounded-b-[24px] bg-[#0A2F5A] py-12 sm:py-14 lg:py-20">
      <div className="mx-auto flex max-w-[1380px] flex-col items-start justify-between gap-8 px-4 sm:px-6 md:px-10 lg:flex-row lg:gap-20 lg:px-16">

        {/* LEFT CONTENT */}
        <div className="w-full max-w-[500px] pt-2 sm:pt-6 lg:pt-8">

          <h2 className="font-['Poppins'] text-[34px] font-light leading-[0.98] tracking-[-0.03em] !text-[#F4F8FF] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] sm:text-[42px] md:text-[58px] xl:text-[68px]">
            Explore the
            <br />

            <span className="font-semibold !text-[#67C2F2]">
              BioPathogenix
            </span>

            <br />

            <span className="font-light !text-[#F4F8FF]">
              Product Catalog
            </span>
          </h2>

          <p className="mt-6 max-w-[430px] text-[14px] leading-6 !text-white/92 sm:text-[15px] sm:leading-7">
            Download the complete BioPathogenix research portfolio to
            discover molecular assays, nucleic acid extraction kits,
            workflow tools, and laboratory supplies designed to support
            ever-evolving research environments.
          </p>

          <p className="mt-5 max-w-[430px] text-[14px] leading-6 !text-white/88 sm:mt-6 sm:text-[15px] sm:leading-7">
            Our catalog provides a convenient overview of available
            products and solutions across the BioPathogenix portfolio.
          </p>

          <a
            href={buttonHref}
            download={isDownload ? true : undefined}
            target={isDownload ? undefined : "_blank"}
            rel={isDownload ? undefined : "noreferrer"}
            className="mt-8 inline-flex items-center overflow-hidden rounded-lg bg-[#36B2E3] text-[14px] font-medium text-white shadow-md transition hover:bg-[#2799CC] sm:mt-10 sm:text-[15px]"
          >
            <span className="px-5 py-2.5 sm:px-7 sm:py-3">
              Download the Catalog
            </span>

            <span className="border-l border-white/30 px-4 py-2.5 text-base sm:px-5 sm:py-3 sm:text-lg">
              →
            </span>
          </a>
        </div>

        {/* RIGHT IMAGE */}
        <div className="flex w-full justify-center lg:w-[520px] lg:justify-end">

          <img
            src="/fig-preview/images/bdaa2fd7c47ed7d0b8b29785c7e0fc70c1ff420e"
            alt="BioPathogenix Product Catalog"
            className="block w-full max-w-[320px] drop-shadow-[0_30px_50px_rgba(0,0,0,0.45)] sm:max-w-[400px] lg:max-w-[480px]"
          />
        </div>
      </div>
    </section>
  );
}