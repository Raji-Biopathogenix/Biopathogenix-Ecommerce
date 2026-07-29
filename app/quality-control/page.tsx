"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import AvailabilityModal from "@/components/quality-control/AvailabilityModal";

const HEX_PATTERN_BG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='146' viewBox='0 0 84 146'%3E%3Cpath d='M42 0L84 24V96L42 120L0 96V24Z' fill='none' stroke='%23cfe4f2' stroke-width='1'/%3E%3Cpath d='M42 26L84 50V122L42 146L0 122V50Z' fill='none' stroke='%23cfe4f2' stroke-width='1'/%3E%3C/svg%3E";

const cards = [
  {
    title: "Split Sample Testing",
    description:
      "Compare your results with the results of other laboratories by testing the same sample, verifying the accuracy of your tests.",
    image: "/images/quality-control/Split-Sample-Testing.jpg",
    linkText: "Learn More",
    link: "/split-sample-testing",
  },
  {
    title: "BioBank/Contrived Samples",
    description:
      "A control designed to assess the performance of downstream molecular assays.",
    image: "/images/quality-control/Contrived-Sample.jpg",
    linkText: "Shop Now",
    link: "/contrived-samples",
  },
  {
    title: "Quality Control and Validation kits",
    description:
      "Designed to monitor the efficiency and consistency of RNA/DNA extraction from various sample types.",
    image: "/images/quality-control/BPX-Extraction-Controls.jpg",
    linkText: "Shop Now",
    link: "/quality-control-and-validation-kits",
  },
];

export default function QualityControlPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="w-full bg-white">
      {/* ================= HERO SECTION ================= */}
      <section
        className="relative w-full overflow-hidden px-6 py-20 md:px-14 md:py-24"
        style={{
          backgroundImage: `radial-gradient(circle at 68% 22%, rgba(255,255,255,0.98), rgba(235,242,250,0.72) 28%, transparent 58%), radial-gradient(circle at 18% 68%, rgba(255,255,255,0.96), transparent 40%), url("${HEX_PATTERN_BG}"), linear-gradient(135deg,#f7f9fc 0%,#e8eff7 100%)`,
        }}
      >
        <Image
          src="/images/about/Molecular-Diagnostics.webp"
          alt=""
          width={192}
          height={214}
          className="hidden lg:block absolute left-[4%] top-[12%]"
        />
        <Image
          src="/images/about/Protective-Equipment.webp"
          alt=""
          width={120}
          height={134}
          className="hidden lg:block absolute left-[13%] bottom-[10%]"
        />
        <Image
          src="/images/about/Microscope.webp"
          alt=""
          width={120}
          height={134}
          className="hidden lg:block absolute right-[13%] top-[10%]"
        />
        <Image
          src="/images/about/Disease-Testing.webp"
          alt=""
          width={192}
          height={214}
          className="hidden lg:block absolute right-[4%] bottom-[12%]"
        />

        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="font-['Quicksand'] text-[2.6rem] font-bold leading-[1.05] tracking-[-0.02em] text-[#132a52] sm:text-[3.2rem] md:text-[3.6rem]">
            Quality <span className="text-[#3d7ec2]">Control</span>
          </h1>
        </div>
      </section>

      {/* ================= CARDS GRID ================= */}
      <section className="py-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <div
                key={card.title}
                className="rounded-[22px] overflow-hidden bg-[#f3f8fb] flex flex-col hover:shadow-lg transition"
              >
                <div className="relative h-[240px]">
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-col flex-1 px-7 py-8">
                  <h3 className="text-[22px] font-semibold text-[#062a4d] mb-3 leading-snug">
                    {card.title}
                  </h3>

                  <p className="text-[18px] text-[#2c3e50] leading-relaxed mb-6">
                    {card.description}
                  </p>

                  <Link
                    href={card.link}
                    className="mt-auto inline-block text-[15px] font-medium text-[#0a73d8] underline underline-offset-4 hover:text-[#084f9d] transition"
                  >
                    {card.linkText}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CONFIRMATION CTA ================= */}
      <section className="px-6 pb-20 md:px-14">
        <div className="mx-auto max-w-[1200px] rounded-[32px] bg-gradient-to-br from-[#0e2248] to-[#060e22] px-6 py-16 text-center md:px-16">
          <h2 className="font-['Quicksand'] text-[2.2rem] font-bold leading-tight text-white sm:text-[2.8rem] md:text-[3.2rem]">
            Have a Question or
            <br />
            <span className="text-[#5fb8dd]">Need Confirmation?</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-white/75">
            Email our team to confirm feasibility, timelines, or documentation. Every inquiry is
            reviewed internally to ensure expert-level support.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-9 inline-flex items-center gap-4 rounded-lg bg-[#1c3f66] px-8 py-4 text-[1.02rem] font-semibold text-white shadow-[0_16px_28px_rgba(6,14,34,0.4)] transition-colors hover:bg-[#15304f]"
          >
            <span>Confirm Availability by Email</span>
            <span className="border-l border-white/30 pl-3">&rarr;</span>
          </button>
        </div>
      </section>

      <AvailabilityModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </main>
  );
}
