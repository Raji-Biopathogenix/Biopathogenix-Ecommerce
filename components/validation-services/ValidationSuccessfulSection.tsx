"use client";

import { ArrowRight, Check } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";

const AUTO_ADVANCE_MS = 6000;
const SLIDE_MS = 700;

type ValidationSuccessfulSectionProps = {
  onOpenForm: () => void;
};

type Slide = {
  image: string;
  imagePosition: string;
  body: (onOpenForm: () => void) => ReactNode;
};

function CheckDot() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3d7ec2]">
      <Check className="h-3 w-3 text-white" strokeWidth={3} />
    </span>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5 md:space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[0.82rem] text-white/92 md:text-[0.98rem]">
          <CheckDot />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// Slides 2-5 use the closest existing photos; replace `image` when the design photos are added.
const slides: Slide[] = [
  {
    image: "/images/validation%20services/7.png",
    imagePosition: "70% 50%",
    body: () => (
      <div className="max-w-[640px]">
        <h3 className="font-['Quicksand'] text-[2.1rem] font-bold leading-none text-white md:text-[3.25rem]">
          It carries pressure.
        </h3>
        <div className="mt-5 md:mt-7">
          <CheckList
            items={[
              "Pressure to launch on time.",
              "Pressure to satisfy inspection standards.",
              "Pressure to protect your laboratory's credibility.",
              "Pressure to ensure every data point can stand up to scrutiny.",
            ]}
          />
        </div>
      </div>
    ),
  },
  {
    image: "/images/validation%20services/Pipette-Tips-1-1-768x513.jpg",
    imagePosition: "60% 40%",
    body: () => (
      <div className="max-w-[480px]">
        <p className="text-[1rem] font-semibold leading-[1.45] text-white md:text-[1.2rem]">
          A successful validation removes uncertainty from your process by ensuring that your
          documentation aligns with CLIA, CAP, or COLA expectations from the start.
        </p>
        <div className="mt-6 md:mt-8">
          <CheckList
            items={[
              "Your acceptance criteria are defined correctly.",
              "Your studies are structured intentionally.",
              "Your reports are complete, organized and defensible.",
            ]}
          />
        </div>
      </div>
    ),
  },
  {
    image: "/images/validation%20services/8.png",
    imagePosition: "50% 70%",
    body: () => (
      <p className="max-w-[760px] text-[0.95rem] leading-[1.55] text-white/92 md:text-[1.15rem]">
        With BioPathogenix, validation is structured from the beginning to reduce risk, eliminate
        guesswork, and protect your time, your reagents, and your team&apos;s energy. Our process
        front-loads planning, aligns documentation with regulatory expectations, and provides
        hands-on training so your laboratory is not just validated but prepared.
      </p>
    ),
  },
  {
    image: "/images/assay%20landing%20page/2.png",
    imagePosition: "50% 30%",
    body: () => (
      <div>
        <h3 className="font-['Quicksand'] text-[1.6rem] font-bold leading-none text-white md:text-[2rem]">
          We Deliver
        </h3>
        <div className="mt-6 md:mt-8">
          <CheckList
            items={[
              "Structured Validation Design",
              "Regulatory-Aligned Documentation",
              "Defensible Performance Data",
              "Confident Inspection Readiness",
            ]}
          />
        </div>
      </div>
    ),
  },
  {
    image: "/images/validation%20services/Contrived-Sample-1000x667.jpg",
    imagePosition: "70% 50%",
    body: (onOpenForm) => (
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <p className="max-w-[560px] font-['Quicksand'] text-[1.35rem] font-bold leading-[1.3] text-white md:text-[1.85rem]">
          Ready to experience a Zero Net Loss Validation service that provides clarity and
          confidence without inflating complexity or cost?
        </p>
        <button
          type="button"
          onClick={onOpenForm}
          className="inline-flex h-[56px] shrink-0 items-center justify-between gap-6 self-start rounded-[6px] bg-[#0e5c8d] px-7 text-[0.95rem] font-semibold text-white transition-colors hover:bg-[#0b4a72] md:self-auto md:text-[1.05rem]"
        >
          <span>Speak With Our Validation Team</span>
          <span className="border-l border-white/40 pl-3">
            <ArrowRight className="h-5 w-5" />
          </span>
        </button>
      </div>
    ),
  },
];

// A copy of the first slide sits at the end so the carousel always slides left; after
// reaching the copy it jumps back to the real first slide without animating.
const track = [...slides, slides[0]];

export default function ValidationSuccessfulSection({ onOpenForm }: ValidationSuccessfulSectionProps) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => {
      setAnimate(true);
      setIndex((current) => current + 1);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused]);

  useEffect(() => {
    if (index !== slides.length) return;
    const timer = window.setTimeout(() => {
      setAnimate(false);
      setIndex(0);
    }, SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index]);

  return (
    <section className="bg-[#f4f8fc] px-4 py-3 md:px-6 md:py-6">
      <div
        className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] bg-[#0a1d3d] shadow-[0_24px_60px_rgba(10,29,61,0.18)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        aria-roledescription="carousel"
      >
        <div
          className="flex"
          style={{
            transform: `translateX(-${index * 100}%)`,
            transition: animate ? `transform ${SLIDE_MS}ms ease-in-out` : "none",
          }}
        >
          {track.map((slide, i) => {
            const number = (i % slides.length) + 1;
            const hidden = i % slides.length !== index % slides.length;
            return (
              <div
                key={i}
                className="relative w-full shrink-0"
                role="group"
                aria-roledescription="slide"
                aria-label={`${number} of ${slides.length}`}
                aria-hidden={hidden || i === slides.length}
                inert={hidden || i === slides.length}
              >
                <Image
                  src={slide.image}
                  alt=""
                  fill
                  sizes="(min-width: 1440px) 1440px, 100vw"
                  className="object-cover opacity-95"
                  style={{ objectPosition: slide.imagePosition }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,15,36,0.98)_0%,rgba(4,15,36,0.92)_38%,rgba(4,15,36,0.66)_68%,rgba(4,15,36,0.24)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(116,169,220,0.18)_0,rgba(116,169,220,0.06)_18%,rgba(4,15,36,0)_42%)]" />

                <div className="relative flex min-h-[640px] flex-col justify-between gap-10 px-6 py-8 text-white md:px-10 md:py-10">
                  <div className="flex items-start justify-between gap-6">
                    <div className="max-w-[540px]">
                      <h2 className="font-['Quicksand'] text-[2.15rem] font-bold leading-[0.95] tracking-[-0.03em] text-white md:text-[3.4rem]">
                        What a <span className="text-[#50a7d7]">Successful</span>
                        <br />
                        <span className="text-[#50a7d7]">Validation</span> Looks Like
                      </h2>
                      <p className="mt-4 max-w-xl text-[0.85rem] leading-6 text-white/76 md:mt-5 md:text-[1rem]">
                        Let&apos;s be honest. Validation is rarely just another project on the bench.
                      </p>
                    </div>
                    <p className="shrink-0 pt-2 text-[0.85rem] tracking-[0.3em] text-white/80 md:text-[1rem]">
                      {String(number).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                    </p>
                  </div>

                  <div className="pb-2">{slide.body(onOpenForm)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
