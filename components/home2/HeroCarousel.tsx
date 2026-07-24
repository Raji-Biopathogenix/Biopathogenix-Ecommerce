"use client";
import { useMemo } from "react";
import { LandingPageType } from "@/types/header";
import { useRouter } from "next/navigation";

interface HeroCarouselprops {
  result?: LandingPageType;
}

const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

const HEX_PATTERN_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='146' viewBox='0 0 84 146'%3E%3Cpath d='M42 0L84 24V96L42 120L0 96V24Z' fill='none' stroke='%23cfe4f2' stroke-width='1'/%3E%3Cpath d='M42 26L84 50V122L42 146L0 122V50Z' fill='none' stroke='%23cfe4f2' stroke-width='1'/%3E%3C/svg%3E";

function HexImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className: string;
}) {
  if (!src) return null;
  return (
    <div className={`absolute bg-white p-1.5 sm:p-2 ${className}`} style={{ clipPath: HEX_CLIP }}>
      <div className="h-full w-full" style={{ clipPath: HEX_CLIP }}>
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

export default function HeroCarousel({ result }: HeroCarouselprops) {
  const router = useRouter();
  const context = result?.contexts?.[0];
  const images = useMemo(() => result?.images ?? [], [result]);

  return (
    <section
      className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#eef6fb_0%,#e3f0fa_100%)] px-6 py-14 md:px-14 md:py-20"
      style={{ backgroundImage: `linear-gradient(135deg,#eef6fb 0%,#e3f0fa 100%), url("${HEX_PATTERN_BG}")` }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-14 lg:flex-row lg:items-center lg:justify-between">
        {/* Left — copy */}
        <div className="w-full max-w-[620px] lg:w-1/2">
          <p className="mb-4 text-[0.8rem] font-bold tracking-[0.14em] text-[#0d1f3c]">
            ADVANCED MULTIPLEX
          </p>

          <h1 className="mb-6 text-[2.6rem] font-extrabold leading-[1.08] text-[#0d1f3c] md:text-[3.4rem]">
            qPCR Assays
            <br />
            and <span className="text-[#3ab5d0]">Integrated</span>
            <br />
            <span className="text-[#3ab5d0]">Molecular</span>
          </h1>

          <p className="mb-4 text-[1.15rem] font-semibold leading-snug text-[#0d1f3c]">
            Workflow Solutions for Pathogen Detection.
          </p>

          <p className="mb-9 max-w-[540px] text-[0.98rem] leading-7 text-[#4a5f7a]">
            BioPathogenix, headquartered in Nicholasville, Kentucky, specializes in the
            development of high-performance multiplex qPCR assays, custom pathogen detection
            panel and integrated nucleic acid workflow solutions designed to support infectious
            pathogen detection, scientific research and laboratory innovation.
          </p>

          <button
            className="inline-flex items-center gap-3 rounded-lg bg-[#0d2a4e] px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#173d69]"
            onClick={() => router.push(context?.btn_url || "#")}
          >
            Shop Now
            <span className="border-l border-white/30 pl-3">→</span>
          </button>
        </div>

        {/* Right — hexagon photo collage */}
        <div className="relative hidden h-[440px] w-full max-w-[560px] shrink-0 sm:block lg:h-[560px] lg:w-1/2">
          <HexImage
            src={images?.[0]?.image}
            alt={images?.[0]?.alt_text || "BioPathogenix lab sample"}
            className="left-0 top-0 h-[42%] w-[46%]"
          />
          <HexImage
            src={images?.[1]?.image}
            alt={images?.[1]?.alt_text || "Scientist at microscope"}
            className="right-0 top-[6%] h-[58%] w-[54%]"
          />
          <HexImage
            src={images?.[2]?.image}
            alt={images?.[2]?.alt_text || "Blood sample tubes"}
            className="bottom-0 left-[6%] h-[58%] w-[54%]"
          />
          <HexImage
            src={images?.[3]?.image}
            alt={images?.[3]?.alt_text || "Scientist in laboratory"}
            className="bottom-0 right-0 h-[42%] w-[46%]"
          />
        </div>
      </div>
    </section>
  );
}
