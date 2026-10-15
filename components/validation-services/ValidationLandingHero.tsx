import styles from "./ValidationPage.module.css";
import { ButtonArrow, HexPhoto } from "./ValidationUi";

type ValidationLandingHeroProps = {
  onOpenForm: () => void;
};

// Hero photos as placed in the Figma design (shared with the Assay Development hero).
const HERO_IMAGES = "/images/assay%20landing%20page";
const HERO_SIZES = "(min-width: 1024px) 320px, 170px";

export default function ValidationLandingHero({ onOpenForm }: ValidationLandingHeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.heroStage}>
        <div className={styles.heroLeft} aria-hidden="true">
          <HexPhoto src={`${HERO_IMAGES}/hero-left-main.webp`} alt="" className={styles.hexLeftMain} position="48% 50%" sizes={HERO_SIZES} />
          <HexPhoto src={`${HERO_IMAGES}/hero-left-outer.webp`} alt="" className={styles.hexLeftOuter} position="55% 50%" sizes={HERO_SIZES} />
          <HexPhoto src={`${HERO_IMAGES}/hero-left-inner.webp`} alt="" className={styles.hexLeftInner} position="41% 50%" sizes={HERO_SIZES} />
        </div>
        <div className={styles.heroRight} aria-hidden="true">
          <HexPhoto src={`${HERO_IMAGES}/hero-right-inner.webp`} alt="" className={styles.hexRightInner} position="50% 6%" sizes={HERO_SIZES} />
          <HexPhoto src={`${HERO_IMAGES}/hero-right-outer.webp`} alt="" className={styles.hexRightOuter} position="48% 50%" sizes={HERO_SIZES} />
          <HexPhoto src={`${HERO_IMAGES}/hero-right-main.webp`} alt="" className={styles.hexRightMain} position="49% 50%" sizes={HERO_SIZES} />
        </div>

        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Validation Services</p>
          <h1>
            A Validation System
            <br />
            Designed to <span>Protect</span>
            <br />
            <span>Your Investment</span>
          </h1>
          <p className={styles.lead}>
            CLIA-aligned. Audit-ready. Executed with industry-standard rigor and hands-on expertise.
          </p>
          <div className={styles.heroActions}>
            <button type="button" onClick={onOpenForm} className={styles.button}>
              Schedule a Validation Consultation <ButtonArrow />
            </button>
            <button type="button" onClick={onOpenForm} className={`${styles.button} ${styles.buttonOutline}`}>
              Speak with our Validation Team <ButtonArrow />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
