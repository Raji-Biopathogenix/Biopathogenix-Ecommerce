"use client";

import { useEffect, useRef, useState } from "react";
import { LandingPageType } from "@/types/header";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ShopByCategoryprops {
  result?: LandingPageType;
}

// Ordered as in the Figma frame.
const CATEGORIES = [
  {
    title: "Specimen Collection Supplies",
    image: "/fig-preview/images/47de23b4d89bd43c2c82125a838f1ca90b06ab66",
    link: "https://bio.biopathogenix.com/product/specimen-collection-supplies",
  },
  {
    title: "qPCR Assays",
    image: "/fig-preview/images/964c41576142d9cb765f65a59510cc79a66be001",
    link: "https://bio.biopathogenix.com/product/qplex-pcr-assays",
  },
  {
    title: "DNA/RNA Extraction Kits",
    image: "/fig-preview/images/060537cbda24b2a5cd4fc145fa7271e599487b7c",
    link: "https://bio.biopathogenix.com/product/extraction-sample-prep",
  },
  {
    title: "PCR Lab Consumables",
    image: "/fig-preview/images/341d4c17677780e3ffe716da598d5cd49fe71a93",
    link: "https://bio.biopathogenix.com/product/specimen-collection-supplies",
  },
  {
    title: "Personal Protection Equipment",
    image: "/images/PPE/face-mask-img-for-website-1-1000x1000.jpg",
    link: "https://bio.biopathogenix.com/product/ppe",
  },
] as const;

export default function ShopByCategory({ result: _result }: ShopByCategoryprops) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState({ left: false, right: false });
  void _result;

  const scrollTrack = (left: number) => {
    trackRef.current?.scrollTo({
      left,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  };

  const revealCard = (card: HTMLAnchorElement) => {
    const track = trackRef.current;
    if (!track) return;
    const viewport = track.getBoundingClientRect();
    const bounds = card.getBoundingClientRect();
    const padding = 12;

    if (bounds.left < viewport.left) {
      scrollTrack(track.scrollLeft + bounds.left - viewport.left - padding);
    } else if (bounds.right > viewport.right) {
      scrollTrack(track.scrollLeft + bounds.right - viewport.right + padding);
    }
  };

  const step = (direction: -1 | 1) => {
    const track = trackRef.current;
    const card = track?.firstElementChild;
    if (!track || !card) return;
    const gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
    scrollTrack(track.scrollLeft + direction * (card.getBoundingClientRect().width + gap));
  };

  // Desktop: centre the row so three cards show in full with half a card at each edge
  // (card widths are set in HomePage.module.css). Smaller screens start at the first card.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollLeft = window.matchMedia("(min-width: 1024px)").matches
      ? (track.scrollWidth - track.clientWidth) / 2
      : 0;

    const updateControls = () => {
      setCanScroll({
        left: track.scrollLeft > 1,
        right: track.scrollLeft < track.scrollWidth - track.clientWidth - 1,
      });
    };
    updateControls();
    track.addEventListener("scroll", updateControls, { passive: true });
    const observer = new ResizeObserver(updateControls);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", updateControls);
      observer.disconnect();
    };
  }, []);

  return (
    <section data-home="categories" className="relative overflow-hidden bg-white py-14 sm:py-16 lg:py-20">
      <div data-home="category-artwork" className="relative">
        <h2
          className="
                    pointer-events-none
                    absolute
                    left-1/2
                    -translate-x-1/2
                    -translate-y-10
                    sm:-translate-y-16
                    md:-translate-y-26
                    lg:-translate-y-35
                    select-none
                    whitespace-nowrap
                    text-[64px]
                    sm:text-[90px]
                    md:text-[130px]
                    lg:text-[180px]
                    text-[#173963]
                    opacity-[0.03]
                    md:opacity-[0.04]
                    lg:opacity-[0.05]
                    [mask-image:linear-gradient(to_bottom,black_0%,black_30%,rgba(0,0,0,0.45)_55%,transparent_100%)]
                    [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_30%,rgba(0,0,0,0.45)_55%,transparent_100%)]
                  "
        >
          Categories
        </h2>
        <div className="relative mb-6 mt-8 text-center sm:mb-10 sm:mt-10 lg:mb-10 lg:mt-12">
          <h2 className="text-[28px] font-medium leading-tight text-[#173963] sm:text-[36px] md:text-[42px] lg:text-[52px]">
            Shop By{" "}
            <span className="font-semibold text-[#5AA7E8]">
              Category
            </span>
          </h2>
        </div>

        <div className="relative top-6 w-full sm:top-8 lg:top-10">
          {/* Hovering a clipped card brings it fully into view. Touch users can swipe. */}
          <div
            id="shop-category-track"
            ref={trackRef}
            role="region"
            aria-label="Product categories"
            className="flex w-full snap-x snap-mandatory gap-3 overflow-x-auto px-3 [scrollbar-width:none] sm:gap-4 md:snap-none [&::-webkit-scrollbar]:hidden"
          >
            {CATEGORIES.map((category) => {
              const link = category.link;

              return (
                <a
                  key={category.title}
                  href={link}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                      revealCard(event.currentTarget);
                    }
                  }}
                  onFocus={(event) => revealCard(event.currentTarget)}
                  className="
                        group
                        relative
                        aspect-[430/563]
                        w-[260px]
                        shrink-0
                        snap-center
                        cursor-pointer
                        overflow-hidden
                        rounded-[20px]
                        outline-none
                        focus-visible:ring-4
                        focus-visible:ring-inset
                        focus-visible:ring-[#5AA7E8]
                        sm:w-[320px]
                        sm:rounded-[24px]
                        lg:w-[400px]
                        xl:w-[430px]
                    "
                >
                  {/* Image */}
                  <img
                    src={category.image}
                    alt={category.title}
                    className="
                            absolute
                            inset-0
                            h-full
                            w-full
                            object-cover
                            transition-transform
                            duration-500
                            group-hover:scale-105
                            motion-reduce:transition-none
                            motion-reduce:group-hover:scale-100
                        "
                  />
                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08284d] via-[#08284d66] to-transparent" />
                  {/* Bottom Content */}
                  <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between sm:bottom-6 sm:left-5 sm:right-5">
                    <h3 className="max-w-[180px] text-[18px] font-semibold leading-tight !text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] sm:max-w-[210px] sm:text-[20px] lg:max-w-[260px] lg:text-[26px]">
                      {category.title}
                    </h3>
                    <div
                      className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-full
                          bg-white
                          transition-all
                          duration-300
                          group-hover:translate-x-1
                          motion-reduce:transition-none
                          motion-reduce:group-hover:translate-x-0
                          sm:h-10
                          sm:w-10
                          lg:h-12
                          lg:w-12
                        "
                    >
                      <ChevronRight className="h-4 w-4 text-[#173963] sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label="Previous categories"
              aria-controls="shop-category-track"
              disabled={!canScroll.left}
              onClick={() => step(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#173963]/20 text-[#173963] transition-colors hover:border-[#173963] hover:bg-[#173963] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5AA7E8] disabled:cursor-default disabled:opacity-30 disabled:hover:border-[#173963]/20 disabled:hover:bg-transparent disabled:hover:text-[#173963] motion-reduce:transition-none"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Next categories"
              aria-controls="shop-category-track"
              disabled={!canScroll.right}
              onClick={() => step(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#173963]/20 text-[#173963] transition-colors hover:border-[#173963] hover:bg-[#173963] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#5AA7E8] disabled:cursor-default disabled:opacity-30 disabled:hover:border-[#173963]/20 disabled:hover:bg-transparent disabled:hover:text-[#173963] motion-reduce:transition-none"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
