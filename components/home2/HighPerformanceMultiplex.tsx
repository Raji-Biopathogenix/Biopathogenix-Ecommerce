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
    <section className="relative py-16">
      <div className="mx-auto max-w-full px-4 lg:px-0">
        <div className="relative overflow-hidden rounded-[34px]">

          {/* Background */}
          <img
            src="/images/home/high-perform.png"
            alt=""
            className="h-auto w-full object-cover"
          />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="ml-auto mr-[4%] w-[44%]">

              <h2 className="font-['Quicksand'] text-[58px] font-bold leading-[0.92] tracking-[-0.03em] text-[#56B7EA]">
                High Performance
                <br />
                Multiplex qPCR
              </h2>

              <h3 className="mt-2 font-['Quicksand'] text-[54px] font-medium leading-[1.02] tracking-[-0.03em] text-white">
                Workflows Designed for
                <br />
                Modern Laboratories
              </h3>

              <p className="mt-7 text-[16px] leading-[1.75] text-white/75">
                BioPathogenix delivers integrated molecular solutions that empower
                laboratories working in pathogen research, molecular detection,
                and nucleic acid analysis.
              </p>

              <h4 className="mt-8 text-[22px] font-semibold text-white">
                Our teams work directly with scientists to develop
              </h4>

              <ul className="mt-6 space-y-4">
                {CHECKLIST.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[17px] leading-[1.5] text-white/75"
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