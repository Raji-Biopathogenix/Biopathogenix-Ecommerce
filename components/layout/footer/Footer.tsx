"use client";

import BrandColumn from "./BrandColumn";
import FooterContact from "./FooterContact";
import HelpfulLinksColumn from "./HelpfulLinksColumn";
import ProjectsColumn from "./ProjectsColumn";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  const HIDE_HEADER_ROUTES = ["/print"];
  const hideHeader = HIDE_HEADER_ROUTES.some((route) => pathname.includes(route));

  return hideHeader ? null : (
    <footer className="border-t border-[#dbe7f3] bg-[#f6f9fc] pt-20 pb-10">
      {/* Content is 1240px wide on the 1440 Figma frame (1288 minus the 24px side padding) */}
      <div className="mx-auto max-w-[1288px] px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <BrandColumn />
          <FooterContact />
          <ProjectsColumn />
          <HelpfulLinksColumn />
        </div>

        <div className="mt-16 flex flex-col items-center justify-between border-t border-[#dbe7f3] pt-6 text-[14px] text-[#6c7f98] md:flex-row">
          <p>{"\u00A9"} 2026 BioPathogenix. All rights reserved.</p>
          <p className="mt-2 md:mt-0">
            <Link href="/privacy-policy" className="hover:text-[#173963]">Privacy Policy</Link>
            {" | "}
            <Link href="/terms-and-conditions" className="hover:text-[#173963]">Terms &amp; Conditions</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
