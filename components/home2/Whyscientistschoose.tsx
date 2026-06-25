"use client";
import { LandingPageType } from "@/types/header";
import { useRouter } from "next/navigation";
import DOMPurify from "isomorphic-dompurify";


interface PrimaryConversionPathwaysprops{
  result: LandingPageType
}
export default function WhyScientistsChoose({result}:PrimaryConversionPathwaysprops) {
  const router = useRouter();
  const description = result?.contexts?.[0]?.description;

  return (
    <section className="w-full bg-[#eaf5f8] py-14 px-5">
      <div className="flex flex-col md:flex-row items-start gap-10">

        <div className="w-full md:w-1/2 flex flex-col gap-5">

         { result?.images?.[0]?.image && <img
            src={ result?.images?.[0]?.image}
            alt="Lab microscope"
            className="w-full h-[280px] object-cover rounded-2xl"
          />}

          <h2 className="text-[1.9rem] font-bold text-[#0d1f3c] leading-snug">
            {result?.contexts?.[0]?.title || "Why Scientists Choose BioPathogenix?"}
          </h2>

      
          {description ? (
            <div className="cms-content"><span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }} /></div>
          ) : (
            <>
              <p className="text-[0.95rem] text-[#4a5f7a] leading-relaxed">
                At BioPathogenix, we adhere to stringent quality control processes, ensuring our
                laboratory supplies meet high standards of accuracy, reliability, and workflow
                consistency for researchers working with molecular technologies.
              </p>

              <p className="text-[0.95rem] text-[#4a5f7a] leading-relaxed">
                That same commitment extends beyond our products. BioPathogenix also
                develops tools and resources that help laboratories monitor performance,
                validate workflows, and maintain confidence in their molecular results.
              </p>

              <ul className="flex flex-col gap-3">
                <li className="flex items-center gap-3 text-[0.95rem] text-[#3a5070]">
                  <span>Split Sample Testing Services</span>
                </li>
                <li className="flex items-center gap-3 text-[0.95rem] text-[#3a5070]">
                  <span>A Biobank offering over <strong className="font-bold text-[#0d1f3c]">1,000 Pathogens</strong></span>
                </li>
                <li className="flex items-center gap-3 text-[0.95rem] text-[#3a5070]">
                  <span>Quality Control Resources</span>
                </li>
                <li className="flex items-center gap-3 text-[0.95rem] text-[#3a5070]">
                  <span>Zero Net Loss Validation support</span>
                </li>
              </ul>
            </>
          )}

          <div>
           {result?.contexts?.length > 0 && result?.contexts?.[0]?.btn_text &&  <button className="px-6 py-3 bg-[#0d1f3c] hover:bg-[#1a3560] text-white text-[0.9rem] font-semibold rounded-lg transition-colors"  onClick={()=> router.push(result?.contexts?.[0]?.btn_url || "#")}>
             {result?.contexts?.[0]?.btn_text} 
            </button>}
          </div>
            {/* <svg className="w-5 h-5 flex-shrink-0 text-[#3ab5d0]" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg> */}
        </div>

        {result?.images?.[1]?.image && <div className="w-full md:w-1/2 flex-shrink-0 md:pt-[160px]">
          <img
            src={ result?.images?.[1]?.image }
            alt="Lab microscope close"
            className="w-full h-[420px] object-cover rounded-2xl"
          />
        </div>}

      </div>
    </section>
  );
}
