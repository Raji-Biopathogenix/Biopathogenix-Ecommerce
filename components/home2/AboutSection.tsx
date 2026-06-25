"use client";
import { LandingPageType } from "@/types/header";
import DOMPurify from "isomorphic-dompurify";

interface AboutSectionprops{
  result: LandingPageType
}






export default function AboutSection({result}:AboutSectionprops) {


  return (
    <section className=" bg-white py-16 px-5 md:px-10">
      <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">

        <div className="w-full md:w-1/2 flex-shrink-0 flex justify-center">
          {/* Mobile layout */}
          <div className="flex md:hidden w-full gap-3">
            {result?.images?.[1]?.image && (
              <img
                src={result?.images?.[1]?.image}
                alt="Scientist with microscope"
                className="w-1/2 h-[220px] object-cover rounded-2xl"
              />
            )}
            {result?.images?.[0]?.image && (
              <img
                src={result?.images?.[0]?.image}
                alt="Female scientist"
                className="w-1/2 h-[220px] object-cover rounded-2xl"
              />
            )}
          </div>

          {/* Desktop layout */}
          <div className="relative h-[480px] w-[640px] hidden md:block">
            {result?.images?.[2]?.image && <img
              src={result?.images?.[2]?.image}
              alt="Lab flask"
              className="absolute top-0 left-[170px] w-[130px] h-[200px] object-cover z-[1]"
            />}
            {result?.images?.[1]?.image && <img
              src={result?.images?.[1]?.image}
              alt="Scientist with microscope"
              className="absolute top-0 left-[300px] w-[320px] h-[460px] object-cover rounded-2xl z-[2]"
            />}
            {result?.images?.[0]?.image && <img
              src={result?.images?.[0]?.image}
              alt="Female scientist"
              className="absolute bottom-0 left-[130px] w-[210px] h-[260px] object-cover rounded-2xl z-[3]"
            />}
          </div>
        </div>

        { result?.contexts?.length > 0 &&  <div className="w-full md:w-1/2">
          {
            result?.contexts?.[0]?.title &&  <h2 className="text-[1.9rem] font-bold text-[#0d1f3c] leading-snug mb-4">
              {result?.contexts?.[0]?.title}
           
          </h2>}

          <div className="cms-content text-[0.95rem] leading-relaxed mb-5">
           {result?.contexts?.[0]?.short_description && <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result?.contexts?.[0]?.short_description) }} />}
          </div>

          <div className="cms-content">
           {result?.contexts?.[0]?.description && <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result?.contexts?.[0]?.description) }} />}
          </div>

          {/* <p className="text-[0.95rem] font-bold text-[#0d1f3c] mb-4">
            Our teams work directly with scientists to develop
          </p>

          <ul className="flex flex-col gap-3 mb-6">
           
             <li key="Multiplex qPCR assays" className="flex items-center gap-3 text-[0.95rem] text-[#3a5070]">
                <svg className="w-5 h-5 flex-shrink-0 text-[#3ab5d0]" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                "Multiplex qPCR assays"
              </li>
               <li key="DNA and RNA extraction workflows" className="flex items-center gap-3 text-[0.95rem] text-[#3a5070]">
                <svg className="w-5 h-5 flex-shrink-0 text-[#3ab5d0]" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                "DNA and RNA extraction workflows"
              </li>
               <li key="Laboratory validation, and Quality controls" className="flex items-center gap-3 text-[0.95rem] text-[#3a5070]">
                <svg className="w-5 h-5 flex-shrink-0 text-[#3ab5d0]" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                "Laboratory validation, and Quality controls"
              </li>
          </ul>

          <p className="text-[0.95rem] font-bold text-[#0d1f3c] leading-relaxed">
            Every solution is designed to support reliable workflows and adaptable research environments.
          </p> */}
        </div>}

      </div>
    </section>
  );
}