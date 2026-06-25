"use client";
import { LandingPageType } from "@/types/header";


interface ProductCatalogBannerprops{
  result: LandingPageType
}


export default function ProductCatalogBanner({result}:ProductCatalogBannerprops) {
  const primaryContext = result?.contexts?.[0];
  const buttonHref = primaryContext?.download_file || primaryContext?.btn_url || "#";
  const isDownload = Boolean(primaryContext?.download_file);
  
  return (
    <section className="w-full px-5">
    { result?.contexts?.length > 0 &&  <div
        className="w-full rounded-2xl py-16 px-8 text-center"
        style={{
          background: "linear-gradient(135deg, #0d2a4e 0%, #1a4a7a 100%)",
          backgroundImage: `linear-gradient(135deg, rgba(13,31,60,0.95) 0%, rgba(20,60,110,0.95) 100%)`,
        }}
      >
        <h2 className="text-[2rem] font-bold text-white mb-5 leading-snug">
          {result?.contexts?.[0]?.title || "Explore Our Product Catalog"}
        </h2>

        <p className="text-[0.95rem] text-white/85 leading-relaxed max-w-[620px] mx-auto mb-4">
          {result?.contexts?.[0]?.description}
        </p>

        <p className="text-[0.95rem] text-white/85 leading-relaxed max-w-[560px] mx-auto mb-8">
         {primaryContext?.short_description}
        </p>

        <a
          href={buttonHref}
          className="inline-flex items-center gap-2 px-8 py-3 bg-[#3ab5d0] hover:bg-[#2aa0bc] text-white text-[0.95rem] font-semibold rounded-lg transition-colors"
          target="_blank"
          rel="noreferrer"
          download={isDownload ? true : undefined}
        >
          {primaryContext?.btn_text}

          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8 17 12 21 16 17" />
            <line x1="12" y1="12" x2="12" y2="21" />
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
          </svg>
        </a>
      </div>}
    </section>
  );
}
