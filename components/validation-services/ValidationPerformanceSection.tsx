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
    <section className="relative bg-[#f2f4f6] py-10 [font-family:'Times_New_Roman',Times,serif]">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[38%] bg-[linear-gradient(120deg,rgba(17,55,100,0.07)_1px,transparent_1px),linear-gradient(0deg,rgba(17,55,100,0.07)_1px,transparent_1px)] bg-[size:52px_56px] md:block" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-2 md:items-center">
        <div className="text-[#123669]">
          <h2 className="text-3xl font-semibold leading-tight text-[#123669] md:text-5xl">
            Validation Services That Deliver Verified Performance
          </h2>
          <p className="mt-7 text-lg font-medium leading-relaxed md:text-xl">
            We don&#39;t just confirm functionality- we establish measurable, defensible performance
            benchmarks that support confident research, regulatory readiness, and long-term
            scalability.
          </p>
          <ul className="mt-8 space-y-3">
            {bullets.map((item) => (
              <li key={item} className="flex items-start gap-2 text-lg md:text-xl">
                <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-[#123669] md:h-8 md:w-8" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-2xl">
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
