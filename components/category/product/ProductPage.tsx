'use client'

import { CategoryData, SubCategoryData, Products } from "@/types/product";
import ProductGridView from "./ProductGridView";
import SelectField from "@/components/common/selectField";
import { usePathname, useParams, useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation";

export interface ProductGridPageProps {
  category: CategoryData,
  subCategory: SubCategoryData,
  products: Products[],
  currentPage : number,
  totalPages : number,
  count   : number
}

export default function ProductGridPage({ category, subCategory, products,currentPage,totalPages,count }: ProductGridPageProps) {

  const pathname = usePathname()      
  const searchParams = useSearchParams()

  const router = useRouter();


  const handleChange =(value: string)=>{

    if(searchParams.get("page")){
      router.push(`${pathname}?page=${searchParams.get("page")}&orderby=${value}`)
    }else{
      router.push(`${pathname}?orderby=${value}`)
    }

  }


  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-800">
          {/* SHOWING {products.length} OF {count} RESULTS */}
          Page {currentPage} of {totalPages} — {count} RESULTS
        </h2>

        <div>
          <SelectField onChange={handleChange}  name={'orderby'} selectOptions={[{label:"Default sorting",value:"menu_order"},{label:"Sort by popularity",value:"popularity"},{label:"Sort by average rating",value:"rating"},{label:"Sort by latest",value:"date"},{label:"Sort by price: low to high",value:"asc"},{label:"Sort by price: high to low",value:"desc"}]} />
        </div>
      </div>
      <ProductGridView products={products} />



    </>
  );
}