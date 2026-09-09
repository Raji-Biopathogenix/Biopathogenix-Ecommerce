const CHECKLIST = [
  "Multiplex qPCR assays",
  "DNA and RNA extraction workflows",
  "Laboratory validation and quality controls",
  "Every solution is designed to support reliable workflows and adaptable research environments.",
];

function CheckIcon() {
  return (
    <span className="mt-[2px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-[#38B6CF] sm:h-[18px] sm:w-[18px]">
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
    <section className="relative py-8 md:py-10">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6">
        <div className="relative min-h-[460px] overflow-hidden rounded-[22px] bg-[#090b35] sm:min-h-[500px] md:min-h-[560px] lg:min-h-[620px] lg:rounded-[30px]">

          {/* Background */}
          <img
            src="/images/home/high-perform.png"
            alt=""
            className="absolute inset-y-0 left-0 block h-full w-[24%] object-cover object-[18%_center] md:inset-0 md:w-full md:object-contain md:object-left"
          />

          <div className="absolute inset-y-0 left-0 w-[25%] bg-gradient-to-r from-transparent via-[#090b35]/20 to-[#090b35] md:hidden" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-[#07092d]/20 via-[#07092d]/58 to-[#060720]/88 md:block" />

          {/* Content */}
          <div className="relative z-10 flex h-full items-center py-6 sm:py-8 md:py-10">
            <div className="relative ml-auto w-[76%] min-w-0 pl-2 pr-4 sm:pl-3 sm:pr-6 md:mr-[4%] md:w-[56%] md:px-0 lg:w-[48%]">

              <h2 className="font-['Quicksand'] text-[clamp(20px,5.2vw,30px)] font-bold leading-[1.08] tracking-[-0.02em] !text-[#92DAFF] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] sm:text-[38px] md:leading-[0.98] lg:text-[50px]">
                High Performance
                <br />
                Multiplex qPCR
              </h2>

              <h3 className="mt-2 font-['Quicksand'] text-[clamp(18px,4.5vw,26px)] font-medium leading-[1.15] tracking-[-0.02em] !text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-[32px] md:leading-[1.08] lg:text-[44px]">
                Workflows Designed for
                <br />
                Modern Laboratories
              </h3>

              <p className="mt-4 text-[13px] leading-[1.65] !text-white sm:text-[15px] lg:text-[16px]">
                BioPathogenix delivers integrated molecular solutions that empower
                laboratories working in pathogen research, molecular detection,
                and nucleic acid analysis.
              </p>

              <h4 className="mt-5 text-[15px] font-semibold leading-snug !text-[#D6EEFF] sm:text-[20px] md:leading-normal lg:text-[22px]">
                Our teams work directly with scientists to develop
              </h4>

              <ul className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3.5 lg:space-y-4">
                {CHECKLIST.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[13px] leading-[1.5] !text-white sm:gap-3 sm:text-[16px] md:leading-[1.45] lg:text-[17px]"
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
