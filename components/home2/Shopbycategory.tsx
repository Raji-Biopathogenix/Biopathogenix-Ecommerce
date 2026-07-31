"use client";

import { useRouter } from "next/navigation";
import { LandingPageType } from "@/types/header";

interface ShopByCategoryprops {
  result?: LandingPageType;
}

const CATEGORIES = [
  {
    title: "DNA/RNA Extraction Kits",
    image: "/fig-preview/images/060537cbda24b2a5cd4fc145fa7271e599487b7c",
  },
  {
    title: "Custom & Standard qPCR Assays",
    image: "/fig-preview/images/964c41576142d9cb765f65a59510cc79a66be001",
  },
  {
    title: "PCR Lab Consumables",
    image: "/fig-preview/images/341d4c17677780e3ffe716da598d5cd49fe71a93",
  },
  {
    title: "Specimen Collection Supplies",
    image: "/fig-preview/images/47de23b4d89bd43c2c82125a838f1ca90b06ab66",
  },
] as const;

export default function ShopByCategory({ result }: ShopByCategoryprops) {
  const router = useRouter();

  return (
    <section className="w-full overflow-hidden bg-[#eef8fc] px-6 py-14 md:px-14">
      <div className="mx-auto max-w-[1360px]">
        <div className="mb-10 text-center">
          <h2 className="font-['Poppins'] text-[2rem] font-semibold tracking-[-0.03em] text-[#102447] md:text-[2.45rem]">
            Shop By Category
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {CATEGORIES.map((category, index) => {
            const link = result?.contexts?.[index]?.btn_url || "#";
            const buttonText = result?.contexts?.[index]?.btn_text || "View Products";

            return (
              <div
                key={category.title}
                className="overflow-hidden rounded-[26px] bg-white shadow-[0_16px_38px_rgba(15,39,73,0.08)]"
              >
                <div className="aspect-[1.05/1] overflow-hidden bg-[#edf4fa]">
                  <img src={category.image} alt={category.title} className="h-full w-full object-cover" />
                </div>

                <div className="flex flex-col gap-4 p-6">
                  <h3 className="min-h-[3.5rem] text-center font-['Poppins'] text-[1rem] font-semibold leading-snug text-[#102447]">
                    {category.title}
                  </h3>

                  <button
                    type="button"
                    onClick={() => router.push(link)}
                    className="inline-flex items-center justify-center rounded-[12px] bg-[#173864] px-5 py-3 text-[0.92rem] font-semibold text-white transition-colors hover:bg-[#102b4f]"
                  >
                    {buttonText}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
