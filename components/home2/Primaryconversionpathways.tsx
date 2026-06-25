"use client";
import { LandingPageType } from "@/types/header";
import { useRouter } from "next/navigation";


interface PrimaryConversionPathwaysprops{
  result: LandingPageType
}

export default function PrimaryConversionPathways({result}:PrimaryConversionPathwaysprops) {
  const router = useRouter();

  return (
    <section className="w-full bg-white py-14 px-5">
      <h2 className="text-center text-[1.9rem] font-bold text-[#0d1f3c] mb-10">
       {result?.name || "Primary Conversion Pathways"}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {result?.contexts?.map((item) => (
          <div
            key={item.title}
            className="border border-gray-200 rounded-xl p-6 flex flex-col gap-4"
          >
            <h3 className="text-[1.1rem] font-bold text-[#0d1f3c]">
              {item.title}
            </h3>

            <p className="text-[0.95rem] font-semibold text-[#3ab5d0] leading-snug">
              {item.short_description}
            </p>

            <p className="text-[0.9rem] text-[#4a5f7a] leading-relaxed flex-1">
              {item.description}
            </p>

            <button className="w-full py-3 bg-[#0d1f3c] hover:bg-[#1a3560] text-white text-[0.88rem] font-semibold rounded-lg transition-colors mt-auto" onClick={()=> router.push(result?.contexts?.[0]?.btn_url || "#")}>
              {item.btn_text}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}