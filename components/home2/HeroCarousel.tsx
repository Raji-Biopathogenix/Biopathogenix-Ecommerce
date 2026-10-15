"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { LandingPageType } from "@/types/header";

interface HeroCarouselprops {
  result?: LandingPageType;
}

// The honeycomb's bounding box in the 1440-wide Figma frame.
const HONEYCOMB = { x: 795, y: 159, w: 613, h: 625 };

// Figma polygons (6 points), in frame coordinates. The top-left tile's numbers
// weren't shared, so it is measured from the prototype; it has no stroke.
const HERO_IMAGES = [
  {
    // Top Left (small)
    src: "/fig-preview/images/303490d404583a39e84a9657020d1ad7f04a4966",
    alt: "Scientist working in a modern laboratory",
    x: 795,
    y: 232,
    w: 239,
    h: 225,
    radius: 20,
    stroke: 0,
  },
  {
    // Top Right (large)
    src: "/fig-preview/images/b8563fa9c06f015706a7c5d6998d6726b96468eg",
    alt: "Researcher using a microscope",
    x: 1012.01,
    y: 159,
    w: 316.81,
    h: 320.9,
    radius: 28.19,
    stroke: 8,
  },
  {
    // Bottom Center (largest)
    src: "/images/validation%20services/2.png",
    alt: "Gloved hands holding sample tubes",
    x: 857.99,
    y: 428.66,
    w: 340.17,
    h: 355.34,
    radius: 28.19,
    stroke: 8,
  },
  {
    // Bottom Right (small)
    src: "/fig-preview/images/341d4c17677780e3ffe716da598d5cd49fe71a94",
    alt: "Scientist writing lab notes beside a microscope",
    // Same size as the top-left tile so the two small tiles match.
    x: 1168.5,
    y: 451.8,
    w: 239,
    h: 225,
    radius: 20,
    stroke: 8,
  },
] as const;

// Pointy-top hexagon as Figma draws a 6-point polygon in a w x h box: corners on
// the inscribed ellipse, so the sides sit at 0.866w, not the box edges. Each
// corner is rounded like Figma's corner radius (tangent length r / tan(60deg)).
function roundedHexPath(w: number, h: number, r: number) {
  const side = (w / 2) * (Math.sqrt(3) / 2);
  const points = [
    [w / 2, 0],
    [w / 2 + side, h / 4],
    [w / 2 + side, (3 * h) / 4],
    [w / 2, h],
    [w / 2 - side, (3 * h) / 4],
    [w / 2 - side, h / 4],
  ];
  const t = r / Math.sqrt(3);
  const along = (from: number[], to: number[]) => {
    const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
    return [from[0] + ((to[0] - from[0]) * t) / len, from[1] + ((to[1] - from[1]) * t) / len];
  };

  return (
    points
      .map((point, i) => {
        const prev = points[(i + points.length - 1) % points.length];
        const next = points[(i + 1) % points.length];
        const start = along(point, prev);
        const end = along(point, next);
        return `${i === 0 ? "M" : "L"}${start[0]},${start[1]} Q${point[0]},${point[1]} ${end[0]},${end[1]}`;
      })
      .join(" ") + " Z"
  );
}

function HeroImage({
  src,
  alt,
  x,
  y,
  w,
  h,
  radius,
  stroke,
}: (typeof HERO_IMAGES)[number]) {
  // useId output contains ":" which breaks url(#...) references.
  const clipId = `hex-${useId().replace(/[^\w-]/g, "")}`;
  const path = roundedHexPath(w, h, radius);

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={alt}
      className="absolute overflow-visible"
      style={{
        left: `${((x - HONEYCOMB.x) / HONEYCOMB.w) * 100}%`,
        top: `${((y - HONEYCOMB.y) / HONEYCOMB.h) * 100}%`,
        width: `${(w / HONEYCOMB.w) * 100}%`,
        height: `${(h / HONEYCOMB.h) * 100}%`,
      }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image href={src} width={w} height={h} preserveAspectRatio="xMidYMid slice" />
        {/* Doubled and clipped, so it reads as Figma's inside stroke. */}
        {stroke > 0 && <path d={path} fill="none" stroke="#fff" strokeWidth={stroke * 2} />}
      </g>
    </svg>
  );
}

export default function HeroCarousel({ result }: HeroCarouselprops) {
  const router = useRouter();
  const btnUrl = result?.contexts?.[0]?.btn_url || "#";

  return (
    <section
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
      <div className="relative mx-auto flex max-w-[1440px] flex-col items-center gap-5 sm:items-start sm:gap-8 lg:block lg:min-h-[828px]">
        <div className="relative w-full max-w-[760px] text-center sm:text-left lg:flex lg:w-[54%] lg:max-w-none lg:flex-col lg:pb-[80px] lg:pl-[104px] lg:pt-[87px]">
          {/* Top Label */}
          <p className="mx-auto mb-4 w-fit rounded-full border border-[#c8dcea] bg-white/70 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-[#153B67] sm:mx-0 sm:mb-5 sm:w-auto sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:text-[13px] sm:tracking-[0.22em] lg:mb-[22px] lg:text-[15px] lg:tracking-[0.14em]">
            ADVANCED MULTIPLEX QPCR SUPPLIER
          </p>

          {/* Heading */}
          <h1 className="text-balance font-['Quicksand'] text-[clamp(32px,8vw,46px)] font-bold leading-[1.1] tracking-[-0.035em] text-[#0F2D5C] sm:text-[56px] sm:tracking-[-0.04em] md:text-[64px] lg:text-[58px] lg:leading-[1.02] xl:text-[72px]">
            Complete Workflow Solutions for{" "}
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

        <div className="flex w-full justify-center lg:absolute lg:left-[55.21%] lg:top-[62px] lg:w-[42.57%]">
          <div className="relative aspect-[613/625] w-full max-w-[320px] sm:max-w-[440px] lg:max-w-none">
            {HERO_IMAGES.map((image) => (
              <HeroImage key={image.src} {...image} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

