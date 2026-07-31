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
    <section className="overflow-hidden bg-[#f4f9fc] py-0">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="min-h-[320px] md:min-h-[560px]">
          <img
            src="/fig-preview/images/0377cb72fc5481097071d3d22006c7e168cb930b"
            alt="Researchers in a laboratory setting"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="px-6 py-12 md:px-14 md:py-16">
          <h2 className="font-['Poppins'] text-[2rem] font-semibold leading-tight tracking-[-0.03em] text-[#102447] md:text-[2.55rem]">
            Supporting the <span className="text-[#3ab5d0]">Scientific Community</span>
          </h2>

          <p className="mt-5 max-w-[560px] text-[0.98rem] leading-relaxed text-[#3a5070]">
            BioPathogenix shares insights and educational resources designed to support researchers
            working with PCR technologies and pathogen research.
          </p>

          <p className="mt-5 font-semibold text-[#102447]">Our learning resources explore topics such as:</p>

          <ul className="mt-5 flex flex-col gap-3">
            {TOPICS.map((topic) => (
              <li key={topic} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-[#3a5070]">
                <CheckIcon />
                <span>{topic}</span>
              </li>
            ))}
          </ul>

          <button
            className="mt-8 inline-flex items-center gap-4 rounded-[12px] bg-[#173864] px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#102b4f]"
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
