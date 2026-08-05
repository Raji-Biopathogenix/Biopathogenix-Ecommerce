"use client";

import { useRouter } from "next/navigation";
import { LandingPageType } from "@/types/header";

interface PrimaryConversionPathwaysprops {
  result?: LandingPageType;
}

const PATHWAY_CARDS = [
  {
    title: "Split Sample\nTesting Services",
    href: "/split-sample-testing",
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
    href: "/contrived-samples",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#3ab5d0]">
        <path d="M9 2h6M10 2v5.5c0 .6-.2 1.2-.6 1.7L5.8 14a5 5 0 0 0 4 8h4.4a5 5 0 0 0 4-8l-3.6-4.8a2.7 2.7 0 0 1-.6-1.7V2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 15h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Quality Control\nResources",
    href: "/quality-control",
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
    href: "/services/validation-services",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-[#3ab5d0]">
        <path d="M7 3h7l4 4v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M8 18h3.5M15.5 11a2 2 0 0 1 0 4H12l1.5 1.5M8 13h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function PrimaryConversionPathways({ result }: PrimaryConversionPathwaysprops) {
  const router = useRouter();
  const btnUrl = result?.contexts?.[0]?.btn_url || "#";

  return (
    <section
      className="relative bg-transparent overflow-hidden bg-cover bg-center bg-no-repeat px-8 py-13 md:px-12 lg:px-16 lg:py-15"
    >
      <div className="mx-auto flex max-w-[1500px] flex-col items-center gap-20 lg:flex-row lg:items-center lg:justify-between">
        <div className="w-full max-w-[610px]">
          <h2 className="font-['Quicksand'] text-[46px] font-semibold leading-[0.95] tracking-[-0.04em] text-[#173963] lg:text-[60px]">
            Primary{" "}
            <span className="text-[#58A7E8]">
              Conversion
            </span>
            <span className="block text-[#58A7E8]">
              Pathways
            </span>
          </h2>

          <p className="mt-6 max-w-[520px] text-[17px] leading-8 text-[#3a5070]">
            At BioPathogenix, we adhere to stringent quality control processes, ensuring our
            laboratory supplies meet high standards of accuracy, reliability, and workflow
            consistency for researchers working with molecular technologies.
          </p>

          <p className="mt-5 max-w-[520px] text-[17px] leading-8 text-[#3a5070]">
            That same commitment extends beyond our products. BioPathogenix also develops
            tools and resources that help laboratories monitor performance, validate workflows,
            and maintain confidence in their molecular results.
          </p>

          <button
            className="mt-10 inline-flex h-[56px] items-center rounded-lg bg-[#174372] px-8 text-[16px] font-semibold text-white transition-all duration-300 hover:bg-[#12345a]"
            onClick={() => router.push(btnUrl)}
          >
            Explore QC &amp; Validation Solutions
            <span className="ml-6 border-l border-white/30 pl-6 text-xl">
              →
            </span>
          </button>
        </div>

        <div className="grid w-full max-w-[720px] grid-cols-1 gap-6 sm:grid-cols-2">
          {PATHWAY_CARDS.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => router.push(card.href)}
              className="flex h-[220px] flex-col items-center justify-center rounded-[18px] bg-white px-8 text-center shadow-[0_12px_40px_rgba(18,53,92,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_55px_rgba(18,53,92,0.12)]"
            >
              <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#EEF6FC]">
                {card.icon}
              </span>
              <p className="max-w-[180px] whitespace-pre-line text-[22px] font-semibold leading-[1.25] text-[#102447]">
                {card.title}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
