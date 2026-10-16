"use client";

import { Check } from "lucide-react";
import { useRef, useState } from "react";
import styles from "./ValidationPage.module.css";
import { CheckList, NavButtons } from "./ValidationUi";

const standards = ["CLIA", "CAP", "COLA"];

const zeroNetLossBullets = [
  "Complete full assay validation",
  "Utilize additional reagents provided",
  "Test a limited number of patient samples",
  "Generate revenue to support future assay orders",
];

export default function ValidationDifferenceSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const cardCount = 3;

  function goTo(nextIndex: number) {
    const track = trackRef.current;
    if (!track) return;
    const cards = track.querySelectorAll<HTMLElement>("article");
    const target = (nextIndex + cardCount) % cardCount;
    const card = cards[target];
    if (!card) return;
    track.scrollTo({
      left: card.offsetLeft,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
    setIndex(target);
  }

  function updateIndex() {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.querySelectorAll<HTMLElement>("article"));
    const closest = cards.reduce((best, card, i) =>
      Math.abs(card.offsetLeft - track.scrollLeft) < Math.abs(cards[best].offsetLeft - track.scrollLeft) ? i : best, 0);
    if (cards.length) setIndex(closest);
  }

  return (
    <section className={styles.difference} aria-roledescription="carousel" aria-label="What makes BioPathogenix different">
      <h2 className={styles.h2}>
        What Makes
        <br />
        <span>BioPathogenix</span> Different
      </h2>

      <div
        ref={trackRef}
        className={styles.cardTrack}
        onScroll={updateIndex}
        tabIndex={0}
        aria-label="Difference cards; use left and right arrow keys to browse"
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            goTo(index + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        <article className={`${styles.card} ${styles.cardDark}`} role="group" aria-roledescription="slide" aria-label="1 of 3">
          <p className={styles.cardNumber}>01.</p>
          <h3>Built Around Regulatory Expectations</h3>
          <p className={styles.lead}>
            Many labs only discover documentation gaps when inspectors request specific studies.
          </p>
          <div className={styles.standards}>
            <p>Our protocols and reporting templates are built explicitly with:</p>
            {standards.map((item) => (
              <span key={item} className={styles.pill}>
                <span aria-hidden="true">
                  <Check strokeWidth={3} />
                </span>
                {item}
              </span>
            ))}
          </div>
          <p className={styles.result}>
            <strong>The result:</strong> Structured, consistent, audit-ready documentation.
          </p>
        </article>

        <article className={styles.card} role="group" aria-roledescription="slide" aria-label="2 of 3">
          <p className={styles.cardNumber}>02.</p>
          <h3>Zero Net Loss Validation</h3>
          <p className={`${styles.lead} ${styles.cardSub}`}>A smarter model.</p>
          <h4>Zero Net Loss Validation allows labs to:</h4>
          <CheckList items={zeroNetLossBullets} />
          <p className={styles.lead}>Validation becomes a strategic investment, not a sunk cost.</p>
        </article>

        <article className={styles.card} role="group" aria-roledescription="slide" aria-label="3 of 3">
          <p className={styles.cardNumber}>03.</p>
          <h3>Structured, Efficient Workflow</h3>
          <h4>Efficient workflow means:</h4>
          <p className={`${styles.lead} ${styles.workflowCopy}`}>
            A process where everything is self-explanatory and any new person in the room can
            execute with minimal supervision.
          </p>
          <h4>We design validation so execution is:</h4>
          <div className={styles.workflowPills}>
            {["Clear", "Reproducible", "Repeatable across assays and operators"].map((item) => (
              <span key={item} className={styles.pill}>
                <span aria-hidden="true"><Check strokeWidth={3} /></span>
                {item}
              </span>
            ))}
          </div>
        </article>
      </div>
      <NavButtons
        onPrev={() => goTo(index - 1)}
        onNext={() => goTo(index + 1)}
        label="difference card"
        className={styles.differenceNav}
      />
      <p className={styles.carouselStatus} aria-live="polite" aria-atomic="true">
        Card {index + 1} of {cardCount}
      </p>
    </section>
  );
}
