import { ArrowRight } from "lucide-react";
import Image from "next/image";

type ValidationLandingHeroProps = {
  onOpenForm: () => void;
};

const HEX_PATTERN_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='146' viewBox='0 0 84 146'%3E%3Cpath d='M42 0L84 24V96L42 120L0 96V24Z' fill='none' stroke='%23cfe4f2' stroke-width='1'/%3E%3Cpath d='M42 26L84 50V122L42 146L0 122V50Z' fill='none' stroke='%23cfe4f2' stroke-width='1'/%3E%3C/svg%3E";

export default function ValidationLandingHero({ onOpenForm }: ValidationLandingHeroProps) {
  return (
    <section
      className="relative w-full overflow-hidden px-6 py-20 md:px-14 md:py-24"
      style={{
        backgroundImage: `radial-gradient(circle at 68% 22%, rgba(255,255,255,0.98), rgba(235,242,250,0.72) 28%, transparent 58%), radial-gradient(circle at 18% 68%, rgba(255,255,255,0.96), transparent 40%), url("${HEX_PATTERN_BG}"), linear-gradient(135deg,#f7f9fc 0%,#e8eff7 100%)`,
      }}
    >
      <Image
        src="/images/about/Molecular-Diagnostics.webp"
        alt=""
        width={192}
        height={214}
        className="hidden lg:block absolute left-[3%] top-[8%]"
      />
      <Image
        src="/images/about/Protective-Equipment.webp"
        alt=""
        width={130}
        height={145}
        className="hidden lg:block absolute left-[13%] bottom-[8%]"
      />
      <Image
        src="/images/about/Microscope.webp"
        alt=""
        width={130}
        height={145}
        className="hidden lg:block absolute right-[13%] top-[8%]"
      />
      <Image
        src="/images/about/Disease-Testing.webp"
        alt=""
        width={192}
        height={214}
        className="hidden lg:block absolute right-[3%] bottom-[8%]"
      />

      <div className="relative mx-auto max-w-4xl text-center">
        <p className="mb-5 text-[0.85rem] font-bold tracking-[0.22em] text-[#16325f]">
          VALIDATION SERVICES
        </p>

        <h1 className="font-['Quicksand'] text-[2.4rem] font-bold leading-[1.1] tracking-[-0.02em] text-[#132a52] sm:text-[3.2rem] md:text-[3.7rem]">
          A Validation System
          <br />
          Designed to <span className="text-[#3d7ec2]">Protect</span>
          <br />
          <span className="text-[#3d7ec2]">Your Investment</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-[1.05rem] leading-relaxed text-[#3d4c60]">
          CLIA-aligned. Audit-ready. Executed with industry-standard rigor and hands-on expertise.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <button
            type="button"
            onClick={onOpenForm}
            className="inline-flex min-w-[260px] items-center justify-center gap-3 rounded-lg bg-[#173864] px-7 py-3.5 text-[0.98rem] font-semibold text-white shadow-[0_16px_28px_rgba(23,56,100,0.25)] transition-colors hover:bg-[#0f2a4d]"
          >
            Schedule a Validation Consultation
            <span className="border-l border-white/30 pl-3">
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
          <button
            type="button"
            onClick={onOpenForm}
            className="inline-flex min-w-[230px] items-center justify-center gap-3 rounded-lg border border-[#173864] bg-white px-7 py-3.5 text-[0.98rem] font-semibold text-[#173864] transition-colors hover:bg-[#eef4fb]"
          >
            Speak with our Validation Team
            <span className="border-l border-[#173864]/25 pl-3">
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
