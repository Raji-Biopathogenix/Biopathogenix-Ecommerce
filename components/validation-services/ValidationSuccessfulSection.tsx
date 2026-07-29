import { Check } from "lucide-react";
import Image from "next/image";

const pressurePoints = [
  "Pressure to launch on time.",
  "Pressure to satisfy inspection standards.",
  "Pressure to protect your laboratory's credibility.",
  "Pressure to ensure every data point can stand up to scrutiny.",
];

function CheckDot() {
  return (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3d7ec2]">
      <Check className="h-3 w-3 text-white" strokeWidth={3} />
    </span>
  );
}

export default function ValidationSuccessfulSection() {
  return (
    <section className="relative w-full overflow-hidden">
      <Image
        src="/images/validation%20services/Blog-Placeholder-Image-1.jpg"
        alt=""
        width={1600}
        height={900}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1830] from-35% via-[#0a1830]/75 via-60% to-[#0a1830]/15" />

      <div className="relative flex min-h-[60vh] flex-col justify-center gap-14 px-6 py-14 md:min-h-[65vh] md:px-14">
        <div className="max-w-2xl text-white">
          <h2 className="font-['Quicksand'] text-3xl font-bold leading-tight md:text-5xl">
            What a <span className="text-[#5fb8dd]">Successful</span>{" "}
            <span className="text-[#5fb8dd]">Validation</span> Looks Like
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 md:text-xl">
            Let&#39;s be honest. Validation is rarely just another project on the bench.
          </p>
        </div>

        <div className="max-w-md">
          <h3 className="font-['Quicksand'] text-2xl font-bold text-white md:text-4xl">
            It carries pressure.
          </h3>
          <ul className="mt-6 space-y-3">
            {pressurePoints.map((item) => (
              <li key={item} className="flex items-start gap-3 text-base text-white/90 md:text-lg">
                <CheckDot />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
