const CHECKLIST = [
  "Multiplex qPCR assays",
  "DNA and RNA extraction workflows",
  "Laboratory validation and quality controls",
  "Every solution is designed to support reliable workflows and adaptable research environments.",
];

function CheckIcon() {
  return (
    <span className="mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#38B6CF]">
      <svg
        className="h-[10px] w-[10px] text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

export default function HighPerformanceMultiplex() {
  return (
    <section className="relative py-10 md:py-12">
      <div className="mx-auto max-w-full px-4 lg:px-0">
        <div className="relative overflow-hidden rounded-[26px] lg:rounded-[30px]">

          {/* Background */}
          <img
            src="/images/home/high-perform.png"
            alt=""
            className="h-[560px] w-full object-cover object-left md:h-[620px] lg:h-[680px]"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d3f]/80 via-[#0b0d3f]/50 to-[#0b0d3f]/30 md:from-transparent md:via-[#0b0d3f]/40 md:to-[#070932]/80" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="ml-auto w-full px-6 md:mr-[4%] md:w-[56%] md:px-0 lg:w-[48%]">

              <h2 className="font-['Quicksand'] text-[38px] font-bold leading-[0.96] tracking-[-0.02em] text-[#6EC7F3] sm:text-[44px] lg:text-[50px]">
                High Performance
                <br />
                Multiplex qPCR
              </h2>

              <h3 className="mt-2 font-['Quicksand'] text-[32px] font-medium leading-[1.05] tracking-[-0.02em] text-white sm:text-[38px] lg:text-[44px]">
                Workflows Designed for
                <br />
                Modern Laboratories
              </h3>

              <p className="mt-5 text-[15px] leading-[1.7] text-white/90 lg:text-[16px]">
                BioPathogenix delivers integrated molecular solutions that empower
                laboratories working in pathogen research, molecular detection,
                and nucleic acid analysis.
              </p>

              <h4 className="mt-6 text-[20px] font-semibold text-white lg:text-[22px]">
                Our teams work directly with scientists to develop
              </h4>

              <ul className="mt-5 space-y-3.5 lg:space-y-4">
                {CHECKLIST.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[16px] leading-[1.5] text-white/90 lg:text-[17px]"
                  >
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}