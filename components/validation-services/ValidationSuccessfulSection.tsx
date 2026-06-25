import { ArrowRight, CheckCircle2 } from "lucide-react";
import Image from "next/image";

const pressurePoints = [
  "Pressure to launch on time.",
  "Pressure to satisfy inspection standards.",
  "Pressure to protect your laboratory's credibility.",
  "Pressure to ensure every data point can stand up to scrutiny.",
];

const qualityPoints = [
  "Your acceptance criteria are defined correctly.",
  "Your studies are structured intentionally.",
  "Your reports are complete, organized and defensible.",
];

const delivers = [
  "Structured Validation Design",
  "Regulatory-Aligned Documentation",
  "Defensible Performance Data",
  "Confident Inspection Readiness",
];

type ValidationSuccessfulSectionProps = {
  onOpenForm: () => void;
};

export default function ValidationSuccessfulSection({ onOpenForm }: ValidationSuccessfulSectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 md:py-14 [font-family:'Times_New_Roman',Times,serif]">
      <div className="text-center text-[#123669]">
        <h2 className="text-3xl font-semibold leading-tight text-[#123669] md:text-5xl">
          What a Successful Validation Looks Like
        </h2>
        <p className="mx-auto mt-6 max-w-4xl text-base font-medium md:text-2xl">
          Let&#39;s be honest. Validation is rarely just another project on the bench.
        </p>
      </div>

      <div className="mt-14 grid gap-8 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl">
          <Image
            src="/images/validation%20services/Blog-Placeholder-Image-1.jpg"
            alt="Validation analysts reviewing data"
            width={1000}
            height={760}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="text-[#123669]">
          <h3 className="text-3xl font-semibold md:text-5xl">It carries pressure.</h3>
          <ul className="mt-6 space-y-3">
            {pressurePoints.map((item) => (
              <li key={item} className="flex items-start gap-2 text-lg md:text-xl">
                <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#123669] md:h-8 md:w-8" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-7 text-lg leading-relaxed md:text-xl">
            A successful validation removes uncertainty from your process by ensuring that your
            documentation aligns with CLIA, CAP, or COLA expectations from the start.
          </p>

          <ul className="mt-6 space-y-3">
            {qualityPoints.map((item) => (
              <li key={item} className="flex items-start gap-2 text-lg md:text-xl">
                <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#123669] md:h-8 md:w-8" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-10 md:mt-12">
        <div className="grid gap-8 md:grid-cols-2 md:items-start">
          <div className="text-[#123669]">
            <p className="text-base leading-relaxed md:text-lg">
              With BioPathogenix, validation is structured from the beginning to reduce risk,
              eliminate guesswork, and protect your time, your reagents, and your team&#39;s energy.
              Our process front-loads planning, aligns documentation with regulatory expectations,
              and provides hands-on training so your laboratory is not just validated but prepared.
            </p>

            <h4 className="mt-7 text-2xl font-semibold md:text-3xl">We Deliver</h4>
            <ul className="mt-4 space-y-3">
              {delivers.map((item) => (
                <li key={item} className="flex items-start gap-2 text-base md:text-lg">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#123669] md:h-6 md:w-6" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-base leading-relaxed md:text-lg">
              Ready to experience a Zero Net Loss Validation service that provides clarity and
              confidence without inflating complexity or cost?
            </p>

            <button
              type="button"
              onClick={onOpenForm}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#123b73] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#0f325f]"
            >
              Speak With Our Validation Team
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl md:h-[500px]">
            <Image
              src="/images/validation%20services/Contrived-Sample-1000x667.jpg"
              alt="Validation lab close-up"
              width={1200}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
