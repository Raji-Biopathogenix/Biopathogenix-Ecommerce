"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import FigmaHexImage from "@/components/common/FigmaHexImage";
import { LandingPageType } from "@/types/header";

interface HeroCarouselprops {
  result?: LandingPageType;
}

// The honeycomb's bounding box in the 1440-wide Figma frame (node 38038-4).
const HONEYCOMB = { x: 720, y: 135, w: 653.33, h: 743.9 };

// Figma polygons (6 points), in frame coordinates. `crop` is the visible part of the
// photo as Figma's image transform gives it: width, left, height, top (0-1 of the photo).
const HERO_IMAGES = [
  {
    // Top Right (large)
    src: "/images/figma/hex-microscope-laptop.webp",
    alt: "Researcher using a microscope",
    x: 929.39,
    y: 135,
    w: 409.93,
    h: 409.93,
    radius: 28.19,
    stroke: 8,
    crop: [0.631, 0.1845, 1, 0],
  },
  {
    // Left (small)
    src: "/images/figma/hex-orange-tubes.webp",
    alt: "Scientist working in a modern laboratory",
    x: 720,
    y: 263.29,
    w: 238.88,
    h: 238.88,
    radius: 33.83,
    stroke: 8,
    crop: [0.3782, 0.2983, 0.7547, 0.2453],
  },
  {
    // Bottom Center (largest)
    src: "/images/figma/hex-holding-tubes.webp",
    alt: "Gloved hands holding sample tubes",
    x: 740.33,
    y: 456.03,
    w: 422.87,
    h: 422.87,
    radius: 28.19,
    stroke: 8,
    crop: [0.5011, 0.2956, 1, 0],
  },
  {
    // Bottom Right (small)
    // Figma stacks two photos in this polygon; this is the top (visible) one.
    src: "/images/figma/hex-microscope-woman.webp",
    alt: "Scientist using a microscope",
    x: 1134.45,
    y: 498.69,
    w: 238.88,
    h: 238.88,
    radius: 16.92,
    stroke: 8,
    crop: [0.5455, 0.2772, 0.874, 0.126],
  },
] as const;

function HeroImage({ x, y, ...image }: (typeof HERO_IMAGES)[number]) {
  return (
    <FigmaHexImage
      {...image}
      style={{
        left: `${((x - HONEYCOMB.x) / HONEYCOMB.w) * 100}%`,
        top: `${((y - HONEYCOMB.y) / HONEYCOMB.h) * 100}%`,
        width: `${(image.w / HONEYCOMB.w) * 100}%`,
        height: `${(image.h / HONEYCOMB.h) * 100}%`,
      }}
    />
  );
}

export default function HeroCarousel({ result }: HeroCarouselprops) {
  const router = useRouter();
  const btnUrl = result?.contexts?.[0]?.btn_url || "#";

  return (
    <section
      data-home="hero"
      className="overflow-hidden bg-[#edf3f8] px-5 pb-6 pt-7 sm:px-6 sm:py-12 md:px-10 md:py-10 lg:p-0"
      style={{
        backgroundImage: "url('/images/home/hero-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Laid out on the 1440-wide Figma frame: the hero is 828px tall below the
          97px header, text starts 104px in, and the honeycomb sits at HONEYCOMB. */}
      <div data-home="hero-layout" className="relative mx-auto flex max-w-[1440px] flex-col items-center gap-5 sm:items-start sm:gap-8 lg:block lg:min-h-[828px]">
        <div data-home="hero-copy" className="relative w-full max-w-[760px] text-center sm:text-left lg:flex lg:w-[54%] lg:max-w-none lg:flex-col lg:pb-[80px] lg:pl-[104px] lg:pt-[87px]">
          {/* Top Label */}
          <p className="mx-auto mb-4 w-fit rounded-full border border-[#c8dcea] bg-white/70 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#153B67] sm:mx-0 sm:mb-5 sm:w-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:text-[13px] sm:tracking-[0.22em] lg:mb-[22px] lg:text-[15px] lg:tracking-[0.14em]">
            {/* The label is set in capitals, but qPCR keeps its own lower-case q. */}
            ADVANCED MULTIPLEX <span className="normal-case">qPCR</span> SUPPLIER
          </p>

          {/* Heading */}
          <h1 className="text-balance font-['Quicksand'] text-[clamp(32px,8vw,46px)] font-bold leading-[1.1] tracking-[-0.035em] text-[#0F2D5C] sm:text-[56px] sm:tracking-[-0.04em] md:text-[64px] lg:whitespace-nowrap lg:text-[52px] lg:leading-[1.02] xl:text-[64px]">
            {/* Three lines on desktop, as in the Figma: "Complete Workflow / Solutions for / Pathogen Detection." */}
            Complete Workflow <br className="hidden lg:block" />
            Solutions for <br className="hidden lg:block" />
            <span className="text-[#4A97D3]">Pathogen Detection.</span>
          </h1>

          <h2 className="mx-auto mt-4 max-w-[340px] text-[16px] font-semibold leading-[1.4] tracking-normal text-[#173963] sm:mx-0 sm:mt-7 sm:max-w-none sm:text-[20px] sm:leading-[1.35]">
            Precision you can trust. Partners you can count on.
          </h2>

          {/* Description */}
          <p className="mx-auto mt-3 max-w-[380px] text-[14px] leading-[1.65] text-[#4E5F73] sm:mx-0 sm:mt-6 sm:max-w-[580px] sm:text-[18px] lg:max-w-[500px] lg:text-[17px] lg:leading-[1.55] lg:text-[#1F2D44]">
            From custom qPCR assays and validation-ready quality controls to
            extraction technologies and scientific support, BioPathogenix gives
            laboratories everything they need to validate with confidence and keep
            testing moving.
          </p>

          {/* Button */}
          <button
            onClick={() => router.push(btnUrl)}
            className="mt-5 inline-flex min-h-[50px] w-full max-w-[340px] items-center justify-center gap-4 rounded-xl bg-[#0F4A80] px-6 py-3 text-[16px] font-semibold text-white shadow-[0_6px_18px_rgba(15,74,128,0.18)] transition hover:bg-[#0b3b66] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F4A80] sm:mt-10 sm:h-[56px] sm:w-fit sm:max-w-none sm:gap-5 sm:self-start sm:rounded-[8px] sm:px-8 sm:py-0 sm:text-[18px] sm:shadow-none lg:mt-[46px] lg:h-[58px] lg:gap-8 lg:rounded-[6px] lg:px-7 lg:text-[20px]"
          >
            <span>Shop Now</span>

            {/* The Figma button has no divider. */}
            <span className="h-6 border-l border-white/30 lg:hidden" />

            <ArrowRight className="h-6 w-6" strokeWidth={2.25} aria-hidden="true" />
          </button>
        </div>

        <div data-home="hero-images" className="flex w-full justify-center lg:absolute lg:left-[55.07%] lg:top-[68px] lg:w-[41.18%]">
          <div className="relative aspect-[653/744] w-full max-w-[320px] sm:max-w-[440px] lg:max-w-none">
            {HERO_IMAGES.map((image) => (
              <HeroImage key={image.src} {...image} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

