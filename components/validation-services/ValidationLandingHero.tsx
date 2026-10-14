import { ArrowRight } from "lucide-react";
import Image from "next/image";
import styles from "./ValidationLandingHero.module.css";

type ValidationLandingHeroProps = {
  onOpenForm: () => void;
};

const HEX_CLIP = "url(#validation-hero-hex)";
const HEX_RATIO = 0.866;

type HeroHexProps = {
  src: string;
  alt: string;
  className: string;
  position?: string;
};

function HeroHex({ src, alt, className, position = "center" }: HeroHexProps) {
  return (
    <div className={`${styles.hex} ${className}`} style={{ clipPath: HEX_CLIP, aspectRatio: HEX_RATIO }}>
      <div style={{ clipPath: HEX_CLIP }}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 290px, 170px"
          className="object-cover"
          style={{ objectPosition: position }}
        />
      </div>
    </div>
  );
}

export default function ValidationLandingHero({ onOpenForm }: ValidationLandingHeroProps) {
  return (
    <section className={`${styles.hero} w-full px-4 pb-6 pt-4 sm:px-6 sm:pt-5 md:px-10 md:pb-8 md:pt-6 lg:px-0`}>
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <clipPath id="validation-hero-hex" clipPathUnits="objectBoundingBox">
            <path d="M .47 .015 Q .5 0 .53 .015 L .97 .235 Q 1 .25 1 .28 L 1 .72 Q 1 .75 .97 .765 L .53 .985 Q .5 1 .47 .985 L .03 .765 Q 0 .75 0 .72 L 0 .28 Q 0 .25 .03 .235 Z" />
          </clipPath>
        </defs>
      </svg>
      <div className={styles.stage}>
        <div className={styles.left} aria-hidden="true">
          <HeroHex src="/images/validation%20services/1.png" alt="" className={styles.leftMain} position="32% 50%" />
          <HeroHex src="/images/validation%20services/2.png" alt="" className={styles.leftOuter} position="50% 35%" />
          <HeroHex src="/images/validation%20services/3.png" alt="" className={styles.leftInner} position="42% 50%" />
        </div>

        <div className={styles.right} aria-hidden="true">
          <HeroHex src="/images/validation%20services/4.png" alt="" className={styles.rightInner} position="50% 22%" />
          <HeroHex src="/images/validation%20services/5.png" alt="" className={styles.rightOuter} position="72% 50%" />
          <HeroHex src="/images/validation%20services/6.png" alt="" className={styles.rightMain} position="55% 28%" />
        </div>

        <div className={styles.copy}>
          <p className={styles.eyebrow}>VALIDATION SERVICES</p>
          <h1>
            A Validation System
            <br />
            Designed to <span>Protect</span>
            <br />
            <span>Your Investment</span>
          </h1>
          <p className={styles.description}>
            CLIA-aligned. Audit-ready. Executed with industry-standard rigor and hands-on expertise.
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={onOpenForm} className={styles.primary}>
              Schedule a Validation Consultation <ArrowRight aria-hidden="true" />
            </button>
            <button type="button" onClick={onOpenForm}>
              Speak with our Validation Team <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
