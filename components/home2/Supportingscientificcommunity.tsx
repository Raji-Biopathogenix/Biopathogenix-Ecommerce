"use client";

import { useRouter } from "next/navigation";
import { LandingPageType } from "@/types/header";

interface SupportCommunityprops {
  result?: LandingPageType;
}

const TOPICS = [
  "PCR assay design principles",
  "Emerging pathogen research",
  "Nucleic acid extraction strategies",
  "Advances and achievements in multiplex qPCR technologies",
];

const DOT_PATTERN_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='320' viewBox='0 0 220 320'%3E%3Cpath d='M40 0C90 40 10 80 60 120C110 160 30 200 80 240C130 280 50 300 100 320' fill='none' stroke='%23bfe0ee' stroke-width='2'/%3E%3Cpath d='M90 0C140 40 60 80 110 120C160 160 80 200 130 240C180 280 100 300 150 320' fill='none' stroke='%23bfe0ee' stroke-width='2'/%3E%3Ccircle cx='40' cy='0' r='4' fill='%237fc4de'/%3E%3Ccircle cx='60' cy='120' r='4' fill='%237fc4de'/%3E%3Ccircle cx='80' cy='240' r='4' fill='%237fc4de'/%3E%3Ccircle cx='90' cy='0' r='4' fill='%237fc4de'/%3E%3Ccircle cx='110' cy='120' r='4' fill='%237fc4de'/%3E%3Ccircle cx='130' cy='240' r='4' fill='%237fc4de'/%3E%3C/svg%3E";

function CheckIcon() {
  return (
    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#0d63c9]">
      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

export default function SupportingScientificCommunity({ result }: SupportCommunityprops) {
  const router = useRouter();
  const btnUrl = result?.contexts?.[0]?.btn_url || "#";

  return (
    <section className="bg-white px-6 py-14 md:px-14 md:py-16">
      <div className="mx-auto grid max-w-[1360px] grid-cols-1 overflow-hidden rounded-[28px] shadow-[0_20px_50px_rgba(13,31,60,0.08)] md:grid-cols-2 md:items-stretch">
        <div className="h-[320px] md:h-auto">
          <img
            src="/fig-preview/images/0377cb72fc5481097071d3d22006c7e168cb930b"
            alt="Researchers in a laboratory setting"
            className="h-full w-full object-cover"
          />
        </div>

        <div
          className="relative flex flex-col justify-center overflow-hidden bg-[#eaf5f9] px-6 py-12 md:px-14 md:py-16"
          style={{ backgroundImage: `url("${DOT_PATTERN_BG}")`, backgroundPosition: "right -20px top", backgroundRepeat: "no-repeat" }}
        >
          <h2 className="relative font-['Quicksand'] text-[2rem] font-bold leading-tight tracking-[-0.02em] text-[#102447] md:text-[2.55rem]">
            Supporting the <span className="text-[#3ab5d0]">Scientific Community</span>
          </h2>

          <p className="relative mt-5 max-w-[560px] text-[0.98rem] leading-relaxed text-[#3a5070]">
            BioPathogenix shares insights and educational resources designed to support researchers
            working with PCR technologies and pathogen research.
          </p>

          <p className="relative mt-5 font-semibold text-[#102447]">Our learning resources explore topics such as:</p>

          <ul className="relative mt-5 flex flex-col gap-3">
            {TOPICS.map((topic) => (
              <li key={topic} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-[#3a5070]">
                <CheckIcon />
                <span>{topic}</span>
              </li>
            ))}
          </ul>

          <button
            className="relative mt-8 inline-flex w-fit items-center gap-4 rounded-[12px] bg-[#173864] px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#102b4f]"
            onClick={() => router.push(btnUrl)}
          >
            Explore QC &amp; Validation Solutions
            <span className="border-l border-white/30 pl-4">-&gt;</span>
          </button>
        </div>
      </div>
    </section>
  );
}
