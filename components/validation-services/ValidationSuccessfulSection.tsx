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
    <section className="bg-[#f4f8fc] px-4 py-3 md:px-6 md:py-6">
      <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[28px] bg-[#0a1d3d] shadow-[0_24px_60px_rgba(10,29,61,0.18)]">
        <Image
          src="/images/validation%20services/7.png"
          alt=""
          fill
          className="object-cover object-[70%_50%] opacity-95"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,15,36,0.98)_0%,rgba(4,15,36,0.92)_38%,rgba(4,15,36,0.66)_68%,rgba(4,15,36,0.24)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(116,169,220,0.18)_0,rgba(116,169,220,0.06)_18%,rgba(4,15,36,0)_42%)]" />

        <div className="relative flex min-h-[640px] flex-col justify-between px-6 py-8 md:px-10 md:py-10">
          <div className="flex items-start justify-between gap-6">
            <div className="max-w-[540px] text-white">
              <h2 className="font-['Quicksand'] text-[2.15rem] font-bold leading-[0.95] tracking-[-0.03em] md:text-[3.4rem]">
                What a <span className="text-[#50a7d7]">Successful</span>
                <br />
                <span className="text-[#50a7d7]">Validation</span> Looks Like
              </h2>
              <p className="mt-4 max-w-xl text-[0.85rem] leading-6 text-white/76 md:mt-5 md:text-[1rem]">
                Let&apos;s be honest. Validation is rarely just another project on the bench.
              </p>
            </div>
          </div>

          <div className="max-w-[640px] pb-2 text-white">
            <h3 className="font-['Quicksand'] text-[2.1rem] font-bold leading-none md:text-[3.25rem]">
              It carries pressure.
            </h3>
            <ul className="mt-5 space-y-2.5 md:mt-7 md:space-y-3">
              {pressurePoints.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[0.82rem] text-white/92 md:text-[0.98rem]">
                  <CheckDot />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
