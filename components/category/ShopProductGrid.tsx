"use client"
import {Products} from '@/types/product';
import Link from "next/link";
import ProductCard from './product/ProductCard';

export interface ShopProductGridProps{
    products:Products[]
}






export default function ShopProductGrid({ products }: ShopProductGridProps) {



  return (

     <main className="min-h-screen bg-white">
      <div className="bg-[#f8fafd] py-20 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center gap-4">
            {/* <div
              className="h-12 w-12 rounded-xl bg-white shadow-sm bg-cover bg-center"
              style={{ backgroundImage: `url(${getCategoryImage(activeCategory.slug, activeCategory.icon)})` }}
            /> */}
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#0b2e59]/60">Category</p>
              <h1 className="text-[44px] font-bold text-[#0b2e59]">
                {/* {activeCategory.name + "----"} */}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800">
            SHOWING 1-{products.length} OF {products.length} RESULTS
          </h2>
          <Link href="/shop" className="text-sm font-semibold text-[#0b76d1] hover:text-[#0b2e59]">
            View all products
          </Link>
        </div>

        
 
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((item) => (
          <ProductCard item = {item}  key={item?.id} customClass={"group relative bg-white rounded-lg  shadow-md hover:shadow-lg transition-shadow"} imgCustomclass={' h-[280px] '} />
        ))}
      </div>

    </div>
    </main>


  );
}
