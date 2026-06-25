'use client'



import { Products } from "@/types/product";
import ProductCard from "./ProductCard";
import Link from "next/link";


export interface ProductGridPageProps {
  products: Products[]
  showViewMoreCard?: boolean
  category_slug?: string
  sub_category_slug?: string
  product_count?: number
  customClass?: string
}






export default function ProductGridView({ customClass, products, showViewMoreCard, category_slug, sub_category_slug, product_count }: ProductGridPageProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${customClass}`}>
      {products.map((item) => (
        <ProductCard item={item} key={item?.id} customClass={"group relative bg-white rounded-lg  shadow-md hover:shadow-lg transition-shadow"} imgCustomclass={' h-[200px] '} category_slug={category_slug} sub_category_slug={sub_category_slug} />
      ))}


      {
        showViewMoreCard ?
          <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-[#0b2e59] transition-colors">
            <Link href={`/${category_slug}/${sub_category_slug}`} className="text-sm flex items-center font-semibold text-[#0b76d1] hover:text-[#0b2e59]">
              View all {product_count} products
            </Link>
          </div>
          : null
      }
    </div>

  );
}