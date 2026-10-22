"use client";

import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import FigmaHexImage from "@/components/common/FigmaHexImage";
import AvailabilityModal from "@/components/quality-control/AvailabilityModal";
import styles from "./quality-control.module.css";

// The Figma design's typeface.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

// Figma px on the 1440 frame, in the page's capped unit (--cq in quality-control.module.css is
// 1% of the frame, so one Figma px is --cq / 14.4).
const cq = (px: number) => `calc(var(--cq) * ${(px / 14.4).toFixed(4)})`;

// Hexagons on the right half are placed from the right edge, so they stay at the edge on wide screens.
const hexPosition = (x: number, size: number) =>
  x + size / 2 > 720 ? { right: cq(1440 - x - size) } : { left: cq(x) };

// Hero hexagons (Figma polygons; y is measured from the hero's top, below the 97px header).
const HERO_HEXES = [
  { src: "/images/figma/hex-holding-tubes.webp", x: -232.3, y: 42, size: 346.6, radius: 23.1, crop: [0.5011, 0.2956, 1, 0] },
  { src: "/images/figma/hex-qc-left-small.webp", x: 90.8, y: 77, size: 195.8, radius: 13.9, crop: [0.787, 0.105, 1, 0] },
  { src: "/images/figma/hex-microscope-laptop.webp", x: 1340.8, y: -6, size: 336, radius: 23.1, crop: [0.631, 0.1845, 1, 0] },
  { src: "/images/figma/hex-qc-right-small.webp", x: 1169.1, y: 99.2, size: 195.8, radius: 27.7, crop: [1, 0, 0.5602, 0.0331] },
] as const;

const cards = [
  {
    title: "Split Sample Testing",
    description:
      "Compare your results with the results of other laboratories by testing the same sample, verifying the accuracy of your tests.",
    image: "/images/figma/qc-split-sample.webp",
    linkText: "Learn More",
    link: "/split-sample-testing",
  },
  {
    title: "BioBank/Contrived Samples",
    description:
      "A control designed to assess the performance of downstream molecular assays.",
    image: "/images/figma/qc-biobank.webp",
    linkText: "Shop Now",
    link: "/contrived-samples",
  },
  {
    title: "Quality Control and Validation kits",
    description:
      "Designed to monitor the efficiency and consistency of RNA/DNA extraction from various sample types.",
    image: "/images/figma/qc-validation-kits.webp",
    linkText: "Shop Now",
    link: "/quality-control-and-validation-kits",
  },
];

export default function QualityControlPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <main className={`${poppins.className} ${styles.page}`}>
        <section className={styles.hero}>
          {HERO_HEXES.map((hex) => (
            <FigmaHexImage
              key={hex.src}
              src={hex.src}
              alt=""
              w={hex.size}
              h={hex.size}
              radius={hex.radius}
              stroke={6.56}
              crop={hex.crop}
              className={styles.heroHex}
              style={{ ...hexPosition(hex.x, hex.size), top: cq(hex.y), width: cq(hex.size), height: cq(hex.size) }}
            />
          ))}
          <h1>
            Quality <span>Control</span>
          </h1>
        </section>

        <section className={styles.body}>
          <img src="/images/figma/qc-dna-bg.webp" alt="" className={styles.dna} />
          <div className={styles.cards}>
            {cards.map((card) => (
              <article key={card.title} className={styles.card}>
                <div className={styles.cardImage}>
                  <Image src={card.image} alt={card.title} fill sizes="(min-width: 1024px) 28vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                </div>
                <div className={styles.cardBody}>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  <Link href={card.link} className={styles.cardLink}>
                    {card.linkText}
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.cta}>
            <h2>
              Have a Question or
              <br />
              <span>Need Confirmation?</span>
            </h2>
            <p>
              Email our team to confirm feasibility, timelines, or documentation. Every inquiry is
              reviewed internally to ensure expert-level support.
            </p>
            <button type="button" onClick={() => setIsModalOpen(true)} className={styles.button}>
              Confirm Availability by Email
              <span className={styles.buttonArrow} aria-hidden="true">
                <ArrowRight />
              </span>
            </button>
          </div>
        </section>

        <AvailabilityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </main>
    </>
  );
}
