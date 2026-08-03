import { ArrowRight } from "lucide-react";
import Image from "next/image";

type ValidationLandingHeroProps = {
  onOpenForm: () => void;
};

const HEX_CLIP = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";
const HEX_RATIO = 1.1547;

type HeroHexProps = {
  src: string;
  alt: string;
  className: string;
  imageClassName?: string;
};

function HeroHex({ src, alt, className, imageClassName }: HeroHexProps) {
  return (
    <div
      className={`relative overflow-hidden bg-white p-1.5 shadow-[0_16px_34px_rgba(14,33,61,0.14)] sm:p-2 ${className}`}
      style={{ clipPath: HEX_CLIP, aspectRatio: HEX_RATIO }}
    >
      <div className="relative h-full w-full overflow-hidden" style={{ clipPath: HEX_CLIP }}>
        <Image src={src} alt={alt} fill className={`object-cover ${imageClassName ?? ""}`} />
      </div>
    </div>
  );
}

export default function ValidationLandingHero({ onOpenForm }: ValidationLandingHeroProps) {
  return (
    <section
      className="relative w-full overflow-hidden bg-[#f4f8fc] px-4 pb-6 pt-4 sm:px-6 sm:pt-5 md:px-10 md:pb-8 md:pt-6 lg:px-0"
      style={{
        backgroundImage: `url("/images/validation%20services/bg1.jpeg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.92)_0,rgba(255,255,255,0.82)_24%,rgba(241,246,252,0.58)_54%,rgba(235,242,250,0.28)_78%,rgba(235,242,250,0.08)_100%)]" />
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-1/2 opacity-45"
        style={{
          backgroundImage: `url("/images/validation%20services/bg1.jpeg")`,
          backgroundSize: "cover",
          backgroundPosition: "left center",
          backgroundRepeat: "no-repeat",
          transform: "scaleX(-1)",
          transformOrigin: "center",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_20%,rgba(255,255,255,0)_80%,rgba(255,255,255,0.12)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_76%_34%,rgba(90,140,220,0.05)_0,rgba(90,140,220,0.025)_16%,rgba(90,140,220,0)_34%)]" />

      <div className="relative mx-auto h-[440px] w-full max-w-none sm:h-[500px] lg:h-[620px] xl:h-[680px]">
        <div className="pointer-events-none absolute left-[4.5%] top-[8%] hidden lg:flex lg:w-[17%] lg:flex-col lg:items-start lg:gap-4 xl:left-[6%] xl:w-[15%] xl:gap-5">
          <HeroHex
            src="/images/validation%20services/2.png"
            alt="Lab validation workflow"
            className="h-[132px] xl:h-[150px]"
            imageClassName="object-center"
          />
          <HeroHex
            src="/images/validation%20services/1.png"
            alt="Validation scientist"
            className="ml-4 h-[198px] xl:h-[224px]"
            imageClassName="object-center"
          />
          <HeroHex
            src="/images/validation%20services/3.png"
            alt="Validation lab notes"
            className="ml-8 h-[132px] xl:h-[150px]"
            imageClassName="object-center"
          />
        </div>

        <div className="pointer-events-none absolute right-[4.5%] top-[8%] hidden lg:flex lg:w-[17%] lg:flex-col lg:items-end lg:gap-4 xl:right-[6%] xl:w-[15%] xl:gap-5">
          <HeroHex
            src="/images/validation%20services/4.png"
            alt="Validation equipment"
            className="h-[132px] xl:h-[150px]"
            imageClassName="object-center"
          />
          <HeroHex
            src="/images/validation%20services/5.png"
            alt="Validation specialist"
            className="mr-4 h-[198px] xl:h-[224px]"
            imageClassName="object-center"
          />
          <HeroHex
            src="/images/validation%20services/6.png"
            alt="Sample handling"
            className="mr-8 h-[132px] xl:h-[150px]"
            imageClassName="object-center"
          />
        </div>

        <div className="relative mx-auto flex h-full w-full max-w-[980px] flex-col items-center justify-center text-center lg:max-w-[66%] xl:max-w-[1040px]">
          <p className="mb-2 text-[0.68rem] font-bold tracking-[0.38em] text-[#6d829e] md:mb-3 md:text-[0.78rem]">
            VALIDATION SERVICES
          </p>

          <h1 className="max-w-[1100px] font-['Quicksand'] text-[2.05rem] font-bold leading-[0.92] tracking-[-0.045em] text-[#15345f] sm:text-[2.95rem] md:text-[3.55rem] lg:text-[4.05rem] xl:text-[4.35rem]">
            A Validation System
            <br />
            Designed to <span className="text-[#3a8ac8]">Protect</span>
            <br />
            <span className="text-[#3a8ac8]">Your Investment</span>
          </h1>

          <p className="mx-auto mt-3 max-w-[700px] text-[0.86rem] leading-[1.55] text-[#5d6f85] md:mt-4 md:text-[1rem]">
            CLIA-aligned. Audit-ready. Executed with industry-standard rigor and hands-on expertise.
          </p>

          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={onOpenForm}
              className="inline-flex h-[48px] w-full max-w-[390px] items-center justify-between gap-4 rounded-[4px] border border-[#2d5f95] bg-[#2f5d8f] px-5 text-[0.82rem] font-semibold text-white shadow-[0_10px_24px_rgba(25,62,107,0.22)] transition-transform hover:-translate-y-0.5 hover:bg-[#214b75] sm:max-w-[420px] md:px-6 md:text-[0.94rem]"
            >
              <span className="whitespace-nowrap">Schedule a Validation Consultation</span>
              <span className="border-l border-white/30 pl-3">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
            <button
              type="button"
              onClick={onOpenForm}
              className="inline-flex h-[48px] w-full max-w-[390px] items-center justify-between gap-4 rounded-[4px] border border-[#b3c7dd] bg-white px-5 text-[0.82rem] font-semibold text-[#2b4c73] shadow-[0_10px_24px_rgba(25,62,107,0.08)] transition-transform hover:-translate-y-0.5 hover:bg-[#f5f9fd] sm:max-w-[420px] md:px-6 md:text-[0.94rem]"
            >
              <span className="whitespace-nowrap">Speak with our Validation Team</span>
              <span className="border-l border-[#2b4c73]/20 pl-3">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
