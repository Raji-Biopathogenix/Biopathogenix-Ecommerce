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
    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#38B6CF] md:h-6 md:w-6">
      <svg
        className="h-3 w-3 text-white md:h-3.5 md:w-3.5"
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

export default function SupportingScientificCommunity({
  result,
}: SupportCommunityprops) {
  const router = useRouter();

  const btnUrl = result?.contexts?.[0]?.btn_url || "#";

  return (
    <section className="bg-white pt-10 md:pt-16 lg:pt-20">
      <div className="mx-auto w-full px-4 sm:px-5 lg:px-0">
        {/* Main Card */}
        <div
          className="relative overflow-hidden rounded-[24px] md:rounded-[32px] lg:rounded-[38px]"
          style={{
            backgroundImage: 'url("/images/home/supporting-bg.png")',
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            backgroundSize: "cover",
          }}
        >
          {/* Optional Light Overlay */}
          <div className="absolute inset-0 bg-white/20" />

          <div className="relative grid grid-cols-1 lg:grid-cols-[47%_53%]">
            {/* LEFT IMAGE */}
            <div className="p-3 md:p-5 lg:p-0">
              <div className="overflow-hidden rounded-[24px] md:rounded-[30px] lg:rounded-[34px] shadow-[0_25px_60px_rgba(23,57,99,0.12)] h-full">
                <img
                  src="/fig-preview/images/0377cb72fc5481097071d3d22006c7e168cb930c"
                  alt="Scientific Community"
                  className="h-[220px] w-full object-cover sm:h-[350px] md:h-[450px] lg:h-full"
                />
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="flex items-center px-4 py-7 sm:px-8 sm:py-10 md:px-10 md:py-12 lg:px-16">
              <div className="max-w-[610px]">
                <h2 className="font-['Quicksand'] text-[30px] font-bold leading-[1] tracking-[-1px] text-[#173963] sm:text-[38px] md:text-[48px] lg:text-[60px] lg:tracking-[-2px]">
                  Supporting the
                  <br />
                  <span className="text-[#49A9E6]">Scientific</span>
                  <br />
                  <span className="text-[#49A9E6]">Community</span>
                </h2>

                <p className="mt-4 max-w-[560px] text-[14px] leading-[1.65] text-[#475467] sm:text-[16px] md:mt-6 md:text-[17px] lg:mt-7 lg:text-[18px]">
                  BioPathogenix shares insights and educational resources
                  designed to support researchers working with PCR technologies
                  and pathogen research.
                </p>

                <h3 className="mt-5 text-[17px] font-semibold text-[#173963] sm:text-[20px] md:mt-7 md:text-[21px] lg:mt-8 lg:text-[22px]">
                  Our learning resources explore topics such as:
                </h3>

                <ul className="mt-4 space-y-2.5 md:mt-6 md:space-y-4 lg:mt-7">
                  {TOPICS.map((topic) => (
                    <li
                      key={topic}
                      className="flex items-start gap-3 text-[14px] leading-[1.45] text-[#344054] sm:text-[16px] md:gap-4 md:text-[17px] lg:text-[18px]"
                    >
                      <CheckIcon />
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => router.push(btnUrl)}
                  className="mt-7 inline-flex h-[48px] items-center rounded-xl bg-[#0E5C97] px-5 text-[14px] font-semibold text-white transition-all duration-300 hover:bg-[#0B4F82] sm:h-[56px] sm:px-7 sm:text-[16px] md:mt-9 lg:mt-10 lg:h-[62px] lg:px-8 lg:text-[18px]"
                >
                  <span>Explore QC &amp; Validation Solutions</span>

                  <span className="ml-4 border-l border-white/30 pl-4 text-[18px] sm:ml-7 sm:pl-7 md:text-[22px] lg:ml-8 lg:pl-8 lg:text-[24px]">
                    →
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}