"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LandingPageType } from "@/types/header";

interface HeroCarouselprops {
  result?: LandingPageType;
}

const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

const HEX_PATTERN_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='146' viewBox='0 0 84 146'%3E%3Cpath d='M42 0L84 24V96L42 120L0 96V24Z' fill='none' stroke='%23cfe4f2' stroke-width='1'/%3E%3Cpath d='M42 26L84 50V122L42 146L0 122V50Z' fill='none' stroke='%23cfe4f2' stroke-width='1'/%3E%3C/svg%3E";

type HexSlotProps = {
  src?: string;
  alt: string;
  className: string;
};

function HexImage({ src, alt, className }: HexSlotProps) {
  return (
    <div
      className={`absolute overflow-hidden bg-white p-1.5 shadow-[0_18px_45px_rgba(18,53,93,0.12)] sm:p-2 ${className}`}
      style={{ clipPath: HEX_CLIP }}
    >
      <div
        className={`relative h-full w-full overflow-hidden ${src ? "" : "border border-dashed border-white/70"}`}
        style={{
          clipPath: HEX_CLIP,
          background: src
            ? "linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.04) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(228,239,249,0.92) 100%)",
        }}
      >
        {src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.92), transparent 34%), linear-gradient(135deg, rgba(240,247,253,0.96), rgba(216,231,244,0.96))",
            }}
          >
            <div className="h-[55%] w-[55%] rounded-[24px] border border-white/80 bg-white/45 shadow-inner" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function HeroCarousel({ result }: HeroCarouselprops) {
  const router = useRouter();
  const context = result?.contexts?.[0];
  const images = useMemo(
    () => [...(result?.images ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [result]
  );

  const heroSlots = [
    {
      key: "top-left",
      src: images?.[0]?.image,
      alt: images?.[0]?.alt_text || "BioPathogenix sample image",
      className: "left-[1%] top-[8%] z-20 h-[36%] w-[34%] md:h-[40%] md:w-[31%] lg:h-[34%] lg:w-[27%]",
    },
    {
      key: "top-right",
      src: images?.[1]?.image,
      alt: images?.[1]?.alt_text || "BioPathogenix lab image",
      className: "right-[6%] top-[4%] z-10 h-[52%] w-[50%] md:right-[2%] lg:h-[54%] lg:w-[46%]",
    },
    {
      key: "bottom-left",
      src: images?.[2]?.image,
      alt: images?.[2]?.alt_text || "BioPathogenix tube image",
      className: "left-[8%] bottom-[4%] z-30 h-[54%] w-[54%] md:left-[8%] lg:left-[8%] lg:h-[50%] lg:w-[46%]",
    },
    {
      key: "bottom-right",
      src: images?.[3]?.image,
      alt: images?.[3]?.alt_text || "BioPathogenix microscope image",
      className: "right-[2%] bottom-[10%] z-20 h-[34%] w-[32%] md:h-[38%] md:w-[30%] lg:h-[32%] lg:w-[26%]",
    },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-[30px] px-6 py-14 md:px-14 md:py-20"
      style={{
        backgroundImage: `radial-gradient(circle at 68% 22%, rgba(245,250,255,0.95), rgba(229,239,249,0.65) 26%, transparent 52%), radial-gradient(circle at 18% 68%, rgba(255,255,255,0.96), transparent 38%), url("${HEX_PATTERN_BG}"), linear-gradient(135deg,#f5f8fc 0%,#e4edf7 100%)`,
      }}
    >
      <div className="mx-auto flex max-w-[1320px] flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="w-full max-w-[620px] lg:w-[48%]">
          <p className="mb-5 text-[0.8rem] font-bold tracking-[0.18em] text-[#17315b]">
            ADVANCED MULTIPLEX
          </p>

          <h1 className="mb-6 max-w-[620px] text-[3.05rem] font-[500] leading-[0.95] tracking-[-0.045em] text-[#142d5b] sm:text-[4.25rem] md:text-[4.75rem] lg:text-[4.9rem]">
            qPCR Assays
            <br />
            and <span className="text-[#5c98d6]">Integrated</span>
            <br />
            <span className="text-[#5c98d6]">Molecular</span>
          </h1>

          <p className="mb-5 text-[1.1rem] font-semibold leading-snug text-[#17315b] sm:text-[1.2rem]">
            Workflow Solutions for Pathogen Detection.
          </p>

          <p className="mb-10 max-w-[560px] text-[0.98rem] leading-7 text-[#2e3f55] sm:text-[1rem]">
            BioPathogenix, headquartered in Nicholasville, Kentucky, specializes in the
            development of high-performance multiplex qPCR assays, custom pathogen detection
            panel and integrated nucleic acid workflow solutions designed to support infectious
            pathogen detection, scientific research and laboratory innovation.
          </p>

          <button
            className="inline-flex items-center gap-3 rounded-lg bg-[#264d87] px-8 py-4 text-base font-semibold text-white shadow-[0_12px_24px_rgba(33,73,129,0.22)] transition-colors hover:bg-[#183d6c]"
            onClick={() => router.push(context?.btn_url || "#")}
          >
            <span>{context?.btn_text || "Shop Now"}</span>
            <span className="border-l border-white/30 pl-3">&rarr;</span>
          </button>
        </div>

        <div className="relative hidden h-[520px] w-full shrink-0 sm:block lg:h-[620px] lg:w-[52%]">
          {heroSlots.map((slot) => (
            <HexImage key={slot.key} src={slot.src} alt={slot.alt} className={slot.className} />
          ))}
        </div>
      </div>
    </section>
  );
}
