"use client";
import { LandingPageType } from "@/types/header";
import { useRouter } from "next/navigation";

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
  const image = result?.images?.[0];
  const btnUrl = result?.contexts?.[0]?.btn_url || "#";

  return (
    <section className="w-full overflow-hidden bg-[#f4f9fc] py-14">
      <div className="flex flex-col md:flex-row md:items-stretch">
        {/* LEFT — large image (admin uploaded) */}
        <div className="w-full flex-shrink-0 md:w-1/2">
          {image?.image && (
            <img
              src={image.image}
              alt={image.alt_text || "Scientist working with a microscope"}
              className="h-[320px] w-full object-cover md:h-full md:min-h-[520px]"
            />
          )}
        </div>

        {/* RIGHT — static text + admin-controlled button link */}
        <div className="w-full px-6 py-10 md:w-1/2 md:px-14 md:py-16">
          <h2 className="mb-5 font-['Quicksand'] text-[2rem] font-bold leading-tight text-[#0d1f3c] md:text-[2.4rem]">
            Supporting the <span className="text-[#3ab5d0]">Scientific Community</span>
          </h2>

          <p className="mb-6 max-w-[520px] text-[0.98rem] leading-relaxed text-[#3a5070]">
            BioPathogenix shares insights and educational resources designed to support researchers
            working with PCR technologies and pathogen research.
          </p>

          <p className="mb-4 font-bold text-[#0d1f3c]">Our learning resources explore topics such as:</p>

          <ul className="mb-8 flex flex-col gap-3">
            {TOPICS.map((topic) => (
              <li key={topic} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-[#3a5070]">
                <CheckIcon />
                <span>{topic}</span>
              </li>
            ))}
          </ul>

          <button
            className="inline-flex items-center gap-4 rounded-lg bg-[#0d2a4e] px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#173d69]"
            onClick={() => router.push(btnUrl)}
          >
            Explore QC &amp; Validation Solutions
            <span className="border-l border-white/30 pl-4">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
