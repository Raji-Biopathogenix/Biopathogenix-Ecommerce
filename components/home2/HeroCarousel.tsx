"use client";

import { useRouter } from "next/navigation";
import { LandingPageType } from "@/types/header";

interface HeroCarouselprops {
  result?: LandingPageType;
}

// Flat-top hexagon: width is 2/sqrt(3) (~1.1547) times height. Only set
// height as a % of the container and let width derive from this ratio,
// otherwise tiles render as squished/stretched diamonds.
const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";
const HEX_RATIO = 0.89;

const HERO_IMAGES = [
  {
    // Top Left (small)
    src: "/fig-preview/images/303490d404583a39e84a9657020d1ad7f04a4966",
    alt: "Scientist working in a modern laboratory",
    className:
      "left-[5%] top-[15%] h-[24%] sm:left-[6%] sm:top-[15%] sm:h-[25%] md:left-[7%] md:top-[15%] md:h-[27%] lg:left-[8%] lg:top-[14%] lg:h-[29%]",
  },
  {
    // Top Right (large)
    src: "/fig-preview/images/b8563fa9c06f015706a7c5d6998d6726b96468eg",
    alt: "Researcher using a microscope",
    className:
      "right-[3%] top-[4%] h-[40%] sm:right-[6%] sm:top-[3%] sm:h-[43%] md:right-[10%] md:top-[2%] md:h-[46%] lg:right-[18%] lg:top-[0%] lg:h-[48%]",
  },
  {
    // Bottom Center (largest)
    src: "/images/validation%20services/2.png",
    alt: "Gloved hands holding sample tubes",
    className:
      "left-[16%] bottom-[2%] h-[46%] sm:left-[18%] sm:bottom-[2%] sm:h-[50%] md:left-[16%] md:bottom-[4%] md:h-[53%] lg:left-[10%] lg:bottom-[7%] lg:h-[56%]",
  },
  {
    // Bottom Right (small)
    src: "/fig-preview/images/341d4c17677780e3ffe716da598d5cd49fe71a94",
    alt: "Scientist writing lab notes beside a microscope",
    className:
      "right-[2%] bottom-[15%] h-[22%] sm:right-[2%] sm:bottom-[16%] sm:h-[24%] md:right-[5%] md:bottom-[20%] md:h-[26%] lg:right-[10%] lg:bottom-[28%] lg:h-[28%]",
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
      className={`absolute overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.14)] ${className}`}
      style={{ clipPath: HEX_CLIP, aspectRatio: HEX_RATIO }}
    >
      <div className="h-full w-full overflow-hidden" style={{ clipPath: HEX_CLIP }}>
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover object-center"
        />
      </div>
    </div>
  );
}

export default function HeroCarousel({ result }: HeroCarouselprops) {
  const router = useRouter();
  const btnUrl = result?.contexts?.[0]?.btn_url || "#";

  return (
    <section
      className="overflow-hidden bg-[#edf3f8] px-4 py-10 sm:px-6 sm:py-12 md:px-10 md:py-10 lg:px-12 lg:py-14"
      style={{
        backgroundImage: "url('/images/home/hero-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="mx-auto flex max-w-[1360px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-[760px] lg:h-[700px] lg:w-[52%]">
          {/* Top Label */}
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#153B67] sm:mb-5 sm:text-[13px] sm:tracking-[0.22em]">
            ADVANCED MULTIPLEX QPCR SUPPLIER
          </p>

          {/* Heading */}
          <h1 className="font-['Quicksand'] text-[42px] font-bold leading-[1.02] tracking-[-0.04em] text-[#0F2D5C] sm:text-[56px] md:text-[64px] lg:text-[74px]">
            Precision you
            <br />
            can trust.
            <br />
            <span className="text-[#4A97D3]">Partners you</span>
            <br />
            <span className="text-[#4A97D3]">can count on.</span>
          </h1>

          <h2 className="mt-6 text-[18px] font-semibold leading-[1.35] tracking-normal text-[#173963] sm:mt-7 sm:text-[20px]">
            Complete Workflow Solutions for Pathogen Detection.
          </h2>

          {/* Description */}
          <p className="mt-5 max-w-[560px] text-[16px] leading-[1.6] text-[#4E5F73] sm:mt-6 sm:text-[18px] sm:leading-[1.65]">
            From custom qPCR assays and validation-ready quality controls to
            extraction technologies and scientific support, BioPathogenix gives
            laboratories everything they need to validate with confidence and keep
            testing moving.
          </p>

          {/* Button */}
          <button
            onClick={() => router.push(btnUrl)}
            className="mt-8 inline-flex h-[50px] items-center gap-4 rounded-[10px] bg-[#0F4A80] px-6 text-[16px] font-semibold text-white transition hover:bg-[#0b3b66] sm:mt-10 sm:h-[56px] sm:gap-5 sm:px-8 sm:text-[18px]"
          >
            <span>Shop Now</span>

            <span className="h-6 border-l border-white/30" />

            <span className="text-xl">→</span>
          </button>
        </div>

        <div className="relative h-[320px] w-full max-w-[760px] sm:h-[420px] md:h-[520px] lg:h-[700px] lg:w-[52%]">
          <div className="absolute inset-0 opacity-30 " />
          {HERO_IMAGES.map((image) => (
            <HeroImage key={image.src} {...image} />
          ))}
        </div>
      </div>
    </section>
  );
}


