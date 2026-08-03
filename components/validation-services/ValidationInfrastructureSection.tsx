import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

const strengths = [
  "Defending your data",
  "Protecting your inspection outcomes",
  "Safeguarding patient reporting confidence",
  "Protecting months of staff time and reagent investment",
];

const risks = [
  "Studies vary by operator",
  "Documentation gaps appear during inspection",
  "Key parameters must be repeated",
  "Time and reagents are lost",
];

export default function ValidationInfrastructureSection() {
  return (
    <section
      className="relative overflow-hidden bg-[#f4f8fc] px-4 py-10 md:px-6 md:py-14"
      style={{
        backgroundImage: `url("/images/validation%20services/bg2.jpeg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,248,252,0.92)_0%,rgba(244,248,252,0.72)_100%)]" />
      <div className="relative mx-auto max-w-[1440px]">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="relative overflow-hidden rounded-[28px] shadow-[0_24px_48px_rgba(14,34,72,0.12)]">
            <Image
              src="/images/validation%20services/8.png"
              alt="Laboratory research"
              width={900}
              height={860}
              className="h-full w-full object-cover object-[52%_50%]"
            />
          </div>

          <div className="text-[#16345f]">
            <h2 className="max-w-[610px] font-['Quicksand'] text-[2.05rem] font-bold leading-[0.98] tracking-[-0.04em] md:text-[3.45rem]">
              Validation isn&apos;t a formality.{" "}
              <span className="text-[#3989c7]">It&apos;s infrastructure.</span>
            </h2>

            <p className="mt-5 max-w-[500px] text-[0.84rem] leading-6 text-[#53657c] md:mt-6 md:text-[1rem]">
              It defines the standard your laboratory operates within today and as you scale.
            </p>

            <div className="mt-7 md:mt-9">
              <p className="text-[1.15rem] font-bold md:text-[1.55rem]">You&apos;re</p>
              <ul className="mt-4 space-y-2.5">
                {strengths.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[0.84rem] font-medium text-[#3d4f69] md:text-[0.98rem]"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#3a8ac8]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-7 md:mt-8">
              <h3 className="text-[1.08rem] font-bold text-[#16345f] md:text-[1.45rem]">
                Without structured validation design
              </h3>
              <ul className="mt-4 space-y-2.5">
                {risks.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[0.84rem] font-medium text-[#3d4f69] md:text-[0.98rem]"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#3a8ac8]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-5xl text-center text-[0.72rem] font-semibold tracking-[0.16em] text-[#173863] md:mt-12 md:text-[0.9rem]">
          BIOPATHOGENIX VALIDATION SERVICES ARE BUILT TO ELIMINATE THOSE RISKS BEFORE THEY SURFACE.
        </p>
      </div>
    </section>
  );
}
