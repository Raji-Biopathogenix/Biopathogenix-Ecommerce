import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Factory,
  Download,
  FlaskConical,
  UsersRound,
  Mail,
  FileText,
  Truck,
} from "lucide-react";
import AssayInquiryForm from "@/components/assay-services/AssayInquiryForm";
import styles from "./assay-development.module.css";

const HEX_CLIP = "url(#assay-hero-hex)";
const HEX_RATIO = 0.866;

const assayImages = {
  heroBg: "/images/assay%20landing%20page/bg1.jpeg",
  dnaBg: "/images/assay%20landing%20page/bg2.jpeg",
  heroLeftTop: "/images/assay%20landing%20page/1.png",
  heroLeftMid: "/images/assay%20landing%20page/2.png",
  heroLeftBottom: "/images/assay%20landing%20page/3.png",
  heroRightTop: "/images/assay%20landing%20page/4.png",
  heroRightMid: "/images/assay%20landing%20page/5.png",
  heroRightBottom: "/images/assay%20landing%20page/6.png",
  customBuilt: "/images/assay%20landing%20page/7.png",
  thoughtfulReview: "/images/assay%20landing%20page/8.png",
  industryStandards: "/images/assay%20landing%20page/9.png",
};

const reassuranceItems = [
  { icon: Factory, label: "Domestic manufacturing and shipping" },
  { icon: Truck, label: "72-hour time shipping (where applicable)" },
  { icon: FlaskConical, label: "RUO-only molecular assays" },
  { icon: UsersRound, label: "Direct access to assay specialists" },
  { icon: FileText, label: "Industry-standard documentation & QA process" },
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
      <section className={styles.hero}>
        <div className={styles.heroStage}>
          <div className={styles.heroLeft} aria-hidden="true">
            <HeroHex src={assayImages.heroLeftTop} alt="" className={styles.hexLeftMain} position="32% 50%" />
            <HeroHex src={assayImages.heroLeftMid} alt="" className={styles.hexLeftOuter} position="50% 35%" />
            <HeroHex src={assayImages.heroLeftBottom} alt="" className={styles.hexLeftInner} position="42% 50%" />
          </div>
          <div className={styles.heroRight} aria-hidden="true">
            <HeroHex src={assayImages.heroRightTop} alt="" className={styles.hexRightInner} position="50% 22%" />
            <HeroHex src={assayImages.heroRightMid} alt="" className={styles.hexRightOuter} position="72% 50%" />
            <HeroHex src={assayImages.heroRightBottom} alt="" className={styles.hexRightMain} position="55% 28%" />
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
              <Link href="/files/2025-BioPathogenix-Product-Catalog%201.pdf" download>
                Download Assay Guide <ArrowRight aria-hidden="true" />
              </Link>
              <a href="#assay-inquiry-form">Request a Custom Assay <ArrowRight aria-hidden="true" /></a>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.badges} mx-auto w-full max-w-[1460px] px-4 pb-6 sm:px-6 md:pb-0 lg:px-10`}>
        <div className="grid grid-cols-1 gap-3 bg-white/60 px-3 py-4 sm:grid-cols-2 md:py-3 lg:grid-cols-5 lg:gap-6">
          {reassuranceItems.map((item) => (
            <div key={item.label} className="flex min-w-0 items-center gap-3 text-[#173b62]">
              <span className={styles.badgeIcon}><item.icon aria-hidden="true" /></span>
              <p className="text-[13px] font-semibold leading-snug md:text-[14px]">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.custom} mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-10`}>
        <div className="grid overflow-hidden rounded-[22px] bg-[#191e49] md:grid-cols-2">
          <div className="relative min-h-[300px] min-w-0 md:min-h-[445px]">
            <Image src={assayImages.customBuilt} alt="Custom assay scientists" fill sizes="(min-width: 1460px) 690px, (min-width: 768px) 50vw, 100vw" className="object-cover" />
          </div>
          <div className="flex min-h-[300px] min-w-0 items-center px-6 py-8 text-left text-white md:min-h-[445px] md:px-8 md:py-10 lg:px-10">
            <div className="w-full min-w-0 max-w-[520px]">
              <p className="text-[0.66rem] font-bold tracking-[0.28em] text-white/70">VALIDATION SERVICES</p>
              <h2 className="mt-3 break-words font-['Quicksand'] text-[1.9rem] font-bold leading-[1.08] tracking-[-0.04em] text-white md:text-[clamp(1.9rem,3.1vw,2.75rem)]">
                <span className="block text-white">Custom Assays Built</span>
                <span className="block text-[#4ba8db]">Around Your</span>
                <span className="block text-[#4ba8db]">Research Needs</span>
              </h2>
              <p className="mt-3.5 max-w-[460px] text-[0.88rem] leading-[1.55] text-white/86 md:text-[0.9rem]">
                We work directly with researchers, labs, and clinics to develop custom qPCR and
                molecular assays aligned with your target, workflow, and timeline.
              </p>
              <ul className="mt-4 space-y-2">
                {customBullets.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[0.84rem] text-white/92 md:text-[0.94rem]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6ac2ea]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.standard} mx-auto w-full max-w-[1460px] px-4 pb-16 pt-12 text-center sm:px-6 md:pb-[168px] md:pt-[120px] lg:px-10`}
        style={{
          backgroundImage: `url("${assayImages.dnaBg}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <p className="text-[0.66rem] font-bold tracking-[0.3em] text-[#587ea3]">STANDARD ASSAYS</p>
        <h2 className="mx-auto mt-2.5 max-w-[860px] font-['Quicksand'] text-[2rem] font-bold leading-[1.05] text-[#18345e] md:text-[3rem]">
          <span className="text-[#3f8ece]">Standard Molecular Assays</span>
          <br />
          Ready When You Are
        </h2>
        <p className="mx-auto mt-3.5 max-w-[760px] text-[0.9rem] leading-[1.55] text-[#345b7e] md:text-[1rem]">
          For labs seeking fast confirmation and reliable supply, our standard molecular assays
          offer a streamlined option with domestic manufacturing and documentation standards.
        </p>
        <div className="mt-5 flex flex-col items-center justify-center gap-2">
          <Link
            href="mailto:info@biopathogenix.com"
            className="inline-flex h-[44px] w-full max-w-[320px] items-center justify-between gap-3 rounded-[4px] border border-[#2f6298] bg-[#2f5d8f] px-5 text-[0.82rem] font-semibold text-white hover:bg-[#244d78]"
          >
            <span>Confirm Availability by Email</span>
            <span className="border-l border-white/30 pl-3">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
          <Link
            href="/files/2025-BioPathogenix-Product-Catalog%201.pdf"
            download
            className="inline-flex h-[44px] w-full max-w-[320px] items-center justify-between gap-3 rounded-[4px] border border-[#a9c0d9] bg-white px-5 text-[0.82rem] font-semibold text-[#264b75] hover:bg-[#f5f9fd]"
          >
            <span>Download Assay Guide</span>
            <span className="border-l border-[#264b75]/20 pl-3">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>

      <section className={`${styles.support} mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-10`}>
        <div className="grid overflow-hidden rounded-[22px] bg-[#091f44] md:grid-cols-2">
          <div className="flex flex-col justify-center px-6 py-8 text-white md:px-10 md:py-10">
            <p className="text-[0.66rem] font-bold tracking-[0.28em] text-white/70">HUMAN SUPPORT</p>
            <h2 className="mt-3 font-['Quicksand'] text-[2rem] font-bold leading-[1.03] text-white drop-shadow-[0_2px_8px_rgba(2,10,26,0.45)] md:text-[3.05rem]">
              <span className="text-white">Thoughtful Review.</span>
              <br />
              <span className="text-[#4ba8db]">Expert Response.</span>
              <br />
              <span className="text-[#4ba8db]">No Automation.</span>
            </h2>
            <p className="mt-4 max-w-[520px] text-[0.9rem] leading-[1.6] text-white/84">
              Every inquiry sent to BioPathogenix is reviewed by our internal team before response.
              You receive a human response within 24 hours or less with clear next steps.
            </p>
            <ul className="mt-5 space-y-2.5">
              {supportBullets.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[0.84rem] text-white/92 md:text-[0.93rem]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#6ac2ea]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative min-h-[320px] md:min-h-[460px]">
            <Image src={assayImages.thoughtfulReview} alt="Assay sample handling" fill className="object-cover" />
          </div>
        </div>
      </section>

      <section className={`${styles.documentation} mx-auto mt-12 w-full max-w-[1460px] px-4 sm:px-6 md:mt-36 lg:px-10`}
        style={{
          backgroundImage: `url("${assayImages.dnaBg}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="grid items-center gap-8 md:grid-cols-[1.05fr_0.95fr]">
          <div className="overflow-hidden rounded-[22px] bg-white shadow-[0_12px_32px_rgba(14,53,95,0.08)]">
            <Image
              src={assayImages.industryStandards}
              alt="Industry-standard assay documentation"
              width={1200}
              height={760}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="px-1">
            <p className="text-[0.66rem] font-bold tracking-[0.3em] text-[#53799f]">VALIDATION SERVICES</p>
            <h2 className="mt-3 font-['Quicksand'] text-[2.05rem] font-bold leading-[1.05] text-[#17365f] md:text-[3.1rem]">
              Built to Industry
              <br />
              Standards. Supported
              <br />
              <span className="text-[#3f8fce]">by Documentation.</span>
            </h2>
            <p className="mt-4 max-w-[550px] text-[0.92rem] leading-[1.6] text-[#36597d] md:text-[1rem]">
              All assays are provided for research use only (RUO) and supported by
              industry-standard quality systems, documentation, and domestic manufacturing
              processes.
            </p>
            <Link
              href="/files/2025-BioPathogenix-Product-Catalog%201.pdf"
              download
              className="mt-6 inline-flex h-[46px] items-center justify-between gap-4 rounded-[4px] border border-[#2d5f95] bg-[#2f5d8f] px-5 text-[0.84rem] font-semibold text-white hover:bg-[#214b75]"
            >
              <span>Download Assay Guide</span>
              <span className="border-l border-white/30 pl-3">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className={`${styles.contact} mx-auto mt-16 w-full max-w-[1460px] px-4 sm:px-6 md:mt-[104px] lg:px-10`}>
        <div className="grid gap-6 overflow-hidden rounded-[22px] bg-[#eaf2fb] p-4 md:grid-cols-2 md:p-8">
          <div className="flex flex-col justify-center rounded-[18px] bg-[linear-gradient(135deg,#eaf4ff_0%,#d9ebfb_100%)] px-6 py-8 md:px-8">
            <p className="text-[0.66rem] font-bold tracking-[0.3em] text-[#4f789f]">GET IN TOUCH</p>
            <h2 className="mt-3 font-['Quicksand'] text-[2rem] font-bold leading-[1.05] text-[#173760] md:text-[3.2rem]">
              Connect With an
              <br />
              <span className="text-[#3f8fce]">Assay Specialist</span>
            </h2>
            <p className="mt-4 max-w-[520px] text-[0.9rem] leading-[1.6] text-[#355a7e]">
              Submit your inquiry and our team will review it internally to ensure your response is
              accurate, relevant, and technically informed.
            </p>
            <Link
              href="mailto:info@biopathogenix.com"
              className="mt-6 inline-flex h-[46px] w-full max-w-[320px] items-center justify-between gap-3 rounded-[4px] border border-[#2d5f95] bg-[#2f5d8f] px-5 text-[0.84rem] font-semibold text-white hover:bg-[#214b75]"
            >
              <span>Confirm Availability by Email</span>
              <span className="border-l border-white/30 pl-3">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>

          <div id="assay-inquiry-form" className="scroll-mt-28 rounded-[18px] border border-[#d7e6f2] bg-white p-6 md:p-8">
            <h3 className="text-center font-['Quicksand'] text-[2rem] font-bold text-[#1f4f79]">Submit Your Inquiry</h3>
            <AssayInquiryForm />
          </div>
        </div>
      </section>

      <section className={`${styles.cta} mx-auto mt-16 w-full max-w-[1460px] px-4 pb-16 sm:px-6 md:mt-[120px] md:pb-20 lg:px-10`}>
        <div className="overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#071736_0%,#0a1f45_52%,#0f2a5b_100%)] px-6 py-12 text-center text-white md:px-12 md:py-16">
          <h2 className="font-['Quicksand'] text-[2.1rem] font-bold leading-[1.05] text-white drop-shadow-[0_2px_10px_rgba(4,12,32,0.55)] md:text-[4rem]">
            <span className="text-white">Have a Question or</span>
            <br />
            <span className="text-[#4caadf]">Need Confirmation?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-[0.9rem] leading-[1.6] text-white/92 md:text-[1rem]">
            Email our team to confirm feasibility, timelines, or documentation. Every inquiry is
            reviewed internally to ensure expert-level support.
          </p>
          <Link
            href="mailto:info@biopathogenix.com"
            className="mt-6 inline-flex h-[46px] w-full max-w-[320px] items-center justify-between gap-3 rounded-[4px] border border-[#2d5f95] bg-[#2f5d8f] px-5 text-[0.84rem] font-semibold text-white hover:bg-[#214b75]"
          >
            <span>Confirm Availability by Email</span>
            <span className="border-l border-white/30 pl-3">
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
