"use client";

import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState } from "react";

const testimonials = [
  {
    quote: "All validations were completed in a timely manner. I would highly recommend Biopathogenix.",
    source: "Diamond Labs",
  },
  {
    quote:
      "Validated our panels efficiently and provided a thorough validation summary with clear, practical guidance.",
    source: "Gamby Labs",
  },
  {
    quote:
      "Extremely kind, knowledgeable, and thorough. Every step was explained clearly and our questions were addressed patiently.",
    source: "Abbasi Mohammed Ahmed",
  },
];

export default function ValidationTestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = testimonials.length;
  const active = testimonials[activeIndex];

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % total);

  return (
    <section
      className="relative overflow-hidden px-4 py-12 md:px-6 md:py-16"
      style={{
        backgroundImage: `url("/images/validation%20services/bg2.jpeg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,248,252,0.9)_0%,rgba(244,248,252,0.75)_100%)]" />
      <div className="relative mx-auto max-w-[1440px]">
        <h2 className="text-center font-['Quicksand'] text-[2.05rem] font-bold leading-[0.98] tracking-[-0.04em] text-[#16345f] md:text-[3.45rem]">
          Featured Testimonials
        </h2>

        <div className="relative mx-auto mt-8 max-w-[860px]">
          <div className="absolute -left-6 top-6 hidden h-[320px] w-[320px] rounded-[30px] bg-white/50 blur-[1px] md:block" />
          <div className="relative overflow-hidden rounded-[28px] bg-white px-6 py-7 shadow-[0_24px_48px_rgba(18,53,93,0.12)] md:px-8 md:py-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dce9ef] text-lg font-bold text-[#123669]" />
                <span className="text-[0.72rem] font-medium text-[#123669] md:text-[0.82rem]">
                  {active.source}
                </span>
              </div>
              <Quote className="h-8 w-8 shrink-0 -scale-x-100 fill-[#123669] text-[#123669] md:h-10 md:w-10" />
            </div>

            <p className="mx-auto mt-12 max-w-[560px] text-center font-['Quicksand'] text-[1.1rem] leading-[1.35] text-[#173863] md:mt-16 md:text-[1.55rem]">
              {active.quote}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous testimonial"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#8cb8d9] bg-white text-[#2b5f94] transition hover:bg-[#eef6fc]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next testimonial"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#3a8ac8] text-white transition hover:bg-[#2f76ad]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
