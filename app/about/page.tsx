import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { ArrowRight, FileText, MessagesSquare, Package } from "lucide-react";
import styles from "./about.module.css";

// The Figma design's typeface.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const infoCards = [
  {
    Icon: Package,
    title: "Timely shipping",
    text: "Standard kits ship within 24 hours, Custom kits within 72 hours",
  },
  {
    Icon: FileText,
    title: "Contractual Requirements",
    text: "No contractual requirements and no minimum order requirements",
  },
  {
    Icon: MessagesSquare,
    title: "Communication",
    text: "Rapid response to customer inquiries.",
  },
];

function ButtonArrow() {
  return (
    <span className={styles.buttonArrow} aria-hidden="true">
      <ArrowRight />
    </span>
  );
}

export default function AboutPage() {
  return (
    <main className={`${poppins.className} ${styles.page}`}>
      {/* ================= HERO ================= */}
      <section className={styles.hero}>
        <div className={styles.heroDna} aria-hidden="true" />
        <div className={styles.heroGlow} aria-hidden="true" />
        <h1>
          About
          <br />
          <span>BioPathogenix</span>
        </h1>
        <p className={styles.copy}>Providing Turnkey Solutions for Laboratories</p>

        <div className={styles.cards}>
          {infoCards.map(({ Icon, title, text }) => (
            <div key={title} className={styles.card}>
              <span className={styles.cardIcon} aria-hidden="true">
                <Icon strokeWidth={1.75} />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= WELCOME + MISSION ================= */}
      <section className={styles.story}>
        <img src="/images/figma/dna-blur.webp" alt="" className={styles.storyDna} aria-hidden="true" />
        <div className={styles.welcome}>
          <div className={styles.photo}>
            <Image src="/images/about/welcome-figma.webp" alt="Scientists working in the BioPathogenix laboratory" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
          <div>
            <h2 className={styles.h2}>
              Welcome to <span>BioPathogenix</span>
            </h2>
            <p className={styles.copy}>
              At BioPathogenix, we are dedicated to advancing the field of molecular workflows by
              providing high-quality lab supplies and innovative solutions to laboratories worldwide.
              Established in 2020 and headquartered in Nicholasville, Kentucky, BioPathogenix has
              quickly become a trusted partner for laboratories.
            </p>
            <Link href="/about/contact" className={styles.button}>
              Contact Us
              <ButtonArrow />
            </Link>
          </div>
        </div>

        <div className={styles.mission}>
          <h2 className={styles.h2}>
            Our <span>Mission</span>
          </h2>
          <p className={styles.copy}>
            Founded on the principles of precision and reliability, our mission is to ensure that every
            product meets the highest standards of quality. Our team is composed of experts who are
            dedicated to maintaining stringent quality control, developing innovative solutions, and
            providing personalized technical support.
          </p>
        </div>
      </section>

      {/* ================= QUALITY AND INNOVATION ================= */}
      <section className={styles.quality}>
        <div>
          <h2 className={styles.h2}>
            Quality and <span>Innovation</span>
          </h2>
          <p className={styles.copy}>
            Quality is at the heart of everything we do. BioPathogenix is committed to continuous
            innovation and rigorous quality control to deliver products that meet the highest industry
            standards. Our dedication to excellence ensures that our customers can rely on us for
            dependable and effective laboratory solutions.
          </p>
          <Link href="/quality-control" className={`${styles.button} ${styles.buttonLight}`}>
            Learn More
            <ButtonArrow />
          </Link>
        </div>
        <div className={styles.qualityPhoto}>
          <Image src="/images/about/quality-and-innovation-figma.webp" alt="Scientist using a pipette in the laboratory" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </div>
      </section>
    </main>
  );
}
