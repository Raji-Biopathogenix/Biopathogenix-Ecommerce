"use client";

import { useState } from "react";
import styles from "./ValidationPage.module.css";
import { NavButtons } from "./ValidationUi";

const testimonials = [
  {
    quote: "All validations were completed in a timely manner... I would highly recommend Biopathogenix.",
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

// The design's quote mark: two slanted bars.
function QuoteMark() {
  return (
    <svg className={styles.quoteMark} viewBox="0 0 64 56" fill="currentColor" aria-hidden="true">
      <path d="M14 0h18L18 56H0z" />
      <path d="M46 0h18L50 56H32z" />
    </svg>
  );
}

export default function ValidationTestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const total = testimonials.length;
  const active = testimonials[activeIndex];

  const goPrev = () => setActiveIndex((prev) => (prev - 1 + total) % total);
  const goNext = () => setActiveIndex((prev) => (prev + 1) % total);

  return (
    <section className={styles.testimonials}>
      <h2 className={styles.h2}>Featured Testimonials</h2>

      <div className={styles.quoteStage}>
        {/* The neighbouring testimonials peek out behind the active card, as in the design. */}
        <div className={`${styles.quoteGhost} ${styles.quoteGhostPrev}`} aria-hidden="true" />
        <div className={`${styles.quoteGhost} ${styles.quoteGhostNext}`} aria-hidden="true" />
        <figure className={styles.quoteCard} aria-live="polite">
          <figcaption className={styles.quoteHead}>
            <span className={styles.quoteSource}>
              <span aria-hidden="true" />
              {active.source}
            </span>
            <QuoteMark />
          </figcaption>
          <blockquote>{active.quote}</blockquote>
        </figure>
      </div>

      <NavButtons onPrev={goPrev} onNext={goNext} label="testimonial" />
    </section>
  );
}
