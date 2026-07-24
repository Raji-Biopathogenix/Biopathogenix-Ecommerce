"use client";
import { LandingPageType } from "@/types/header";
import { useRouter } from "next/navigation";

interface PrimaryConversionPathwaysprops {
  result?: LandingPageType;
}

const PATHWAY_CARDS = [
  {
    title: "Split Sample\nTesting Services",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#3ab5d0]">
        <path d="M9 2v6.5L4.5 17a3 3 0 0 0 2.6 4.5h9.8a3 3 0 0 0 2.6-4.5L15 8.5V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 15h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="18.5" cy="18.5" r="4" fill="white" stroke="currentColor" strokeWidth="1.6" />
        <path d="M21.3 21.3 23 23" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "A Biobank offering\nover 1,000 Pathogens",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#3ab5d0]">
        <path d="M9 2h6M10 2v5.5c0 .6-.2 1.2-.6 1.7L5.8 14a5 5 0 0 0 4 8h4.4a5 5 0 0 0 4-8l-3.6-4.8a2.7 2.7 0 0 1-.6-1.7V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 15h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Quality Control\nResources",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#3ab5d0]">
        <circle cx="12" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" />
        <path d="m9 10 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 16.5 7.5 22l4.5-2 4.5 2-1.5-5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Zero Net Loss\nValidation support",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#3ab5d0]">
        <path d="M7 3h7l4 4v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8 18h3.5M15.5 11a2 2 0 0 1 0 4H12l1.5 1.5M8 13h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const PATTERN_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Ccircle cx='20' cy='20' r='16' fill='%23dcedf5'/%3E%3Ccircle cx='100' cy='90' r='22' fill='%23dcedf5'/%3E%3Cline x1='0' y1='120' x2='120' y2='0' stroke='%23cfe4f2' stroke-width='1'/%3E%3C/svg%3E";

export default function PrimaryConversionPathways({ result }: PrimaryConversionPathwaysprops) {
  const router = useRouter();
  const btnUrl = result?.contexts?.[0]?.btn_url || "#";

  return (
    <section
      className="w-full overflow-hidden px-5 py-16 md:px-14"
      style={{ backgroundImage: `linear-gradient(180deg,#f2f9fc 0%,#ffffff 100%), url("${PATTERN_BG}")` }}
    >
      <div className="mx-auto flex max-w-[1280px] flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
        <div className="w-full max-w-[560px]">
          <h2 className="mb-6 text-[2.2rem] font-bold leading-tight text-[#0d1f3c] md:text-[2.6rem]">
            Primary <span className="text-[#3ab5d0]">Conversion Pathways</span>
          </h2>

          <p className="mb-5 text-[1rem] leading-relaxed text-[#3a5070]">
            At BioPathogenix, we adhere to stringent quality control processes, ensuring our
            laboratory supplies meet high standards of accuracy, reliability, and workflow
            consistency for researchers working with molecular technologies.
          </p>

          <p className="mb-8 text-[1rem] leading-relaxed text-[#3a5070]">
            That same commitment extends beyond our products. BioPathogenix also develops
            tools and resources that help laboratories monitor performance, validate workflows,
            and maintain confidence in their molecular results.
          </p>

          <button
            className="inline-flex items-center gap-4 rounded-lg bg-[#0d2a4e] px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#173d69]"
            onClick={() => router.push(btnUrl)}
          >
            Explore QC &amp; Validation Solutions
            <span className="border-l border-white/30 pl-4">→</span>
          </button>
        </div>

        <div className="grid w-full max-w-[620px] grid-cols-1 gap-5 sm:grid-cols-2">
          {PATHWAY_CARDS.map((card, index) => (
            <button
              key={card.title}
              type="button"
              onClick={() => router.push(result?.contexts?.[index + 1]?.btn_url || "#")}
              className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-[0_10px_30px_rgba(13,31,60,0.06)] transition-shadow hover:shadow-[0_14px_36px_rgba(13,31,60,0.12)]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf5f9]">
                {card.icon}
              </span>
              <p className="whitespace-pre-line text-[1.05rem] font-bold leading-snug text-[#0d1f3c]">
                {card.title}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
