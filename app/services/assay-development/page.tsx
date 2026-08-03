import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FlaskConical,
  Headset,
  Mail,
  ShieldCheck,
  Truck,
} from "lucide-react";
import AssayInquiryForm from "@/components/assay-services/AssayInquiryForm";

const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
const HEX_RATIO = 1.1547;

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
  { icon: ClipboardCheck, label: "Domestic manufacturing and shipping" },
  { icon: Truck, label: "72-hour time shipping (where applicable)" },
  { icon: FlaskConical, label: "RUO-only molecular assays" },
  { icon: Headset, label: "Direct access to assay specialists" },
  { icon: ShieldCheck, label: "Industry-standard documentation & QA process" },
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

function HeroHex({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-white p-1.5 shadow-[0_16px_34px_rgba(14,33,61,0.16)] sm:p-2 ${className}`}
      style={{ clipPath: HEX_CLIP, aspectRatio: HEX_RATIO }}
    >
      <div className="relative h-full w-full overflow-hidden" style={{ clipPath: HEX_CLIP }}>
        <Image src={src} alt={alt} fill className="object-cover" />
      </div>
    </div>
  );
}

export default function AssayDevelopmentPage() {
  return (
    <main
      className="overflow-hidden bg-[#f2f7fd] text-[#18355d]"
      style={{
        backgroundImage: `url("${assayImages.dnaBg}")`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <section
        className="relative overflow-hidden px-4 pb-8 pt-4 sm:px-6 md:px-10 md:pb-10 md:pt-6 lg:px-0"
        style={{
          backgroundImage: `url("${assayImages.heroBg}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.94)_0,rgba(255,255,255,0.86)_24%,rgba(241,246,252,0.58)_54%,rgba(235,242,250,0.3)_78%,rgba(235,242,250,0.08)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_20%,rgba(255,255,255,0)_80%,rgba(255,255,255,0.12)_100%)]" />

        <div className="relative mx-auto h-[460px] w-full max-w-none sm:h-[540px] lg:h-[650px] xl:h-[700px]">
          <div className="pointer-events-none absolute left-[4.5%] top-[9%] hidden lg:flex lg:w-[17%] lg:flex-col lg:items-start lg:gap-4 xl:left-[6%] xl:w-[15%] xl:gap-5">
            <HeroHex src={assayImages.heroLeftTop} alt="Assay development lab" className="h-[132px] xl:h-[150px]" />
            <HeroHex src={assayImages.heroLeftMid} alt="Scientist running samples" className="ml-4 h-[198px] xl:h-[224px]" />
            <HeroHex src={assayImages.heroLeftBottom} alt="Assay specialist" className="ml-8 h-[132px] xl:h-[150px]" />
          </div>

          <div className="pointer-events-none absolute right-[4.5%] top-[9%] hidden lg:flex lg:w-[17%] lg:flex-col lg:items-end lg:gap-4 xl:right-[6%] xl:w-[15%] xl:gap-5">
            <HeroHex src={assayImages.heroRightTop} alt="qPCR assay scientist" className="h-[132px] xl:h-[150px]" />
            <HeroHex src={assayImages.heroRightMid} alt="Molecular assay review" className="mr-4 h-[198px] xl:h-[224px]" />
            <HeroHex src={assayImages.heroRightBottom} alt="Quality assay process" className="mr-8 h-[132px] xl:h-[150px]" />
          </div>

          <div className="relative mx-auto flex h-full w-full max-w-[980px] flex-col items-center justify-center text-center lg:max-w-[66%] xl:max-w-[1040px]">
            <p className="mb-2 text-[0.7rem] font-bold tracking-[0.34em] text-[#5a7ca1] md:mb-3 md:text-[0.8rem]">
              ASSAY DEVELOPMENT
            </p>
            <h1 className="max-w-[1000px] font-['Quicksand'] text-[2.1rem] font-bold leading-[0.93] tracking-[-0.04em] text-[#1a3160] sm:text-[3rem] md:text-[3.6rem] lg:text-[4.1rem] xl:text-[4.4rem]">
              Custom qPCR &amp;
              <br />
              <span className="text-[#3f86ca]">Molecular Assays</span>
            </h1>
            <p className="mt-4 text-[1.02rem] font-semibold text-[#1d3a65] md:text-[1.26rem]">
              Built, Validated, and Shipped Fast
            </p>
            <p className="mx-auto mt-3 max-w-[700px] text-[0.9rem] leading-[1.55] text-[#415c7c] md:mt-4 md:text-[1rem]">
              Domestic manufacturing. Direct access to assay specialists. Human response within 24
              hours or less.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-2.5 sm:gap-3">
              <Link
                href="/files/2025-BioPathogenix-Product-Catalog%201.pdf"
                download
                className="inline-flex h-[48px] w-full max-w-[420px] items-center justify-between gap-4 rounded-[4px] border border-[#2d5f95] bg-[#2f5d8f] px-5 text-[0.83rem] font-semibold text-white shadow-[0_10px_24px_rgba(25,62,107,0.22)] transition-transform hover:-translate-y-0.5 hover:bg-[#214b75] md:px-6 md:text-[0.95rem]"
              >
                <span className="whitespace-nowrap">Download Assay Guide</span>
                <span className="border-l border-white/30 pl-3">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              <a
                href="#assay-inquiry-form"
                className="inline-flex h-[48px] w-full max-w-[420px] items-center justify-between gap-4 rounded-[4px] border border-[#b3c7dd] bg-white px-5 text-[0.83rem] font-semibold text-[#2b4c73] shadow-[0_10px_24px_rgba(25,62,107,0.08)] transition-transform hover:-translate-y-0.5 hover:bg-[#f5f9fd] md:px-6 md:text-[0.95rem]"
              >
                <span className="whitespace-nowrap">Request a Custom Assay</span>
                <span className="border-l border-[#2b4c73]/20 pl-3">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1460px] px-4 pb-3 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-2 border-y border-[#dce9f6] bg-white/60 px-3 py-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-4 lg:bg-transparent">
          {reassuranceItems.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5 text-[#1f4f78]">
              <item.icon className="h-4 w-4 shrink-0 text-[#3f88c7]" />
              <p className="text-[12px] font-medium leading-snug">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-4 w-full max-w-[1460px] px-4 sm:px-6 lg:px-10">
        <div className="grid overflow-hidden rounded-[22px] bg-[#0b234b] md:grid-cols-[1.02fr_0.98fr]">
          <div className="relative min-h-[300px] md:min-h-[445px]">
            <Image src={assayImages.customBuilt} alt="Custom assay scientists" fill className="object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,24,52,0.18)_0%,rgba(7,24,52,0)_35%)]" />
          </div>
          <div className="flex min-h-[300px] items-start px-6 py-7 text-white md:min-h-[445px] md:px-8 md:py-8">
            <div className="w-full max-w-[470px]">
              <p className="text-[0.66rem] font-bold tracking-[0.28em] text-white/70">VALIDATION SERVICES</p>
              <h2 className="mt-2.5 font-['Quicksand'] text-[1.9rem] font-bold leading-[1.02] text-white drop-shadow-[0_2px_8px_rgba(2,10,26,0.45)] md:text-[2.95rem]">
                <span className="text-white">Custom Assays Built</span>
                <br />
                <span className="text-[#4ba8db]">Around Your</span>
                <br />
                <span className="text-[#4ba8db]">Research Needs</span>
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

      <section
        className="mx-auto mt-5 w-full max-w-[1460px] px-4 py-8 text-center sm:px-6 lg:px-10"
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

      <section className="mx-auto mt-3 w-full max-w-[1460px] px-4 sm:px-6 lg:px-10">
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

      <section
        className="mx-auto mt-6 w-full max-w-[1460px] px-4 pb-2 sm:px-6 lg:px-10"
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
              by <span className="text-[#3f8fce]">Documentation.</span>
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

      <section className="mx-auto mt-8 w-full max-w-[1460px] px-4 sm:px-6 lg:px-10">
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

      <section className="mx-auto mt-10 w-full max-w-[1460px] px-4 pb-12 sm:px-6 lg:px-10">
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
            className="mt-6 inline-flex h-[46px] w-full max-w-[320px] items-center justify-between gap-3 rounded-[4px] border border-[#2d5f95] bg-[#1f96df] px-5 text-[0.84rem] font-semibold text-white hover:bg-[#1783c2]"
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
