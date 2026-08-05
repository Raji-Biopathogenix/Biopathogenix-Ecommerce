"use client";

import { useRouter } from "next/navigation";
import { LandingPageType } from "@/types/header";
import { ChevronRight } from "lucide-react";

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
  {
    title: "Personal Protection Equipment",
    image: "/images/PPE/face-mask-img-for-website-1-1000x1000.jpg",
  },
] as const;

export default function ShopByCategory({ result }: ShopByCategoryprops) {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden bg-white py-20">
      <div className="relative">
        <h2
          className="
                    pointer-events-none
                    absolute
                    left-1/2
                    -translate-x-1/2
                    -translate-y-10
                    sm:-translate-y-16
                    md:-translate-y-26
                    lg:-translate-y-35
                    select-none
                    whitespace-nowrap
                    text-[64px]
                    sm:text-[90px]
                    md:text-[130px]
                    lg:text-[180px]
                    text-[#173963]
                    opacity-[0.03]
                    md:opacity-[0.04]
                    lg:opacity-[0.05]
                    [mask-image:linear-gradient(to_bottom,black_0%,black_30%,rgba(0,0,0,0.45)_55%,transparent_100%)]
                    [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_30%,rgba(0,0,0,0.45)_55%,transparent_100%)]
                  "
        >
          Categories
        </h2>
        <div className="relative mb-6 mt-8 text-center sm:mb-10 sm:mt-10 lg:mb-10 lg:mt-12">
          <h2 className="text-[28px] font-medium leading-tight text-[#173963] sm:text-[36px] md:text-[42px] lg:text-[52px]">
            Shop By{" "}
            <span className="font-semibold text-[#5AA7E8]">
              Category
            </span>
          </h2>
        </div>

        <div className="relative top-10 w-full px-3 sm:px-5 lg:px-8">
          <div className="flex w-full gap-4 overflow-x-auto pb-2 lg:overflow-visible">
            {CATEGORIES.map((category, index) => {
              const link = result?.contexts?.[index]?.btn_url || "#";

              return (
                <div
                  key={index}
                  onClick={() => router.push(link)}
                  className="
                        group
                        relative
                        h-[420px]
                        min-w-[280px]
                        flex-1
                        lg:min-w-0
                        cursor-pointer
                        overflow-hidden
                        rounded-[28px]
                        flex-shrink-0
                    "
                >
                  {/* Image */}
                  <img
                    src={category.image}
                    alt={category.title}
                    className="
                            absolute
                            inset-0
                            h-full
                            w-full
                            object-cover
                            transition-transform
                            duration-500
                            group-hover:scale-105
                        "
                  />
                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08284d] via-[#08284d66] to-transparent" />
                  {/* Bottom Content */}
                  <div className="absolute bottom-7 left-6 right-6 flex items-end justify-between">
                    <h3 className="max-w-[180px] text-[20px] font-semibold leading-tight text-white">
                      {category.title}
                    </h3>
                    <div
                      className="
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center
                          rounded-full
                          bg-white
                          transition-all
                          duration-300
                          group-hover:translate-x-1
                        "
                    >
                      <ChevronRight className="h-5 w-5 text-[#173963]" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
