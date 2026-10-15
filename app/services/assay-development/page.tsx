import Image from "next/image";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { ArrowRight, Check, Factory, FileText, FlaskConical, Headset, Truck } from "lucide-react";
import AssayInquiryForm from "@/components/assay-services/AssayInquiryForm";
import styles from "./assay-development.module.css";

// Sections below the hero use the Figma design's typeface.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

const HEX_CLIP = "url(#assay-hero-hex)";
// Width / height of the hexagon frames in the Figma hero.
const HEX_RATIO = 0.882;
const ASSAY_GUIDE = "/files/2025-BioPathogenix-Product-Catalog%201.pdf";

const assayImages = {
  heroBg: "/images/assay%20landing%20page/bg1.jpeg",
  // Hero photos as placed in the Figma design.
  heroLeftMain: "/images/assay%20landing%20page/hero-left-main.webp",
  heroLeftOuter: "/images/assay%20landing%20page/hero-left-outer.webp",
  heroLeftInner: "/images/assay%20landing%20page/hero-left-inner.webp",
  heroRightInner: "/images/assay%20landing%20page/hero-right-inner.webp",
  heroRightOuter: "/images/assay%20landing%20page/hero-right-outer.webp",
  heroRightMain: "/images/assay%20landing%20page/hero-right-main.webp",
  customBuilt: "/images/assay%20landing%20page/7.png",
  thoughtfulReview: "/images/assay%20landing%20page/8.png",
  industryStandards: "/images/assay%20landing%20page/9.png",
};

const reassuranceItems = [
  { icon: Factory, label: "Domestic manufacturing\nand shipping" },
  { icon: Truck, label: "72-hour time shipping\n(where applicable)" },
  { icon: FlaskConical, label: "RUO-only\nmolecular assays" },
  { icon: Headset, label: "Direct access to\nassay specialists" },
  { icon: FileText, label: "Industry-standard\ndocumentation & QA process" },
];

const customBullets = [
  "Reviewed by assay specialists",
  "Domestic production for faster turnaround",
  "Clear timelines before work begins",
  "RUO-aligned documentation and standards",
];

const supportBullets = [
  "Internal technical review before response",
  "Assay specialist follow-up",
  "Clear guidance on feasibility, timelines, and documentation",
];

function ButtonArrow() {
  return (
    <span className={styles.buttonArrow} aria-hidden="true">
      <ArrowRight />
    </span>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className={styles.checkList}>
      {items.map((item) => (
        <li key={item}>
          <span aria-hidden="true"><Check strokeWidth={3} /></span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function HeroHex({
  src,
  alt,
  className = "",
  position = "center",
}: {
  src: string;
  alt: string;
  className?: string;
  position?: string;
}) {
  return (
    <div
      className={`${styles.hex} ${className}`}
      style={{ clipPath: HEX_CLIP, aspectRatio: HEX_RATIO }}
    >
      <div className="relative h-full w-full overflow-hidden" style={{ clipPath: HEX_CLIP }}>
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

export default function AssayDevelopmentPage() {
  return (
    <main className={`${styles.page} overflow-hidden bg-white text-[#18355d]`}
    >
      <svg width="0" height="0" aria-hidden="true" className="absolute">
        <defs>
          <clipPath id="assay-hero-hex" clipPathUnits="objectBoundingBox">
            <path d="M .47 .015 Q .5 0 .53 .015 L .97 .235 Q 1 .25 1 .28 L 1 .72 Q 1 .75 .97 .765 L .53 .985 Q .5 1 .47 .985 L .03 .765 Q 0 .75 0 .72 L 0 .28 Q 0 .25 .03 .235 Z" />
          </clipPath>
        </defs>
      </svg>
      <section className={`${poppins.className} ${styles.hero}`}>
        <div className={styles.heroStage}>
          <div className={styles.heroLeft} aria-hidden="true">
            <HeroHex src={assayImages.heroLeftMain} alt="" className={styles.hexLeftMain} position="48% 50%" />
            <HeroHex src={assayImages.heroLeftOuter} alt="" className={styles.hexLeftOuter} position="55% 50%" />
            <HeroHex src={assayImages.heroLeftInner} alt="" className={styles.hexLeftInner} position="41% 50%" />
          </div>
          <div className={styles.heroRight} aria-hidden="true">
            <HeroHex src={assayImages.heroRightInner} alt="" className={styles.hexRightInner} position="50% 6%" />
            <HeroHex src={assayImages.heroRightOuter} alt="" className={styles.hexRightOuter} position="48% 50%" />
            <HeroHex src={assayImages.heroRightMain} alt="" className={styles.hexRightMain} position="49% 50%" />
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>ASSAY DEVELOPMENT</p>
            <h1>Custom <span>qPCR &amp;<br />Molecular Assays</span></h1>
            <p className={styles.heroTagline}>Built, Validated, and Shipped Fast</p>
            <p className={styles.heroDescription}>
              Domestic manufacturing. Direct access to assay specialists.<br />
              Human response within 24 hours or less.
            </p>
            <div className={styles.heroActions}>
              <Link href={ASSAY_GUIDE} download className={styles.button}>
                Download Assay Guide <ButtonArrow />
              </Link>
              <a href="#assay-inquiry-form" className={`${styles.button} ${styles.buttonOutline}`}>
                Request a Custom Assay <ButtonArrow />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* The shared footer sits outside this page, so its Figma font is applied by family name. */}
      <style>{`body:has(.${styles.body}) footer { font-family: ${poppins.style.fontFamily}; }`}</style>
      <div className={`${poppins.className} ${styles.body}`}>
        <section className={styles.badges}>
          {reassuranceItems.map((item) => (
            <div key={item.label} className={styles.badge}>
              <item.icon aria-hidden="true" />
              <p>{item.label}</p>
            </div>
          ))}
        </section>

        <section className={`${styles.split} ${styles.custom}`}>
          <div className={styles.splitImage}>
            <Image src={assayImages.customBuilt} alt="Custom assay scientists" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className={styles.splitCopy}>
            <p className={styles.eyebrow}>VALIDATION SERVICES</p>
            <h2>
              Custom Assays Built
              <br />
              <span>Around Your</span>
              <br />
              <span>Research Needs</span>
            </h2>
            <p className={styles.lead}>
              We work directly with researchers, labs, and clinics to develop custom qPCR and
              molecular assays aligned with your target, workflow, and timeline.
            </p>
            <CheckList items={customBullets} />
          </div>
        </section>

        <div className={styles.dnaBand}>
          <section className={styles.standard}>
            <p className={styles.eyebrow}>STANDARD ASSAYS</p>
            <h2>
              <span>Standard Molecular Assays</span>
              <br />
              Ready When You Are
            </h2>
            <p className={styles.lead}>
              For labs seeking fast confirmation and reliable supply, our standard molecular assays offer
              a streamlined option with domestic manufacturing and documentation standards.
            </p>
            <div className={styles.stack}>
              <a href="mailto:info@biopathogenix.com" className={styles.button}>
                Confirm Availability by Email <ButtonArrow />
              </a>
              <a href={ASSAY_GUIDE} download className={`${styles.button} ${styles.buttonOutline}`}>
                Download Assay Guide <ButtonArrow />
              </a>
            </div>
          </section>

          <section className={`${styles.split} ${styles.support}`}>
            <div className={styles.splitCopy}>
              <p className={styles.eyebrow}>HUMAN SUPPORT</p>
              <h2>
                Thoughtful Review.
                <br />
                <span>Expert Response.</span>
                <br />
                <span>No Automation.</span>
              </h2>
              <p className={styles.lead}>
                Every inquiry sent to BioPathogenix is reviewed by our internal team before response.
                You receive a human response within 24 hours or less with clear next steps.
              </p>
              <CheckList items={supportBullets} />
            </div>
            <div className={styles.splitImage}>
              <Image src={assayImages.thoughtfulReview} alt="Assay sample handling" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
          </section>

          <section className={styles.documentation}>
            <div className={styles.docImage}>
              <Image src={assayImages.industryStandards} alt="Industry-standard assay documentation" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className={styles.docCopy}>
              <p className={styles.eyebrow}>VALIDATION SERVICES</p>
              <h2>
                Built to Industry
                <br />
                Standards. Supported
                <br />
                <span>by Documentation.</span>
              </h2>
              <p className={styles.lead}>
                All assays are provided for research use only (RUO) and supported by industry-standard
                quality systems, documentation, and domestic manufacturing processes.
              </p>
              <a href={ASSAY_GUIDE} download className={styles.button}>
                Download Assay Guide <ButtonArrow />
              </a>
            </div>
          </section>

        </div>

        <div className={styles.contactArea}>
          <section className={styles.contact}>
            <div className={styles.contactCopy}>
              <p className={styles.eyebrow}>GET IN TOUCH</p>
              <h2>
                Connect With an
                <br />
                <span>Assay Specialist</span>
              </h2>
              <p className={styles.lead}>
                Submit your inquiry and our team will review it internally to ensure your response is
                accurate, relevant, and technically informed.
              </p>
              <a href="mailto:info@biopathogenix.com" className={`${styles.button} ${styles.buttonOutline}`}>
                Confirm Availability by Email <ButtonArrow />
              </a>
            </div>
            <div id="assay-inquiry-form" className={styles.formCard}>
              <h3>Submit Your Inquiry</h3>
              <AssayInquiryForm submitClassName={styles.button} submitArrow={<ButtonArrow />} />
            </div>
          </section>

        </div>

        <section className={styles.cta}>
          <h2>
            Have a Question or
            <br />
            <span>Need Confirmation?</span>
          </h2>
          <p className={styles.lead}>
            Email our team to confirm feasibility, timelines, or documentation. Every inquiry is
            reviewed internally to ensure expert-level support.
          </p>
          <a href="mailto:info@biopathogenix.com" className={styles.button}>
            Confirm Availability by Email <ButtonArrow />
          </a>
        </section>
      </div>
    </main>
  );
}
