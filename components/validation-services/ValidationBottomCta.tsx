import { ArrowRight } from "lucide-react";
import Image from "next/image";

type ValidationBottomCtaProps = {
  onOpenForm: () => void;
};

export default function ValidationBottomCta({ onOpenForm }: ValidationBottomCtaProps) {
  return (
    <section className="bg-[#f2f4f6] px-4 pb-12 pt-4">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl">
        <div className="relative">
          <Image
            src="/images/validation%20services/Blog-Placeholder-Image-1.jpg"
            alt="Validation final call to action"
            width={1600}
            height={900}
            className="h-[360px] w-full object-cover md:h-[460px]"
          />
          <div className="absolute inset-0 bg-[#123b73]/82" />
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-white">
            <div className="max-w-4xl">
              <span className="inline-block rounded-full border border-[#58a0de] px-6 py-2 text-sm text-[#58a0de] md:text-lg">
                STANDARD ASSAYS
              </span>
              <h2 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
                Confident Validation Starts With Structured Design
              </h2>
              <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed md:text-xl">
                Schedule a consultation and see how BioPathogenix transforms validation from risk
                into readiness.
              </p>
              <button
                type="button"
                onClick={onOpenForm}
                className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#4293d9] px-8 py-3 text-sm font-medium transition hover:bg-[#347ec0] md:text-base"
              >
                Schedule Consultation
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
