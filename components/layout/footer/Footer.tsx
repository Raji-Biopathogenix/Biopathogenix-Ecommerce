"use client";

import BrandColumn from "./BrandColumn";
import FooterContact from "./FooterContact";
import HelpfulLinksColumn from "./HelpfulLinksColumn";
import ProjectsColumn from "./ProjectsColumn";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { usePathname } from "next/navigation";

// The Figma footer uses Poppins on every page.
const poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });

export default function Footer() {
  const pathname = usePathname();

  const HIDE_HEADER_ROUTES = ["/print"];
  const hideHeader = HIDE_HEADER_ROUTES.some((route) => pathname.includes(route));

  return hideHeader ? null : (
    // Figma: headings 95px below the section above; copyright row 69px below the tallest
    // column; 36px below the copyright line.
    <footer className={`${poppins.className} bg-white pb-9 pt-[95px] text-[16px] leading-[1.65] tracking-[0.01em] text-[#070707]`}>
      {/* Content is 1240px wide on the 1440 Figma frame (1272 minus the 16px side padding). */}
      <div className="mx-auto max-w-[1272px] px-4">
        {/* Columns start at x101 / 579 / 898 / 1139 of the 1240 row. From 1280px, Helpful Links
            fits its longest link on one line and the others keep those proportions. */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-[38.5484%_25.7258%_19.4355%_minmax(0,1fr)] lg:gap-0 xl:grid-cols-[478fr_319fr_241fr_auto]">
          <BrandColumn />
          <FooterContact />
          <ProjectsColumn />
          <HelpfulLinksColumn />
        </div>

        <div className="mt-[69px] flex flex-col items-center justify-between border-t border-[#e3e7ee] pt-6 md:flex-row">
          <p>{"©"} 2026 BioPathogenix. All rights reserved.</p>
          <p className="mt-2 md:mt-0">
            <Link href="/privacy-policy" className="transition hover:text-[#3e97ce]">Privacy Policy</Link>
            {" | "}
            <Link href="/terms-and-conditions" className="transition hover:text-[#3e97ce]">Terms &amp; Conditions</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
