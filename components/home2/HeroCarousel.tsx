"use client";
import { useState, useEffect, useMemo } from "react";
import { LandingPageType } from "@/types/header";
import DOMPurify from "isomorphic-dompurify";
import { useRouter } from "next/navigation";

interface HeroCarouselprops{
  result: LandingPageType
}


export default function HeroCarousel({result}:HeroCarouselprops) {
  const [current, setCurrent] = useState(0);
  const slides = useMemo(() => result?.images?.map(img => img.image) || [], [result]);
  const router = useRouter();

  useEffect(() => {
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 4500);
    return () => clearInterval(t);
  }, [slides]);

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[#102142]" style={{ height: "min(78vh, 760px)", minHeight: "560px" }}>
      {slides.map((src, i) => (
        <div
          key={i}
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{
            backgroundImage: `linear-gradient(rgba(10,28,65,0.60),rgba(10,28,65,0.60)), url(${src})`,
            opacity: i === current ? 1 : 0,
          }}
        />
      ))}

	 
      <div className="absolute inset-0 z-[1] hidden sm:flex flex-col items-center justify-center px-8 text-center md:px-16">
       

        {
          result?.contexts?.length > 0 && ( 
          <>
          
          { 
          result?.contexts?.[0]?.title && 
          <h1 className="mb-5 max-w-6xl text-[2.5rem] font-extrabold leading-tight text-white md:text-[3.2rem]">
                  {result?.contexts?.[0]?.title}
        </h1>}
        <p className="mb-8 max-w-[700px] text-[1rem] leading-8 text-white/85">
          {result?.contexts?.[0]?.short_description && <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(result?.contexts?.[0]?.short_description) }} />}
        </p>


        {result?.contexts?.[0]?.btn_text &&  <button className="rounded-full bg-[#3ab5d0] px-10 py-3 text-base font-semibold text-white transition-colors hover:bg-[#2aa0bc]" onClick={()=> router.push(result?.contexts?.[0]?.btn_url || "#")}>
           {result?.contexts?.[0]?.btn_text}
          </button>}
          </>
          
        )}
       
      </div>

      {  result?.contexts?.length > 0 && result?.contexts?.[0]?.btn_text && <div className="absolute inset-0 z-[1] flex items-end justify-center px-6 pb-10 sm:hidden">
        <button className="rounded-full bg-[#3ab5d0] px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-[#2aa0bc]" onClick={()=> router.push(result?.contexts?.[0]?.btn_url || "#")}>
        {result?.contexts?.[0]?.btn_text}
        </button>
      </div>}
    </section>
  );
}
