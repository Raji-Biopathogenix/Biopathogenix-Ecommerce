"use client"
import BrandColumn from "./BrandColumn";
import FooterContact from "./FooterContact";
import HelpfulLinksColumn from "./HelpfulLinksColumn";
import ProjectsColumn from "./ProjectsColumn";
import { usePathname } from 'next/navigation';

export default function Footer() {
    const pathname = usePathname();
  
    const HIDE_HEADER_ROUTES = [
    '/print',
    ];
  
    const hideHeader = HIDE_HEADER_ROUTES.some(route =>
    pathname.includes(route));

    console.log("hideHeader",hideHeader)
  return (
    hideHeader?<></>:
    <footer className=" border-t border-[#e5eff9] pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <BrandColumn />
          <FooterContact />
          <ProjectsColumn />
          <HelpfulLinksColumn />
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#e5eff9] mt-20 pt-6 flex flex-col md:flex-row items-center justify-between text-[14px] text-[#7a8ca5]">
          <p>© 2026 BioPathogenix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
