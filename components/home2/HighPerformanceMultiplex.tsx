const CHECKLIST = [
  "Multiplex qPCR assays",
  "DNA and RNA extraction workflows",
  "Laboratory validation and quality controls",
  "Every solution is designed to support reliable workflows and adaptable research environments.",
];

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#38b6cf]">
      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

export default function HighPerformanceMultiplex() {
  return (
    <section className="overflow-hidden bg-[#0a1c3f]">
      <div className="mx-auto grid max-w-[1360px] grid-cols-1 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative min-h-[300px] overflow-hidden bg-[#0f2651] px-8 py-12 lg:min-h-[520px] lg:px-12 lg:py-16">
          <div className="absolute inset-0 opacity-90">
            <img
              src="/images/home/dna1.png"
              alt=""
              aria-hidden="true"
              className="h-full w-full object-cover object-left"
            />
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,28,63,0.92)_0%,rgba(10,28,63,0.72)_48%,rgba(10,28,63,0.2)_100%)]" />
        </div>

        <div className="px-8 py-12 text-white lg:px-12 lg:py-16">
          <h2 className="font-['Poppins'] text-[2.05rem] font-semibold leading-[1.12] tracking-[-0.03em] text-[#5fc3dd] md:text-[2.35rem]">
            High Performance Multiplex qPCR
          </h2>
          <h3 className="mt-2 max-w-[640px] font-['Poppins'] text-[1.55rem] font-semibold leading-tight text-white md:text-[1.95rem]">
            Workflows Designed for Modern Laboratories
          </h3>

          <p className="mt-5 max-w-[620px] text-[0.98rem] leading-[1.8] text-white/80">
            BioPathogenix delivers integrated molecular solutions that empower laboratories
            working in pathogen research, molecular detection, and nucleic acid analysis.
          </p>

          <p className="mt-6 font-semibold text-white">Our teams work directly with scientists to develop</p>

          <ul className="mt-5 flex flex-col gap-3">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-white/88">
                <CheckIcon />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
