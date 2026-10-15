import Image from "next/image";
import styles from "./ValidationPage.module.css";
import { CheckList } from "./ValidationUi";

const strengths = [
  "Defending your data",
  "Protecting your inspection outcomes",
  "Safeguarding patient reporting confidence",
  "Protecting months of staff time and reagent investment",
];

const risks = [
  "Studies vary by operator",
  "Documentation gaps appear during inspection",
  "Key parameters must be repeated",
  "Time and reagents are lost",
];

export default function ValidationInfrastructureSection() {
  return (
    <section className={styles.infrastructure}>
      <div className={styles.dnaLayer} aria-hidden="true" />
      <div className={styles.infraGrid}>
        <div className={styles.infraPhoto}>
          {/* Cropped as in the Figma frame. */}
          <Image
            src="/images/validation%20services/validation-infrastructure.webp"
            alt="Scientist preparing sample tubes in the lab"
            width={1340}
            height={1840}
            sizes="(min-width: 1024px) 62vw, 100vw"
          />
        </div>

        <div className={styles.infraCopy}>
          <h2 className={styles.h2}>
            Validation isn&apos;t
            <br />
            a formality. <span>It&apos;s</span>
            <br />
            <span>infrastructure.</span>
          </h2>
          <p className={styles.lead}>
            It defines the standard your laboratory operates within&mdash;today and as you scale.
          </p>
          <h3>You&apos;re</h3>
          <CheckList items={strengths} />
          <h3>Without structured validation design</h3>
          <CheckList items={risks} />
        </div>
      </div>

      <p className={styles.banner}>
        BioPathogenix validation services are built to eliminate those risks before they surface.
      </p>
    </section>
  );
}
