import { AlertCircle, CheckCircle2 } from "lucide-react";
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
          
          {/* Left Column */}
          <div className="text-[#123669]">
            {/* Main Headline - Large and Bold as seen in Image 2 */}
            <h2 className="text-5xl font-bold leading-tight md:text-7xl">
              Validation isn't a <br /> formality. It's <br /> infrastructure.
            </h2>
            
            {/* Sub-headline - Smaller and normal weight */}
            <p className="mt-6 text-lg leading-relaxed md:max-w-md">
              It defines the standard your laboratory operates within—today and as you scale.
            </p>

            {/* Positive Section */}
            <div className="mt-12">
              <p className="text-2xl font-bold">You're</p>
              <ul className="mt-4 space-y-3">
                {strengths.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-base font-medium">
                    <CheckCircle2 className="h-5 w-5 shrink-0" strokeWidth={2} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Negative Section */}
            <div className="mt-12">
              <h3 className="text-2xl font-bold">
                Without structured validation design
              </h3>
              <ul className="mt-4 space-y-3">
                {risks.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-base font-medium">
                    {/* Outline Alert Circle to match the thin-stroke icons in Image 2 */}
                    <AlertCircle className="h-5 w-5 shrink-0" strokeWidth={2} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column - Image */}
          <div className="relative mt-8 md:mt-0">
            <div className="overflow-hidden rounded-3xl shadow-sm">
              <Image
                src="/images/validation%20services/Pipette-Tips-1-1-768x513.jpg"
                alt="Laboratory research"
                width={800}
                height={600}
                className="h-auto w-full object-cover"
                priority
              />
            </div>
          </div>
        </div>

        {/* Full-width Banner */}
        <div className="mt-16 rounded-xl bg-[#0f2a4d] px-8 py-6 text-center shadow-lg">
          <p className="text-sm font-bold uppercase tracking-widest text-white md:text-lg">
            BIOPATHOGENIX VALIDATION SERVICES ARE BUILT TO ELIMINATE THOSE RISKS BEFORE THEY SURFACE.
          </p>
        </div>
      </div>
    </section>
  );
}