import { ArrowRight } from "lucide-react";

type ValidationBottomCtaProps = {
  onOpenForm: () => void;
};

export default function ValidationBottomCta({ onOpenForm }: ValidationBottomCtaProps) {
  return (
    <section className="bg-[#f4f8fc] px-4 pb-12 pt-4 md:px-6 md:pb-14">
      <div className="mx-auto max-w-[1440px] overflow-hidden rounded-[28px] bg-[#081534] shadow-[0_24px_60px_rgba(5,12,30,0.24)]">
        <div
          className="relative min-h-[320px] px-6 py-8 md:min-h-[360px] md:px-10 md:py-10"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(8,21,52,1) 0%, rgba(8,21,52,1) 46%, rgba(8,21,52,0.96) 58%, rgba(8,21,52,0.72) 72%, rgba(8,21,52,0.18) 88%, rgba(8,21,52,0) 100%), url("/images/validation%20services/confident-validation-dna.png")`,
            backgroundSize: "cover, cover",
            backgroundPosition: "left center, right center",
            backgroundRepeat: "no-repeat, no-repeat",
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_86%_40%,rgba(115,170,255,0.26)_0,rgba(115,170,255,0.12)_12%,rgba(8,21,52,0)_34%),radial-gradient(circle_at_74%_74%,rgba(94,157,255,0.15)_0,rgba(94,157,255,0.06)_14%,rgba(8,21,52,0)_28%)]" />

          <div className="relative z-10 flex h-full max-w-[620px] flex-col justify-center text-white">
            <span className="text-[0.68rem] font-bold tracking-[0.34em] text-white/62 md:text-[0.78rem]">
              STANDARD ASSAYS
            </span>
            <h2 className="mt-4 max-w-[620px] font-['Quicksand'] text-[2.05rem] font-bold leading-[0.92] tracking-[-0.04em] md:text-[3.45rem]">
              <span className="text-[#50a7d7]">Confident Validation</span>
              <br />
              Starts With Structured
              <br />
              Design
            </h2>
            <p className="mt-4 max-w-[320px] text-[0.82rem] leading-6 text-white/78 md:mt-5 md:text-[0.96rem]">
              Schedule a consultation and see how BioPathogenix transforms validation from risk into readiness.
            </p>

            <button
              type="button"
              onClick={onOpenForm}
              className="mt-6 inline-flex items-center gap-3 rounded-[4px] bg-white px-6 py-3 text-[0.82rem] font-semibold text-[#0a1d3d] transition hover:bg-[#eef6fc] md:mt-8 md:px-7 md:text-[0.94rem]"
            >
              Schedule a Consultation
              <span className="border-l border-[#0a1d3d]/20 pl-3">
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
