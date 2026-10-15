import Image from "next/image";
import styles from "./ValidationPage.module.css";
import { ButtonArrow } from "./ValidationUi";

type ValidationBottomCtaProps = {
  onOpenForm: () => void;
};

export default function ValidationBottomCta({ onOpenForm }: ValidationBottomCtaProps) {
  return (
    <section className={styles.cta}>
      <div className={styles.ctaCard}>
        <Image
          src="/images/validation%20services/cta-dna.webp"
          alt=""
          width={1730}
          height={973}
          sizes="(min-width: 1440px) 1160px, 80vw"
          className={styles.ctaDna}
        />
        <div className={styles.ctaCopy}>
          <p className={styles.eyebrow}>Standard Assays</p>
          <div className={styles.ctaHeading}>
            <h2>
              <span>Confident Validation</span>
              <br />
              Starts With Structured
              <br />
              Design
            </h2>
            <p className={styles.lead}>
              Schedule a consultation and see how BioPathogenix transforms validation from risk into
              readiness.
            </p>
          </div>
          <button type="button" onClick={onOpenForm} className={`${styles.button} ${styles.buttonLight}`}>
            Schedule a Consultation <ButtonArrow />
          </button>
        </div>
      </div>
    </section>
  );
}
