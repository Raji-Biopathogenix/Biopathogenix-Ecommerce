"use client";
import { LandingPageType } from "@/types/header";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";


interface SupportCommunityprops{
  result: LandingPageType
}


export default function SupportingScientificCommunity({result}:SupportCommunityprops) {
  const router = useRouter();

  return (
    <section className="w-full bg-white py-14 px-5">
      <div className="flex flex-col md:flex-row items-center gap-12">

        {/* LEFT — large image */}
        <div className="w-full md:w-1/2 flex-shrink-0">
        {result?.images?.[0]?.image &&  <img
            src={result?.images?.[0]?.image}
            alt="Scientists in lab"
            className="w-full h-[460px] object-cover rounded-2xl"
          />}
        </div>

        {/* RIGHT — text */}
        <div className="w-full md:w-1/2">
          <h2 className="text-[1.9rem] font-bold text-[#0d1f3c] leading-snug mb-4">
            {result?.contexts?.[0]?.title || "Supporting the Scientific Community"}
          </h2>

        <div className="cms-content">
          {result?.contexts?.[0]?.short_description && <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result?.contexts?.[0]?.short_description) }} />}
          {result?.contexts?.[0]?.description && <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result?.contexts?.[0]?.description) }} />}
        </div>
            {/* <svg className="w-5 h-5 flex-shrink-0 text-[#3ab5d0]" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg> */}
         

          <button className="px-6 py-3 bg-[#0d1f3c] hover:bg-[#1a3560] text-white text-[0.9rem] font-semibold rounded-lg transition-colors" onClick={()=> router.push(result?.contexts?.[0]?.btn_url || "#")}>
            {result?.contexts?.[0]?.btn_text || "Visit the Learning Center →"}
          </button>
        </div>

      </div>
    </section>
  );
}