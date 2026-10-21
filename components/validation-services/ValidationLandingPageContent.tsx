"use client";

import { Poppins } from "next/font/google";
import { useState } from "react";
import ValidationBottomCta from "@/components/validation-services/ValidationBottomCta";
import ValidationContactModal from "@/components/validation-services/ValidationContactModal";
import ValidationDifferenceSection from "@/components/validation-services/ValidationDifferenceSection";
import ValidationInfrastructureSection from "@/components/validation-services/ValidationInfrastructureSection";
import ValidationLandingHero from "@/components/validation-services/ValidationLandingHero";
import ValidationPartnersSection from "@/components/validation-services/ValidationPartnersSection";
import ValidationPerformanceSection from "@/components/validation-services/ValidationPerformanceSection";
import ValidationSuccessfulSection from "@/components/validation-services/ValidationSuccessfulSection";
import ValidationTestimonialsSection from "@/components/validation-services/ValidationTestimonialsSection";
import styles from "./ValidationPage.module.css";
import { HexClipDefs } from "./ValidationUi";

// The Figma design's typeface.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export default function ValidationLandingPageContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <HexClipDefs />
      <main className={`${poppins.className} ${styles.page}`}>
        <ValidationLandingHero onOpenForm={() => setIsFormOpen(true)} />
        <ValidationSuccessfulSection onOpenForm={() => setIsFormOpen(true)} />
        <ValidationInfrastructureSection />
        <ValidationDifferenceSection />
        <ValidationPerformanceSection />
        <ValidationPartnersSection />
        <ValidationTestimonialsSection />
        <ValidationBottomCta onOpenForm={() => setIsFormOpen(true)} />
      </main>
      <ValidationContactModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
    </>
  );
}
