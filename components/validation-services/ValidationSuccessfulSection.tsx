"use client";

import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import styles from "./ValidationPage.module.css";
import { ButtonArrow, CheckList, NavButtons } from "./ValidationUi";

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

// A copy of the first slide sits at the end so the carousel always slides left; after
// reaching the copy it jumps back to the real first slide without animating.
const track = [...slides, slides[0]];

export default function ValidationSuccessfulSection({ onOpenForm }: ValidationSuccessfulSectionProps) {
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);

  // Auto-advance; any slide change (including a button click) restarts the countdown.
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

  const goNext = () => {
    if (index >= slides.length) return;
    setAnimate(true);
    setIndex(index + 1);
  };

  // From the first slide, jump to the copy at the end without animating, then slide back
  // one, so "previous" also moves smoothly.
  const goPrev = () => {
    if (index >= slides.length) return;
    if (index > 0) {
      setAnimate(true);
      setIndex(index - 1);
      return;
    }
    setAnimate(false);
    setIndex(slides.length);
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => {
        setAnimate(true);
        setIndex(slides.length - 1);
      }),
    );
  };

  return (
    <section
      className={styles.successful}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="What a successful validation looks like"
    >
      <div
        className={styles.track}
        style={{
          transform: `translateX(-${index * 100}%)`,
          transition: animate ? `transform ${SLIDE_MS}ms ease-in-out` : "none",
        }}
      >
        {track.map((slide, i) => {
          const number = (i % slides.length) + 1;
          const hidden = i !== index;
          return (
            <div
              key={i}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`${number} of ${slides.length}`}
              aria-hidden={hidden}
              inert={hidden}
            >
              <Image
                src={slide.image}
                alt=""
                fill
                sizes="100vw"
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
                    {String(number).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
                  </p>
                </div>

                <div className={styles.slideFoot}>
                  {slide.body(onOpenForm)}
                  {/* Keeps slide text clear of the previous / next buttons. */}
                  <div className={styles.navSpacer} aria-hidden="true" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <NavButtons onPrev={goPrev} onNext={goNext} label="slide" className={styles.slideNav} />
    </section>
  );
}
