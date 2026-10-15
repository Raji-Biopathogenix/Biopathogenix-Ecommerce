import { ArrowRight, Check, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import styles from "./ValidationPage.module.css";

export const HEX_CLIP_ID = "validation-hex";

// Width / height of the hexagon frames in the Figma design.
const HEX_RATIO = 0.882;

export function HexClipDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" className="absolute">
      <defs>
        <clipPath id={HEX_CLIP_ID} clipPathUnits="objectBoundingBox">
          <path d="M .47 .015 Q .5 0 .53 .015 L .97 .235 Q 1 .25 1 .28 L 1 .72 Q 1 .75 .97 .765 L .53 .985 Q .5 1 .47 .985 L .03 .765 Q 0 .75 0 .72 L 0 .28 Q 0 .25 .03 .235 Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function HexPhoto({
  src,
  alt,
  className = "",
  position = "center",
  sizes = "(min-width: 1024px) 320px, 260px",
}: {
  src: string;
  alt: string;
  className?: string;
  position?: string;
  sizes?: string;
}) {
  const clipPath = `url(#${HEX_CLIP_ID})`;
  return (
    <div className={`${styles.hex} ${className}`} style={{ clipPath, aspectRatio: HEX_RATIO }}>
      <div style={{ clipPath }}>
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" style={{ objectPosition: position }} />
      </div>
    </div>
  );
}

export function ButtonArrow() {
  return (
    <span className={styles.buttonArrow} aria-hidden="true">
      <ArrowRight />
    </span>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className={styles.checkList}>
      {items.map((item) => (
        <li key={item}>
          <span aria-hidden="true">
            <Check strokeWidth={3} />
          </span>
          {item}
        </li>
      ))}
    </ul>
  );
}

export function NavButtons({
  onPrev,
  onNext,
  label,
  className = "",
}: {
  onPrev: () => void;
  onNext: () => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={`${styles.navButtons} ${className}`}>
      <button type="button" onClick={onPrev} aria-label={`Previous ${label}`} className={styles.navButton}>
        <ChevronLeft />
      </button>
      <button type="button" onClick={onNext} aria-label={`Next ${label}`} className={`${styles.navButton} ${styles.navNext}`}>
        <ChevronRight />
      </button>
    </div>
  );
}
