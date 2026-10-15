import Image from "next/image";
import styles from "./ValidationPage.module.css";
import { CheckList } from "./ValidationUi";

const bullets = [
  "Timely completion",
  "Clear explanations and hands-on training",
  "Stability studies completed successfully",
  "Continued availability after validation",
  "Professional, kind, thorough support",
];

export default function ValidationPerformanceSection() {
  return (
    <section className={styles.performance}>
      <div className={styles.perfCopy}>
        <h2 className={styles.h2}>
          Validation Services
          <br />
          That <span>Deliver Verified</span>
          <br />
          <span>Performance</span>
        </h2>
        <p className={styles.lead}>
          We don&apos;t just confirm functionality- we establish measurable, defensible performance
          benchmarks that support confident research, regulatory readiness, and long-term
          scalability.
        </p>
        <CheckList items={bullets} />
      </div>

      <div className={styles.perfPhoto}>
        {/* Cropped as in the Figma frame. */}
        <Image
          src="/images/validation%20services/validation-performance.webp"
          alt="Gloved hand loading a PCR plate into an instrument"
          width={900}
          height={600}
          sizes="(min-width: 1024px) 80vw, 100vw"
        />
      </div>
    </section>
  );
}
