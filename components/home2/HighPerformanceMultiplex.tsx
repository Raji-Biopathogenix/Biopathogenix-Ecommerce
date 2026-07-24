const CHECKLIST = [
  "Multiplex qPCR assays",
  "DNA and RNA extraction workflows",
  "Laboratory validation, and Quality controls",
  "Every solution is designed to support reliable workflows and adaptable research environments.",
];

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#3ab5d0]">
      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

function DnaHelix() {
  return (
    <svg viewBox="0 0 220 420" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="dnaStroke" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfe6f5" />
          <stop offset="100%" stopColor="#3ab5d0" />
        </linearGradient>
      </defs>
      <path
        d="M40 0 C120 45,20 90,100 135 C180 180,80 225,160 270 C180 300,150 340,110 360 C90 375,60 390,40 420"
        fill="none"
        stroke="url(#dnaStroke)"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M0 20 C80 65,140 90,60 135 C-20 180,140 225,60 270 C40 300,10 340,50 360 C70 375,100 390,120 420"
        fill="none"
        stroke="url(#dnaStroke)"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.55"
      />
      {[30, 75, 120, 165, 210, 255, 300, 340].map((y) => (
        <line key={y} x1="30" y1={y} x2="140" y2={y + 20} stroke="#7fd3e6" strokeWidth="3" opacity="0.5" />
      ))}
    </svg>
  );
}

export default function HighPerformanceMultiplex() {
  return (
    <section className="w-full overflow-hidden bg-[#0a1c3f]">
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-center">
          <div className="h-[260px] w-full md:h-[420px] md:w-2/5">
            <DnaHelix />
          </div>

          <div className="w-full px-8 py-10 md:w-3/5 md:px-4 md:py-16 md:pr-16">
            <h2 className="mb-1 text-[1.8rem] font-bold leading-tight text-[#5fc3dd] md:text-[2.1rem]">
              High Performance Multiplex qPCR
            </h2>
            <h3 className="mb-5 text-[1.5rem] font-semibold leading-tight text-white md:text-[1.8rem]">
              Workflows Designed for Modern Laboratories
            </h3>

            <p className="mb-6 max-w-[560px] text-[0.95rem] leading-relaxed text-white/80">
              BioPathogenix delivers integrated molecular solutions that empowers laboratories working in pathogen research, molecular detection, and nucleic acid analysis.
            </p>

            <p className="mb-4 font-bold text-white">Our teams work directly with scientists to develop</p>

            <ul className="flex flex-col gap-3">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-white/85">
                  <CheckIcon />
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
