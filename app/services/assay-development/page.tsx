import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Factory,
  FileText,
  FlaskConical,
  Headset,
  Mail,
  Truck,
} from "lucide-react";
import AssayInquiryForm from "@/components/assay-services/AssayInquiryForm";

const assayImages = {
  hero: "/images/assay%20landing%20page/lab-pics_13-scaled-e1758821531748-1000x667.jpg",
  custom: "/images/assay%20landing%20page/dna-research-scientist-comparing-dna-results-on-a-2024-06-21-16-15-07-utc-1536x1152.jpg",
  review: "/images/assay%20landing%20page/lab-pics_13-scaled-e1758821531748-1000x667.jpg",
  standardsMain: "/images/assay%20landing%20page/What-is-PCR-Part-4-BioPath-Website-Blog.png",
  standardsSecondary: "/images/assay%20landing%20page/Lyophilization-BioPath-Website-Blog.png",
};

const reassuranceItems = [
  { icon: Factory, label: "Domestic manufacturing & shipping" },
  { icon: Truck, label: "72-hour time shipping (where applicable)" },
  { icon: FlaskConical, label: "RUO-only molecular assays" },
  { icon: Headset, label: "Direct access to assay specialists" },
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

export default function AssayDevelopmentPage() {
  return (
    <main className="bg-[#f6f8fb] py-8 text-[#153c67]">
      <div className="mx-auto w-full max-w-[1460px] px-4 sm:px-6 lg:px-10">
        <section className="relative overflow-hidden rounded-[28px] shadow-[0_22px_54px_rgba(17,63,110,0.12)]">
          <Image
            src={assayImages.hero}
            alt="Custom qPCR and molecular assays"
            width={1536}
            height={1152}
            className="h-[360px] w-full object-cover object-center sm:h-[430px] lg:h-[520px]"
            priority
          />
          <div className="absolute inset-0 bg-[#0f2f56]/56" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e2f57]/84 via-[#1a4f82]/68 to-[#65a8d1]/38" />
          <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-white sm:px-8">
            <div className="max-w-4xl">
              <span className="inline-flex rounded-full border border-white/30 bg-[#0d2d54]/35 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90 backdrop-blur-sm sm:text-xs">
                Assay Development
              </span>
              <h1 className="mt-5 text-balance text-[2rem] font-semibold leading-[1.08] drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)] sm:text-5xl lg:text-[4rem]">
                Custom qPCR &amp; Molecular Assays
              </h1>
              <p className="mt-4 text-balance text-[1.25rem] font-semibold leading-[1.18] text-white/96 sm:text-3xl lg:text-[2.6rem]">
                Built, Validated, and Shipped Fast
              </p>
              <p className="mx-auto mt-5 max-w-3xl text-sm font-medium leading-relaxed text-white/90 sm:text-base md:text-lg">
                Domestic manufacturing. Direct access to assay specialists. Human response within
                24 hours or less.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                <Link
                  href="/files/2025-BioPathogenix-Product-Catalog%201.pdf"
                  download
                  className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-full bg-[#0e2f57] px-8 py-3.5 text-base font-medium transition hover:bg-[#0a2340]"
                >
                  <Download className="h-4 w-4" />
                  Download Assay Guide
                </Link>
                <a
                  href="#assay-inquiry-form"
                  className="inline-flex min-w-[240px] items-center justify-center gap-2 rounded-full border border-white/60 bg-white/95 px-8 py-3.5 text-base font-medium text-[#1d5a8f] transition hover:bg-white"
                >
                  <ArrowRight className="h-4 w-4" />
                  Request a Custom Assay
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[24px] border border-[#d7e5f0] bg-white px-4 py-4 shadow-[0_10px_28px_rgba(22,82,135,0.06)] md:px-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {reassuranceItems.map((item) => (
              <div
                key={item.label}
                className="flex min-h-[108px] flex-col items-center justify-center gap-2 rounded-2xl bg-[#edf6fd] px-4 py-4 text-center"
              >
                <item.icon className="h-6 w-6 text-[#3a8cc3]" />
                <p className="text-sm font-medium leading-snug text-[#234f79] md:text-[15px]">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 rounded-xl bg-white p-4 md:grid-cols-2 md:p-6">
          <div className="overflow-hidden rounded-lg">
            <Image
              src={assayImages.custom}
              alt="Custom assays built around research needs"
              width={1536}
              height={1152}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full border border-[#badcf3] bg-[#eaf5fc] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2b7fb7]">
              Custom Assays
            </span>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">Custom Assays Built Around Your Research Needs</h2>
            <p className="mt-4 text-sm leading-relaxed text-[#224d75]">
              We work directly with researchers, labs, and clinics to develop custom qPCR and
              molecular assays aligned with your target, workflow, and timeline.
            </p>
            <ul className="mt-4 space-y-2">
              {customBullets.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#224d75]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2b7fb7]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-xl bg-[#c8efff] px-4 py-12 text-center">
          <span className="inline-block rounded-full border border-[#9ad7f5] bg-[#dcf5ff] px-4 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2b7fb7]">
            Standard Assays
          </span>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold leading-tight">
            Standard Molecular Assays Ready When You Are
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-[#275176]">
            For labs seeking fast confirmation and reliable supply, our standard molecular assays
            offer a streamlined option with domestic manufacturing and documentation standards.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="mailto:info@biopathogenix.com"
              className="inline-flex items-center gap-2 rounded-md bg-[#0e2f57] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0a2340]"
            >
              <Mail className="h-4 w-4" />
              Confirm Availability by Email
            </Link>
            <Link
              href="/files/2025-BioPathogenix-Product-Catalog%201.pdf"
              download
              className="inline-flex items-center gap-2 rounded-md bg-[#0e8ad1] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0b74b0]"
            >
              <Download className="h-4 w-4" />
              Download Assay Guide
            </Link>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full border border-[#badcf3] bg-[#eaf5fc] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2b7fb7]">
              Human Support
            </span>
            <h2 className="mt-3 text-3xl font-semibold leading-tight">
              Thoughtful Review. Expert Response. No Automation.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#224d75]">
              Every inquiry sent to BioPathogenix is reviewed by our internal team before response.
              You receive a human response within 24 hours or less with clear next steps.
            </p>
            <ul className="mt-4 space-y-2">
              {supportBullets.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-[#224d75]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2b7fb7]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="overflow-hidden rounded-lg">
            <Image
              src={assayImages.review}
              alt="Assay specialist lab review"
              width={1000}
              height={667}
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="mt-10 rounded-xl bg-[#deecf4] p-5 md:p-8">
          <div className="grid items-start gap-6 md:grid-cols-[0.95fr_1.05fr] md:gap-8">
            <div className="overflow-hidden rounded-xl bg-[#d9eaf4] md:max-w-[610px] md:-mt-2">
              <Image
                src={assayImages.standardsMain}
                alt="Industry standards and assay quality"
                width={1200}
                height={800}
                className="h-[420px] w-full object-cover object-top md:h-[430px]"
              />
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <span className="inline-block w-fit rounded-full border border-[#8fbee3] bg-[#e8f4fc] px-6 py-2 text-sm font-medium uppercase tracking-wide text-[#4b8dc3]">
                  Proof &amp; Compliance
                </span>
                <h2 className="mt-5 max-w-xl text-3xl font-semibold leading-[1.12] text-[#143764] md:text-[40px]">
                  <span className="block">Built to Industry</span>
                  <span className="block">Standards. Supported</span>
                  <span className="block">by Documentation.</span>
                </h2>
                <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#23486e] md:text-[16px] md:leading-[1.55]">
                  All assays are provided for research use only (RUO) and supported by
                  industry-standard quality systems, documentation, and domestic manufacturing
                  processes.
                </p>
              </div>
              <div className="mt-5 overflow-hidden rounded-xl md:mt-10">
                <Image
                  src={assayImages.standardsSecondary}
                  alt="Laboratory quality process"
                  width={1200}
                  height={800}
                  className="h-[420px] w-full object-cover md:h-[430px]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-white p-6">
            <span className="w-fit rounded-full border border-[#badcf3] bg-[#eaf5fc] px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#2b7fb7]">
              Get in Touch
            </span>
            <h2 className="mt-4 text-4xl font-semibold leading-tight">Connect With an Assay Specialist</h2>
            <p className="mt-4 text-sm leading-relaxed text-[#224d75]">
              Submit your inquiry and our team will review it internally to ensure your response is
              accurate, relevant, and technically informed.
            </p>
            <Link
              href="mailto:info@biopathogenix.com"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#0e2f57] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0a2340]"
            >
              <Mail className="h-4 w-4" />
              Confirm Availability by Email
            </Link>
          </div>

          <div id="assay-inquiry-form" className="scroll-mt-28 rounded-lg border border-[#d9e7f2] bg-white p-6">
            <h3 className="text-2xl font-semibold text-[#1f4f79]">Submit Your Inquiry</h3>
            <AssayInquiryForm />
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-xl">
          <div className="relative">
            <Image
              src={assayImages.hero}
              alt="Need assay confirmation"
              width={1536}
              height={1152}
              className="h-[250px] w-full object-cover md:h-[280px]"
            />
            <div className="absolute inset-0 bg-[#0d3765]/85" />
            <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-white">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
                  Have a Question or Need Confirmation?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm text-white/90 md:text-base">
                  Email our team to confirm feasibility, timelines, or documentation. Every inquiry
                  is reviewed internally to ensure expert-level support.
                </p>
                <Link
                  href="mailto:info@biopathogenix.com"
                  className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#1f96df] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#1682c1]"
                >
                  <Mail className="h-4 w-4" />
                  Confirm Availability by Email
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
