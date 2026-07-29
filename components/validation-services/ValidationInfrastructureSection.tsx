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
    <section className="bg-[#f2f4f6] py-12 md:py-20">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="grid items-start gap-12 md:grid-cols-2">
          <div className="relative order-2 md:order-1">
            <div className="overflow-hidden rounded-3xl shadow-sm md:h-[520px]">
              <Image
                src="/images/validation%20services/Contrived-Sample-1000x667.jpg"
                alt="Laboratory research"
                width={800}
                height={600}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="order-1 text-[#123669] md:order-2">
            <h2 className="font-['Quicksand'] text-4xl font-bold leading-tight md:text-6xl">
              Validation isn&#39;t a formality. <span className="text-[#3d7ec2]">It&#39;s infrastructure.</span>
            </h2>

            <p className="mt-6 text-lg leading-relaxed md:max-w-md">
              It defines the standard your laboratory operates within—today and as you scale.
            </p>

            <div className="mt-10">
              <p className="text-2xl font-bold">You&#39;re</p>
              <ul className="mt-4 space-y-3">
                {strengths.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-base font-medium">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#3d7ec2]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-10">
              <h3 className="text-2xl font-bold">Without structured validation design</h3>
              <ul className="mt-4 space-y-3">
                {risks.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-base font-medium">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-[#3d7ec2]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 rounded-xl bg-[#0f2a4d] px-8 py-6 text-center shadow-lg">
          <p className="text-sm font-bold uppercase tracking-widest text-white md:text-lg">
            BIOPATHOGENIX VALIDATION SERVICES ARE BUILT TO ELIMINATE THOSE RISKS BEFORE THEY SURFACE.
          </p>
        </div>
      </div>
    </section>
  );
}
