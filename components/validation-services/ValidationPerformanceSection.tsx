import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

const bullets = [
  "Timely completion",
  "Clear explanations and hands-on training",
  "Stability studies completed successfully",
  "Continued availability after validation",
  "Professional, kind, thorough support",
];

export default function ValidationPerformanceSection() {
  return (
    <section className="bg-[#0a1735] px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto grid max-w-[1440px] items-center gap-8 overflow-hidden rounded-[28px] bg-[#091a3d] px-6 py-8 shadow-[0_24px_60px_rgba(5,12,30,0.26)] md:grid-cols-[1.02fr_0.98fr] md:px-8 md:py-10">
        <div className="text-white">
          <h2 className="max-w-[560px] font-['Quicksand'] text-[2.05rem] font-bold leading-[0.98] tracking-[-0.04em] md:text-[3.45rem]">
            Validation Services
            <br />
            That <span className="text-[#3a8ac8]">Deliver Verified</span>
            <br />
            <span className="text-[#3a8ac8]">Performance</span>
          </h2>
          <p className="mt-4 max-w-[530px] text-[0.84rem] leading-6 text-white/80 md:mt-5 md:text-[0.98rem]">
            We don&apos;t just confirm functionality. We establish measurable, defensible performance benchmarks that support confident research, regulatory readiness, and long-term scalability.
          </p>
          <ul className="mt-5 space-y-2.5 md:mt-6">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[0.82rem] md:text-[0.94rem]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#5bb8de]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-[22px]">
          <Image
            src="/images/validation%20services/9.png"
            alt="Validated assay process"
            width={1200}
            height={900}
            className="h-full w-full object-cover object-[58%_50%]"
          />
        </div>
      </div>
    </section>
  );
}
