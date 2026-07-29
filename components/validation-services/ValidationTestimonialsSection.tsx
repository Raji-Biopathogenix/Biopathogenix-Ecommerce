"use client";

import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useState } from "react";

const MOLECULE_PATTERN_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'%3E%3Cg fill='none' stroke='%23c3ddf0' stroke-width='1.5'%3E%3Cline x1='40' y1='60' x2='150' y2='120'/%3E%3Cline x1='150' y1='120' x2='260' y2='70'/%3E%3Cline x1='150' y1='120' x2='110' y2='250'/%3E%3Cline x1='260' y1='70' x2='340' y2='150'/%3E%3Cline x1='110' y1='250' x2='220' y2='320'/%3E%3Cline x1='220' y1='320' x2='360' y2='280'/%3E%3Cline x1='340' y1='150' x2='390' y2='260'/%3E%3C/g%3E%3Cg fill='%23c3ddf0'%3E%3Ccircle cx='40' cy='60' r='5'/%3E%3Ccircle cx='150' cy='120' r='7'/%3E%3Ccircle cx='260' cy='70' r='5'/%3E%3Ccircle cx='340' cy='150' r='6'/%3E%3Ccircle cx='110' cy='250' r='6'/%3E%3Ccircle cx='220' cy='320' r='5'/%3E%3Ccircle cx='360' cy='280' r='5'/%3E%3Ccircle cx='390' cy='260' r='4'/%3E%3C/g%3E%3C/svg%3E";

const testimonials = [
  {
    quote: "Exceptional support... strong commitment to quality and regulatory standards.",
    source: "PreScience Diagnostics",
  },
  {
    quote:
      "Validated our nail and wound panels efficiently... provided a thorough validation summary and trained me in performing their assays.",
    source: "Gamby Labs",
  },
  {
    quote:
      "Dr. Venkatesh was extremely kind, knowledgeable, and thorough... He explained each step clearly and patiently addressed all of our questions.",
    source: "Abbasi Mohammed Ahmed",
  },
  {
    quote:
      "All validations were completed in a timely manner... I would highly recommend Biopathogenix.",
    source: "Diamond Labs",
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
      className="w-full px-4 pb-16 pt-8 md:px-8"
      style={{
        backgroundImage: `url("${MOLECULE_PATTERN_BG}"), linear-gradient(160deg, #eef5fb 0%, #dbe9f5 100%)`,
        backgroundRepeat: "repeat, no-repeat",
        backgroundSize: "420px 420px, cover",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center font-['Quicksand'] text-3xl font-bold leading-tight text-[#123669] md:text-5xl">
          Featured Testimonials
        </h2>

        <div className="mx-auto mt-10 max-w-3xl rounded-3xl bg-white p-8 shadow-lg md:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dce9ef] text-lg font-bold text-[#123669]">
                {active.source.charAt(0)}
              </span>
              <span className="text-base font-semibold text-[#123669]">{active.source}</span>
            </div>
            <Quote className="h-9 w-9 shrink-0 -scale-x-100 fill-[#123669] text-[#123669]" />
          </div>

          <p className="mt-6 min-h-20 text-lg leading-relaxed text-[#123669] md:text-xl">
            {active.quote}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous testimonial"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#123669] text-[#123669] transition hover:bg-[#123669] hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next testimonial"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#3d7ec2] text-white transition hover:bg-[#2f6aa8]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
