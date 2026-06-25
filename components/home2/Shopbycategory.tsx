"use client";
import { LandingPageType } from "@/types/header";
import { useRouter } from "next/navigation";


interface ShopByCategoryprops{
  result: LandingPageType
}


export default function ShopByCategory({result}:ShopByCategoryprops) {
  const router = useRouter();

  return (
    <section className=" bg-[#e8f7fb] py-12 px-5 mx-5">
      <h2 className="text-center text-[1.9rem] font-bold text-[#0d1f3c] mb-10">
       {result?.name || "Shop by Category"}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {result?.contexts.map((cat,index) => (
          <div
            key={cat.title}
            className="bg-white rounded-xl p-4 flex flex-col gap-3"
          >
            <p className="text-[0.85rem] font-bold text-[#0d1f3c] text-center leading-snug min-h-[40px]">
              {cat.title}
            </p>

            <img
              src={result?.images?.[index]?.image}
              alt={cat.title}
              className="w-full h-[170px] object-cover rounded-lg"
            />

            <button className="w-full py-2.5 bg-[#0d1f3c] hover:bg-[#1a3560] text-white text-[0.85rem] font-semibold rounded-lg transition-colors" onClick={()=> router.push(result?.contexts?.[0]?.btn_url || "#")}>
             {cat.btn_text}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}