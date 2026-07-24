"use client";

import { useMemo, useState } from "react";
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
  const [hasError, setHasError] = useState(false);
  const showPlaceholder = !src || hasError;

  return (
    <div
      className={`absolute overflow-hidden bg-white p-1.5 shadow-[0_14px_30px_rgba(18,53,93,0.10)] sm:p-2 ${className}`}
      style={{ clipPath: HEX_CLIP }}
    >
      <div
        className="relative h-full w-full overflow-hidden"
        style={{
          clipPath: HEX_CLIP,
          background: !showPlaceholder
            ? "linear-gradient(180deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.04) 100%)"
            : "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(241,246,251,0.96) 100%)",
          boxShadow: showPlaceholder ? "inset 0 0 0 1px rgba(255,255,255,0.95)" : "none",
        }}
      >
        {!showPlaceholder ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <div
            className="h-full w-full"
            aria-hidden="true"
            style={{
              backgroundImage:
                "radial-gradient(circle at 32% 18%, rgba(255,255,255,0.95), transparent 34%), radial-gradient(circle at 72% 76%, rgba(226,237,248,0.8), transparent 38%), linear-gradient(145deg, rgba(255,255,255,0.98), rgba(238,244,250,0.98))",
            }}
          />
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
      className: "left-0 top-0 z-20 h-[44%] w-[48%]",
    },
    {
      key: "top-right",
      src: images?.[1]?.image,
      alt: images?.[1]?.alt_text || "BioPathogenix lab image",
      className: "right-0 top-[3%] z-10 h-[60%] w-[56%]",
    },
    {
      key: "bottom-left",
      src: images?.[2]?.image,
      alt: images?.[2]?.alt_text || "BioPathogenix tube image",
      className: "bottom-0 left-[3%] z-30 h-[60%] w-[56%]",
    },
    {
      key: "bottom-right",
      src: images?.[3]?.image,
      alt: images?.[3]?.alt_text || "BioPathogenix microscope image",
      className: "bottom-0 right-0 z-20 h-[44%] w-[48%]",
    },
  ];

  return (
    <section
      className="relative overflow-hidden rounded-[30px] px-6 py-14 md:px-14 md:py-20"
      style={{
        backgroundImage: `radial-gradient(circle at 68% 22%, rgba(255,255,255,0.98), rgba(235,242,250,0.72) 28%, transparent 58%), radial-gradient(circle at 18% 68%, rgba(255,255,255,0.96), transparent 40%), url("${HEX_PATTERN_BG}"), linear-gradient(135deg,#f7f9fc 0%,#e8eff7 100%)`,
      }}
    >
      <div className="mx-auto flex max-w-[1320px] flex-col items-center gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="w-full max-w-[620px] lg:w-[46%]">
          <p className="mb-5 text-[0.82rem] font-bold tracking-[0.22em] text-[#16325f]">
            ADVANCED MULTIPLEX
          </p>

          <h1 className="mb-6 max-w-[620px] text-[3.15rem] font-[500] leading-[0.92] tracking-[-0.055em] text-[#163061] sm:text-[4.3rem] md:text-[4.85rem] lg:text-[4.95rem]">
            qPCR Assays
            <br />
            and <span className="text-[#5c98d6]">Integrated</span>
            <br />
            <span className="text-[#5c98d6]">Molecular</span>
          </h1>

          <p className="mb-5 text-[1.14rem] font-semibold leading-snug text-[#17315b] sm:text-[1.22rem]">
            Workflow Solutions for Pathogen Detection.
          </p>

          <p className="mb-10 max-w-[560px] text-[0.98rem] leading-7 text-[#28384d] sm:text-[1rem]">
            BioPathogenix, headquartered in Nicholasville, Kentucky, specializes in the
            development of high-performance multiplex qPCR assays, custom pathogen detection
            panel and integrated nucleic acid workflow solutions designed to support infectious
            pathogen detection, scientific research and laboratory innovation.
          </p>

          <button
            className="inline-flex min-w-[217px] items-center justify-center gap-4 rounded-lg bg-[#264d87] px-8 py-4 text-[1.02rem] font-semibold text-white shadow-[0_12px_24px_rgba(33,73,129,0.22)] transition-colors hover:bg-[#183d6c]"
            onClick={() => router.push(context?.btn_url || "#")}
          >
            <span>{context?.btn_text || "Shop Now"}</span>
            <span className="border-l border-white/30 pl-3">&rarr;</span>
          </button>
        </div>

        <div className="relative hidden h-[480px] w-full max-w-[600px] shrink-0 sm:block lg:h-[640px] lg:w-[54%]">
          {heroSlots.map((slot) => (
            <HexImage key={slot.key} src={slot.src} alt={slot.alt} className={slot.className} />
          ))}
        </div>
      </div>
    </section>
  );
}
