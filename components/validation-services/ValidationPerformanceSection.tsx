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
    <section className="w-full bg-gradient-to-br from-[#0e2248] to-[#060e22] px-5 py-16 md:px-14">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 md:items-center">
        <div className="text-white">
          <h2 className="font-['Quicksand'] text-3xl font-bold leading-tight md:text-5xl">
            Validation Services That <span className="text-[#5fb8dd]">Deliver Verified Performance</span>
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/80 md:text-lg">
            We don&#39;t just confirm functionality- we establish measurable, defensible performance
            benchmarks that support confident research, regulatory readiness, and long-term
            scalability.
          </p>
          <ul className="mt-7 space-y-3">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-3 text-base md:text-lg">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#5fb8dd]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
          <Image
            src="/images/validation%20services/Blog-Placeholder-Image-2.jpg"
            alt="Validated assay process"
            width={1200}
            height={900}
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
