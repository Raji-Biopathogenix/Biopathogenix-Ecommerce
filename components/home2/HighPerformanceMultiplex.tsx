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
    <section className="relative py-8 md:py-10">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-4 lg:px-6">
        <div className="relative min-h-[460px] overflow-hidden rounded-[22px] bg-[#090b35] sm:min-h-[500px] md:min-h-[560px] lg:min-h-[620px] lg:rounded-[30px]">

          {/* Background */}
          <img
            src="/images/home/high-perform.png"
            alt=""
            className="absolute inset-0 block h-full w-full object-contain object-left md:object-left"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#07092d]/20 via-[#07092d]/58 to-[#060720]/88" />

          {/* Content */}
          <div className="relative z-10 flex h-full items-center py-6 sm:py-8 md:py-10">
            <div className="ml-auto w-full px-4 sm:px-6 md:mr-[4%] md:w-[56%] md:px-0 lg:w-[48%]">

              <h2 className="font-['Quicksand'] text-[30px] font-bold leading-[0.98] tracking-[-0.02em] !text-[#92DAFF] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] sm:text-[38px] lg:text-[50px]">
                High Performance
                <br />
                Multiplex qPCR
              </h2>

              <h3 className="mt-2 font-['Quicksand'] text-[24px] font-medium leading-[1.08] tracking-[-0.02em] !text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-[32px] lg:text-[44px]">
                Workflows Designed for
                <br />
                Modern Laboratories
              </h3>

              <p className="mt-4 text-[14px] leading-[1.65] !text-white sm:text-[15px] lg:text-[16px]">
                BioPathogenix delivers integrated molecular solutions that empower
                laboratories working in pathogen research, molecular detection,
                and nucleic acid analysis.
              </p>

              <h4 className="mt-5 text-[18px] font-semibold !text-[#D6EEFF] sm:text-[20px] lg:text-[22px]">
                Our teams work directly with scientists to develop
              </h4>

              <ul className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3.5 lg:space-y-4">
                {CHECKLIST.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-[14px] leading-[1.45] !text-white sm:gap-3 sm:text-[16px] lg:text-[17px]"
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