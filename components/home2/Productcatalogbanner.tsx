"use client";

import { LandingPageType } from "@/types/header";

interface ProductCatalogBannerprops {
  result?: LandingPageType;
}

export default function ProductCatalogBanner({ result }: ProductCatalogBannerprops) {
  const context = result?.contexts?.[0];
  const buttonHref = context?.download_file || context?.btn_url || "#";
  const isDownload = Boolean(context?.download_file);

  return (
    <section className="overflow-hidden bg-[#0a1c3f] px-6 py-16 md:px-14">
      <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full max-w-[560px]">
          <h2 className="font-['Poppins'] text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.03em] text-white md:text-[3rem]">
            Explore the
            <br />
            <span className="text-[#5fb8dd]">BioPathogenix</span>
            <br />
            Product Catalog
          </h2>

          <p className="mt-6 text-[0.98rem] leading-relaxed text-white/80">
            Download the complete BioPathogenix research portfolio to discover molecular assays,
            nucleic acid extraction kits, workflow tools, and laboratory supplies designed to
            support ever-evolving research environments.
          </p>

          <p className="mt-5 text-[0.98rem] leading-relaxed text-white/80">
            Our catalog provides a convenient overview of available products and solutions
            across the BioPathogenix portfolio.
          </p>

          <a
            href={buttonHref}
            className="mt-8 inline-flex items-center gap-4 rounded-[12px] bg-[#3ab5d0] px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#2aa0bc]"
            target={isDownload ? undefined : "_blank"}
            rel={isDownload ? undefined : "noreferrer"}
            download={isDownload ? true : undefined}
          >
            Download the Catalog
            <span className="border-l border-white/30 pl-4">-&gt;</span>
          </a>
        </div>

        <div className="w-full max-w-[440px] flex-shrink-0">
          <img
            src="/fig-preview/images/bdaa2fd7c47ed7d0b8b29785c7e0fc70c1ff420e"
            alt="BioPathogenix product catalog cover"
            className="w-full rounded-[14px] shadow-[0_30px_60px_rgba(0,0,0,0.35)]"
          />
        </div>
      </div>
    </section>
  );
}
