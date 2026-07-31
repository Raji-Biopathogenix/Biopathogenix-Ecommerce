"use client";

import BrandColumn from "./BrandColumn";
import FooterContact from "./FooterContact";
import HelpfulLinksColumn from "./HelpfulLinksColumn";
import ProjectsColumn from "./ProjectsColumn";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  const HIDE_HEADER_ROUTES = ["/print"];
  const hideHeader = HIDE_HEADER_ROUTES.some((route) => pathname.includes(route));

  return hideHeader ? null : (
    <footer className="border-t border-[#e5eff9] pt-20 pb-10">
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4">
          <BrandColumn />
          <FooterContact />
          <ProjectsColumn />
          <HelpfulLinksColumn />
        </div>

        <div className="mt-20 flex flex-col items-center justify-between border-t border-[#e5eff9] pt-6 text-[14px] text-[#7a8ca5] md:flex-row">
          <p>{"\u00A9"} 2026 BioPathogenix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
