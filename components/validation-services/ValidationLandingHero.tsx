import { ArrowRight } from "lucide-react";
import Image from "next/image";

type ValidationLandingHeroProps = {
  onOpenForm: () => void;
};

export default function ValidationLandingHero({ onOpenForm }: ValidationLandingHeroProps) {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pb-10 pt-6 sm:px-6 lg:px-10 lg:pb-14">
      <div className="relative overflow-hidden rounded-[28px] shadow-[0_28px_70px_rgba(18,61,115,0.18)]">
        <Image
          src="/images/validation%20services/Pipette-Tips-1-1-768x513.jpg"
          alt="Validation Services"
          width={1600}
          height={900}
          className="h-[380px] w-full object-cover object-center sm:h-[460px] lg:h-[620px]"
          priority
        />
        <div className="absolute inset-0 bg-[#0f3e73]/48" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#102e57]/92 via-[#18518a]/72 to-[#60a8d8]/34" />
        <div className="absolute inset-y-0 left-0 w-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_42%)]" />

        <div className="absolute inset-0 flex items-center justify-center px-5 text-center sm:px-10">
          <div className="max-w-5xl text-white">
            <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/88 backdrop-blur-sm sm:text-xs">
              Validation Services
            </span>
            <h1 className="mt-6 text-balance text-[2.15rem] font-semibold leading-[1.05] sm:text-5xl md:text-6xl lg:text-[4.65rem]">
              A Validation System Designed to Protect Your Investment
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-sm font-medium leading-relaxed text-white/90 sm:text-base md:mt-7 md:text-xl">
              CLIA-aligned. Audit-ready. Executed with industry-standard rigor and hands-on
              expertise.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
              <button
                type="button"
                onClick={onOpenForm}
                className="inline-flex min-w-[250px] items-center justify-center gap-2 rounded-full bg-[#123b73] px-7 py-3.5 text-sm font-medium transition hover:bg-[#0f325f] md:text-base"
              >
                Schedule a Validation Consultation
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={onOpenForm}
                className="inline-flex min-w-[250px] items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-[#2b6ea8] transition hover:bg-[#eef4fb] md:text-base"
              >
                Speak With Our Validation Team
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
