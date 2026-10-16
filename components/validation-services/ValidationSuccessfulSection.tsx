"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./ValidationPage.module.css";
import { ButtonArrow, CheckList, NavButtons } from "./ValidationUi";

const AUTO_ADVANCE_MS = 6000;


type ValidationSuccessfulSectionProps = {
  onOpenForm: () => void;
};

type Slide = {
  image: string;
  imagePosition: string;
  body: (onOpenForm: () => void) => ReactNode;
};

// Slides 2-5 use the closest existing photos; replace `image` when the design photos are added.
const slides: Slide[] = [
  {
    image: "/images/validation%20services/successful-validation.webp",
    imagePosition: "50% 50%",
    body: () => (
      <div className={styles.slideBody}>
        <h3>It carries pressure.</h3>
        <CheckList
          items={[
            "Pressure to launch on time.",
            "Pressure to satisfy inspection standards.",
            "Pressure to protect your laboratory's credibility.",
            "Pressure to ensure every data point can stand up to scrutiny.",
          ]}
        />
      </div>
    ),
  },
  {
    image: "/images/validation%20services/Pipette-Tips-1-1-768x513.jpg",
    imagePosition: "60% 40%",
    body: () => (
      <div className={styles.slideBody}>
        <p className={styles.slideText}>
          A successful validation removes uncertainty from your process by ensuring that your
          documentation aligns with CLIA, CAP, or COLA expectations from the start.
        </p>
        <CheckList
          items={[
            "Your acceptance criteria are defined correctly.",
            "Your studies are structured intentionally.",
            "Your reports are complete, organized and defensible.",
          ]}
        />
      </div>
    ),
  },
  {
    image: "/images/validation%20services/8.png",
    imagePosition: "50% 70%",
    body: () => (
      <p className={`${styles.slideBody} ${styles.slideText}`}>
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
      <div className={styles.slideBody}>
        <h3>We Deliver</h3>
        <CheckList
          items={[
            "Structured Validation Design",
            "Regulatory-Aligned Documentation",
            "Defensible Performance Data",
            "Confident Inspection Readiness",
          ]}
        />
      </div>
    ),
  },
  {
    image: "/images/validation%20services/Contrived-Sample-1000x667.jpg",
    imagePosition: "70% 50%",
    body: (onOpenForm) => (
      <div className={`${styles.slideBody} ${styles.slideCta}`}>
        <p className={styles.slideText}>
          Ready to experience a Zero Net Loss Validation service that provides clarity and
          confidence without inflating complexity or cost?
        </p>
        <button type="button" onClick={onOpenForm} className={styles.button}>
          Speak With Our Validation Team <ButtonArrow />
        </button>
      </div>
    ),
  },
];

export default function ValidationSuccessfulSection({ onOpenForm }: ValidationSuccessfulSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = (next: number) => {
    const track = trackRef.current;
    const card = track?.children[next] as HTMLElement | undefined;
    if (!track || !card) return;
    track.scrollTo({
      left: card.offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  };

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setTimeout(() => goTo((index + 1) % slides.length), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused]);

  const updateIndex = () => {
    const track = trackRef.current;
    if (!track) return;
    let closest = 0;
    let distance = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const offset = Math.abs((child as HTMLElement).offsetLeft - track.scrollLeft);
      if (offset < distance) {
        closest = i;
        distance = offset;
      }
    });
    setIndex(closest);
  };

  return (
    <section
      className={styles.successful}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      aria-roledescription="carousel"
      aria-label="What a successful validation looks like"
    >
      <div
        ref={trackRef}
        className={styles.track}
        onScroll={updateIndex}
        tabIndex={0}
        aria-label="Validation cards; use left and right arrow keys to browse"
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            goTo((index + (event.key === "ArrowRight" ? 1 : slides.length - 1)) % slides.length);
          }
        }}
      >
        {slides.map((slide, i) => (
          <article
            key={slide.image}
            className={styles.slide}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              sizes="(max-width: 600px) 88vw, (max-width: 1440px) 72vw, 1040px"
              className="object-cover"
              style={{ objectPosition: slide.imagePosition }}
            />
            <div className={styles.slideOverlay} />
            <div className={styles.slideContent}>
              <div className={styles.slideHead}>
                <div>
                  <h2 className={styles.h2}>
                    What a <span>Successful</span>
                    <br />
                    <span>Validation</span> Looks Like
                  </h2>
                  <p className={styles.lead}>
                    Let&apos;s be honest. Validation is rarely just another project on the bench.
                  </p>
                </div>
                <p className={styles.counter}>
                  {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                </p>
              </div>
              <div className={styles.slideFoot}>{slide.body(onOpenForm)}</div>
            </div>
          </article>
        ))}
      </div>
      <NavButtons
        onPrev={() => goTo((index + slides.length - 1) % slides.length)}
        onNext={() => goTo((index + 1) % slides.length)}
        label="validation card"
        className={styles.slideNav}
      />
    </section>
  );
}
