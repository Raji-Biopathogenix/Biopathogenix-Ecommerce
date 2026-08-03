"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const GRADIENT_BG =
  "linear-gradient(135deg, #05081E 0%, #081E57 55%, #0B3185 100%)";

function DnaHelix() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="absolute h-[70%] w-[70%] rounded-full bg-[#5EA8FF]/20 blur-[80px]" />
        <svg
          viewBox="0 0 200 420"
          className="relative h-full w-auto max-w-full opacity-90"
          fill="none"
        >
          <path
            d="M40 10C40 60 160 60 160 110C160 160 40 160 40 210C40 260 160 260 160 310C160 360 40 360 40 410"
            stroke="url(#dnaGradient)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M160 10C160 60 40 60 40 110C40 160 160 160 160 210C160 260 40 260 40 310C40 360 160 360 160 410"
            stroke="url(#dnaGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.6"
          />
          <defs>
            <linearGradient id="dnaGradient" x1="0" y1="0" x2="0" y2="420" gradientUnits="userSpaceOnUse">
              <stop stopColor="#8FD3FF" />
              <stop offset="1" stopColor="#5EA8FF" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  return (
    <motion.img
      src="/dna.png"
      alt="3D rendered glass DNA helix"
      className="h-full w-full object-contain drop-shadow-[0_40px_70px_rgba(94,168,255,0.35)]"
      onError={() => setFailed(true)}
      animate={{ y: [0, -18, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function HeroSection() {
  return (
    <section className="w-full bg-[#05081E] px-4 py-10 sm:px-6 lg:px-10">
      <div
        className="relative mx-auto max-w-[1500px] overflow-hidden rounded-[32px]"
        style={{ background: GRADIENT_BG }}
      >
        <motion.div
          className="pointer-events-none absolute -left-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#5EA8FF]/25 blur-[130px]"
          animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-[#0B3185]/60 blur-[130px]"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-white/10" />

        <div className="relative grid grid-cols-1 gap-14 px-6 py-16 sm:px-10 sm:py-20 md:px-16 lg:grid-cols-[55%_45%] lg:items-center lg:px-[100px] lg:py-24">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-block text-[0.8rem] font-semibold uppercase tracking-[0.32em] text-[#5EA8FF]"
            >
              Standard Assays
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="mt-6 font-['Poppins'] text-[2.5rem] font-semibold leading-[1.14] tracking-[-0.02em] sm:text-[3.1rem] lg:text-[3.75rem]"
            >
              <span className="bg-gradient-to-r from-[#8FD3FF] to-[#5EA8FF] bg-clip-text text-transparent">
                Confident Validation
              </span>
              <br />
              <span className="text-white">Starts With Structured</span>
              <br />
              <span className="text-white">Design</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-6 max-w-[520px] text-[1.05rem] leading-relaxed text-[#C9D2EA]"
            >
              Schedule a consultation and see how BioPathogenix transforms validation from
              risk into readiness.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.45 }}
              className="mt-10"
            >
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-[1rem] font-semibold text-[#081E57] shadow-[0_16px_40px_rgba(94,168,255,0.25)] transition-shadow duration-300 hover:shadow-[0_20px_54px_rgba(94,168,255,0.4)]"
              >
                Schedule a Consultation
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="relative mx-auto flex h-[340px] w-full max-w-[560px] items-center justify-center sm:h-[440px] lg:h-[620px] lg:max-w-none"
          >
            <DnaHelix />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
