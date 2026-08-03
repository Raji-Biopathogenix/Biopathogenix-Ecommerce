import { Check } from "lucide-react";

const leftBullets = ["CLIA", "CAP", "COLA"];

const rightBullets = [
  "Complete full assay validation",
  "Utilize additional reagents provided",
  "Test a limited number of patient samples",
  "Generate revenue to support future assay orders",
];

export default function ValidationDifferenceSection() {
  return (
    <section
      className="relative overflow-hidden bg-[#f4f8fc] px-4 py-10 md:px-6 md:py-14"
      style={{
        backgroundImage: `url("/images/validation%20services/bg2.jpeg")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(244,248,252,0.9)_0%,rgba(244,248,252,0.65)_100%)]" />
      <div className="relative mx-auto max-w-[1440px]">
        <h2 className="max-w-[760px] font-['Quicksand'] text-[2.05rem] font-bold leading-[0.98] tracking-[-0.04em] text-[#16345f] md:text-[3.45rem]">
          What Makes <span className="text-[#3989c7]">BioPathogenix</span> Different
        </h2>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.18fr_0.82fr]">
          <div className="rounded-[28px] bg-[#092354] px-6 py-7 text-white shadow-[0_22px_42px_rgba(9,35,84,0.18)] md:px-8 md:py-8">
            <span className="text-[0.72rem] font-bold tracking-[0.32em] text-[#77c6ec]">01.</span>
            <h3 className="mt-3 max-w-[340px] font-['Quicksand'] text-[1.55rem] font-bold leading-[1.02] md:text-[2.1rem]">
              Built Around Regulatory Expectations
            </h3>
            <p className="mt-4 max-w-[420px] text-[0.82rem] leading-6 text-white/80 md:text-[0.98rem]">
              Many labs only discover documentation gaps when inspectors request specific studies.
            </p>
            <p className="mt-4 text-[0.82rem] font-semibold leading-6 text-white/92 md:text-[0.98rem]">
              Our protocols and reporting templates are built explicitly with:
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {leftBullets.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[0.75rem] font-semibold md:text-[0.9rem]"
                >
                  <Check className="h-4 w-4 text-[#77c6ec]" />
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-6 rounded-[14px] bg-white px-4 py-3 text-[0.78rem] text-[#16345f] md:text-[0.92rem]">
              <span className="font-semibold">The result:</span> Structured, consistent, audit-ready documentation.
            </div>
          </div>

          <div className="rounded-[28px] bg-white px-6 py-7 shadow-[0_22px_42px_rgba(18,53,93,0.12)] md:px-8 md:py-8">
            <span className="text-[0.72rem] font-bold tracking-[0.32em] text-[#7aa9cf]">02.</span>
            <h3 className="mt-3 max-w-[340px] font-['Quicksand'] text-[1.55rem] font-bold leading-[1.02] text-[#16345f] md:text-[2.1rem]">
              Zero Net Loss Validation
            </h3>
            <p className="mt-4 text-[0.82rem] font-semibold leading-6 text-[#16345f] md:text-[0.98rem]">
              A smarter model.
            </p>
            <p className="mt-2 text-[0.82rem] font-semibold leading-6 text-[#16345f] md:text-[0.98rem]">
              Zero Net Loss Validation allows labs to:
            </p>
            <ul className="mt-4 space-y-2.5">
              {rightBullets.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[0.78rem] leading-6 text-[#3d4f69] md:text-[0.94rem]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#3989c7]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[0.82rem] leading-6 text-[#3d4f69] md:text-[0.96rem]">
              Validation becomes a strategic investment, not a sunk cost.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
