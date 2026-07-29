import { ArrowRight } from "lucide-react";

type ValidationBottomCtaProps = {
  onOpenForm: () => void;
};

const HELIX_HEIGHT = 640;
const HELIX_CENTER = 130;
const HELIX_AMPLITUDE = 110;
const HELIX_PERIOD = 190;
const HELIX_STEPS = 90;

function strandPath(phase: number) {
  let d = "";
  for (let i = 0; i <= HELIX_STEPS; i += 1) {
    const y = (HELIX_HEIGHT / HELIX_STEPS) * i;
    const x = HELIX_CENTER + HELIX_AMPLITUDE * Math.sin((y / HELIX_PERIOD) * 2 * Math.PI + phase);
    d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

const RUNG_COUNT = 11;

function DnaHelix() {
  const rungs = Array.from({ length: RUNG_COUNT }).map((_, i) => {
    const y = (HELIX_HEIGHT / (RUNG_COUNT - 1)) * i + 10;
    const x1 = HELIX_CENTER + HELIX_AMPLITUDE * Math.sin((y / HELIX_PERIOD) * 2 * Math.PI);
    const x2 = HELIX_CENTER + HELIX_AMPLITUDE * Math.sin((y / HELIX_PERIOD) * 2 * Math.PI + Math.PI);
    return { y, x1, x2 };
  });

  return (
    <svg
      viewBox={`0 0 260 ${HELIX_HEIGHT}`}
      className="pointer-events-none h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dnaStrandA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#bfe6f7" />
          <stop offset="45%" stopColor="#5fb8dd" />
          <stop offset="100%" stopColor="#2f7fb0" />
        </linearGradient>
        <linearGradient id="dnaStrandB" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#cfe0ee" />
          <stop offset="100%" stopColor="#8ea6c2" />
        </linearGradient>
      </defs>
      {rungs.map((rung, i) => (
        <line
          key={i}
          x1={rung.x1}
          y1={rung.y}
          x2={rung.x2}
          y2={rung.y}
          stroke="#bfe6f7"
          strokeOpacity="0.5"
          strokeWidth="3"
        />
      ))}
      <path d={strandPath(0)} stroke="url(#dnaStrandA)" strokeWidth="9" strokeLinecap="round" />
      <path d={strandPath(Math.PI)} stroke="url(#dnaStrandB)" strokeOpacity="0.85" strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}

export default function ValidationBottomCta({ onOpenForm }: ValidationBottomCtaProps) {
  return (
    <section className="bg-[#f2f4f6] px-4 pb-12 pt-4">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c2049] to-[#050b1d]">
        <div className="pointer-events-none absolute -right-6 -top-10 hidden h-[calc(100%+5rem)] w-[300px] md:block lg:w-[360px]">
          <DnaHelix />
        </div>

        <div className="relative px-8 py-14 text-white md:px-14 md:py-20">
          <span className="text-xs font-bold tracking-[0.22em] text-white md:text-sm">
            STANDARD ASSAYS
          </span>

          <div className="mt-5 flex flex-col items-start gap-3 md:flex-row md:items-end md:gap-8">
            <h2 className="font-['Quicksand'] text-3xl font-bold leading-tight md:text-5xl">
              <span className="text-[#5fb8dd]">Confident Validation</span>
              <br />
              Starts With Structured
              <br />
              Design
            </h2>
            <p className="max-w-xs pb-1 text-sm leading-relaxed text-white/80 md:text-base">
              Schedule a consultation and see how BioPathogenix transforms validation from risk
              into readiness.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenForm}
            className="mt-9 inline-flex items-center gap-3 rounded-lg bg-white px-8 py-3.5 text-sm font-semibold text-[#0c2049] transition-colors hover:bg-[#eef4fb] md:text-base"
          >
            Schedule a Consultation
            <span className="border-l border-[#0c2049]/20 pl-3">
              <ArrowRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
