"use client";

import { useRouter } from "next/navigation";
import { LandingPageType } from "@/types/header";

interface HeroCarouselprops {
  result?: LandingPageType;
}

// Flat-top hexagon: width is 2/sqrt(3) (~1.1547) times height. Only set
// height as a % of the container and let width derive from this ratio,
// otherwise tiles render as squished/stretched diamonds.
const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
const HEX_RATIO = 1.1547;

const HERO_IMAGES = [
  {
    src: "/fig-preview/images/303490d404583a39e84a9657020d1ad7f04a4965",
    alt: "Scientist working in a modern laboratory",
    className: "left-0 top-[4%] z-20 h-[40%]",
  },
  {
    src: "/fig-preview/images/b8563fa9c06f015706a7c5d6998d6726b96468ef",
    alt: "Researcher using a microscope",
    className: "right-0 top-0 z-10 h-[60%]",
  },
  {
    src: "/fig-preview/images/794d214fa013d6197197895dda9d981efc8df127",
    alt: "Scientist writing lab notes beside a microscope",
    className: "right-[2%] bottom-[8%] z-20 h-[40%]",
  },
  {
    src: "/fig-preview/images/341d4c17677780e3ffe716da598d5cd49fe71a93",
    alt: "Gloved hands holding sample tubes",
    className: "left-[8%] bottom-0 z-30 h-[60%] translate-y-[10%]",
  },
] as const;

function HeroImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  return (
    <div
      className={`absolute overflow-hidden bg-white p-1.5 shadow-[0_16px_34px_rgba(14,33,61,0.14)] sm:p-2 ${className}`}
      style={{ clipPath: HEX_CLIP, aspectRatio: HEX_RATIO }}
    >
      <div className="h-full w-full overflow-hidden" style={{ clipPath: HEX_CLIP }}>
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

export default function HeroCarousel({ result }: HeroCarouselprops) {
  const router = useRouter();
  const btnUrl = result?.contexts?.[0]?.btn_url || "#";

  return (
    <section className="overflow-hidden bg-[linear-gradient(135deg,#f8fbfe_0%,#edf5fb_58%,#f7fbff_100%)] px-6 py-14 md:px-14 md:py-20">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full max-w-[640px] lg:w-[48%]">
          <h1 className="max-w-[740px] font-['Poppins'] text-[2.9rem] font-semibold leading-[1.03] tracking-[-0.04em] text-[#13254a] sm:text-[3.55rem] md:text-[4.15rem] lg:text-[4.85rem]">
            Advanced Multiplex
            <br />
            qPCR Assays and Integrated
            <br />
            Molecular Workflow Solutions
            <br />
            for Pathogen Detection.
          </h1>

          <p className="mt-5 max-w-[620px] text-[1.18rem] font-medium leading-snug text-[#16325d] sm:text-[1.26rem]">
            Workflow Solutions for Pathogen Detection.
          </p>

          <p className="mt-6 max-w-[610px] text-[1.02rem] leading-[1.78] text-[#4a5c73]">
            BioPathogenix, headquartered in Nicholasville, Kentucky, specializes in the
            development of high-performance multiplex qPCR assays, custom pathogen detection
            panel and integrated nucleic acid workflow solutions designed to support infectious
            pathogen detection, scientific research and laboratory innovation.
          </p>

          <button
            className="mt-10 inline-flex min-w-[220px] items-center justify-center gap-4 rounded-[12px] bg-[#163864] px-8 py-4 text-[1rem] font-semibold text-white shadow-[0_16px_28px_rgba(22,56,100,0.25)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#102b4f]"
            onClick={() => router.push(btnUrl)}
          >
            <span>Shop Now</span>
            <span className="border-l border-white/30 pl-4">-&gt;</span>
          </button>
        </div>

        <div className="relative h-[460px] w-full lg:h-[620px] lg:w-[52%]">
          {HERO_IMAGES.map((image) => (
            <HeroImage key={image.src} {...image} />
          ))}
        </div>
      </div>
    </section>
  );
}
