 "use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

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

  const visibleTestimonials = useMemo(() => {
    return [0, 1, 2].map((offset) => testimonials[(activeIndex + offset) % total]);
  }, [activeIndex, total]);

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % total);

  return (
    <section className="bg-[#f2f4f6] pb-10 [font-family:'Times_New_Roman',Times,serif]">
      <div className="mx-auto max-w-7xl rounded-b-2xl bg-[#dce9ef] px-4 pb-10 pt-8 md:px-8">
        <h2 className="text-center text-3xl font-semibold leading-tight text-[#123669] md:text-5xl">
          Featured Testimonials
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {visibleTestimonials.map((item) => (
            <article key={item.source} className="rounded-2xl bg-white p-6 text-center text-[#123669]">
              <p className="min-h-24 text-lg leading-relaxed md:text-xl">{item.quote}</p>
              <p className="mt-6 text-xl font-semibold md:text-2xl">{item.source}</p>
            </article>
          ))}
        </div>
        <div className="mt-7 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous testimonials"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#123669] text-[#123669] transition hover:bg-[#123669] hover:text-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center justify-center gap-3">
            {testimonials.map((_, dot) => (
              <button
                key={dot}
                type="button"
                onClick={() => setActiveIndex(dot)}
                aria-label={`Go to testimonial ${dot + 1}`}
                className={`h-3 w-3 rounded-full transition ${
                  dot === activeIndex ? "bg-[#5ba1dd]" : "bg-[#123669]"
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next testimonials"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#123669] text-[#123669] transition hover:bg-[#123669] hover:text-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
