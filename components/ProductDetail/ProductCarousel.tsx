"use client";

import { useState, useRef,useEffect } from "react";
import Link from "next/link";
import ProductCard from "../category/product/ProductCard";
import Button from "@/components/common/Button";
import { LeftIcon,RightIcon } from "@/components/app_icons/app_icons";

interface ProductImage {
  image: string;
}

interface Product {
  id: number;
  slug: string;
  title: string;
  name: string;
  category: string;
  price: number;
  primary_image: ProductImage;
}

interface ProductCarouselProps {
  products: any;
  is_detailpage?: boolean;
  showViewMoreCard?: boolean;
  category_slug?: string;
  sub_category_slug?: string;
  product_visible_count?: number;
}



function useVisibleCount(product_visible_count:number): number {
  const [count, setCount] = useState<number>(() => {
    if (typeof window === "undefined") return product_visible_count;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 3;
    return product_visible_count;
  });

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 640) setCount(1);
      else if (window.innerWidth < 1024) setCount(3);
      else setCount(product_visible_count);
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}


const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products,
  is_detailpage = false,
  showViewMoreCard = false,
  category_slug,
  sub_category_slug,
  product_visible_count=5
}) => {


  const visibleCount = useVisibleCount(product_visible_count);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [sliding, setSliding] = useState<"left" | "right" | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalProducts = showViewMoreCard ? products.length + 1 : products.length;
  const canPrev = startIndex > 0;
  const canNext = startIndex + visibleCount  < totalProducts;


  useEffect(() => {
    setStartIndex(0);
  }, [visibleCount]);

  const navigate = (dir: "prev" | "next"): void => {
    
    if (sliding) return;
    if (dir === "prev" && !canPrev) return;
    if (dir === "next" && !canNext) return;

    setSliding(dir === "next" ? "left" : "right");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setStartIndex((i) =>
        dir === "next"
          ? Math.min(i + visibleCount, totalProducts - visibleCount)
          : Math.max(i - visibleCount, 0)
      );
      setSliding(null);
    }, 350);
  };

  const visibleProducts = products.slice(startIndex, startIndex + visibleCount);

  return (
    <section className="w-full ">
      {/* py-10 */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .slide-in-right { animation: slideInRight 0.35s ease both; }
        .slide-in-left  { animation: slideInLeft  0.35s ease both; }
      `}</style>

      {is_detailpage ?<> 
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1 ">
            Picked For You
          </p>
          <h2 className="text-2xl font-bold text-[#0b2e59] mb-8">
            Recommended Products
          </h2> 
      </>: null}

      <div className="relative flex items-center">
        <Button  
        onClick={() => navigate("prev")}    
        customClass ={"absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md transition-all duration-200 text-gray-500 hover:text-[#0b2e59] hover:border-[#0b2e59] disabled:opacity-20 disabled:cursor-not-allowed"}
        customStyle={{ transform: "translateX(-50%)" }}
        btnLable={<LeftIcon/>}
        disabled={!canPrev || !!sliding} 
        />
          <div className="w-full ">
            <div
              className={`grid gap-4 ${
                sliding === "left"
                  ? "slide-in-right"
                  : sliding === "right"
                  ? "slide-in-left"
                  : ""
              }`}
              style={{ gridTemplateColumns: `repeat(${visibleCount}, 1fr)` }}
            >
              {visibleProducts.map((item:any, idx:number) => (
                <ProductCard item = {item}  key={`${idx}-${item?.id}`} customClass={"bg-white rounded-xl  shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"} customStyle={{animationDelay: sliding ? `${idx * 40}ms` : "0ms",}} imgCustomclass={' h-[200px] '}  category_slug={category_slug} sub_category_slug={sub_category_slug}/>
              ))}
              {
                (!canNext || !!sliding) && showViewMoreCard && (
                  <Link href={`/${category_slug}/${sub_category_slug}`} className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-[#0b2e59] transition-colors">
                    <span className="text-sm font-semibold">View More</span>
                  </Link>
                )
              }
            </div>
          </div>       
        <Button  
        onClick={() => navigate("next")}    
        customClass ={"absolute right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-gray-200 shadow-md transition-all duration-200 text-gray-500 hover:text-[#0b2e59] hover:border-[#0b2e59] disabled:opacity-20 disabled:cursor-not-allowed"}
        customStyle={{ transform: "translateX(-50%)" }}
        btnLable={<RightIcon/>}
        disabled={!canNext || !!sliding} 
        />
      </div>
    </section>
  );
};

export default ProductCarousel;