const CHECKLIST = [
  "Multiplex qPCR assays",
  "DNA and RNA extraction workflows",
  "Laboratory validation and quality controls",
  "Every solution is designed to support reliable workflows and adaptable research environments.",
];

function CheckIcon() {
  return (
    <span className="mt-[3px] flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-[#38B6CF] lg:h-[16px] lg:w-[16px]">
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

// Sized on the 1440-wide Figma frame: the card is full width and 855px tall,
// the copy column starts at x 722 and is 580px wide.
export default function HighPerformanceMultiplex() {
  return (
    <section data-home="dna" className="relative pb-8 pt-16 md:pb-10 md:pt-24 lg:pt-36">
      <div className="mx-auto w-full px-3 sm:px-4 lg:px-0">
        <div data-home="dna-frame" className="relative flex min-h-[460px] items-center overflow-hidden rounded-[22px] bg-[#090b35] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[855px] lg:rounded-[40px]">

          {/* Background: the DNA image covers the left of the card and fades into the card colour,
              so there is no visible edge where the image ends. */}
          <img
            src="/images/home/high-perform.png"
            alt=""
            className="absolute inset-y-0 left-0 block h-full w-[24%] object-cover object-[18%_center] md:w-[60%] md:object-left"
          />

          <div className="absolute inset-y-0 left-0 w-[25%] bg-gradient-to-r from-transparent via-[#090b35]/20 to-[#090b35] md:hidden" />
          <div className="absolute inset-y-0 left-0 hidden w-[60%] bg-gradient-to-r from-transparent from-50% to-[#090b35] md:block" />

          {/* Content */}
          <div data-home="dna-content" className="relative z-10 flex h-full w-full items-center py-6 sm:py-8 md:py-10 lg:py-[110px]">
            <div data-home="dna-copy" className="relative ml-auto w-[76%] min-w-0 pl-2 pr-4 sm:pl-3 sm:pr-6 md:mr-[6%] md:w-[52%] md:px-0 lg:ml-[50.14%] lg:mr-0 lg:w-[43%] lg:max-w-[620px]">

              <h2 className="font-['Quicksand'] text-[clamp(20px,5.2vw,30px)] font-bold leading-[1.08] tracking-[-0.02em] !text-[#92DAFF] drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)] sm:text-[38px] md:leading-[1.05] lg:text-[54px]">
                High Performance
                <br />
                Multiplex qPCR
              </h2>

              <h3 className="font-['Quicksand'] text-[clamp(18px,4.5vw,26px)] font-medium leading-[1.15] tracking-[-0.02em] !text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] sm:text-[32px] md:leading-[1.05] lg:text-[54px]">
                Workflows Designed for
                <br />
                Modern Laboratories
              </h3>

              <p className="mt-4 max-w-[580px] text-[13px] leading-[1.65] !text-white/85 sm:text-[15px] lg:mt-6 lg:text-[15px]">
                BioPathogenix delivers integrated molecular solutions that empower
                laboratories working in pathogen research, molecular detection,
                and nucleic acid analysis.
              </p>

              <h4 data-home="team-heading" className="mt-5 text-[15px] font-semibold leading-snug !text-white sm:text-[18px] lg:mt-8 lg:text-[18px]">
                Our teams work directly with scientists to develop
              </h4>

              <ul className="mt-4 max-w-[580px] space-y-2.5 sm:mt-5 sm:space-y-3">
                {CHECKLIST.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-[13px] leading-[1.5] !text-white/90 sm:gap-3 sm:text-[15px]"
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
