"use client"
import { ProductResponse } from "@/types/product";
import Link from "next/link";
import ProductGridView from "./product/ProductGridView";


export interface PlainCategoryViewProps {
    category_slug: string,
    subCategories: ProductResponse[]
}



export default function PlainCategoryView({ subCategories, category_slug }: PlainCategoryViewProps) {

    return (<>
        {
            subCategories?.map((productData, index) => {
                let show_sub_category = productData?.products && productData?.products?.length > 0 ? true : false
                // bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow 
                return (show_sub_category &&
                    <div key={`${index}-${productData?.slug}`}>
                        <Link href={`/${category_slug}/${productData.slug}`} className="min-w-[200px]">
                            <h1 className="text-xl font-bold text-[#0b2e59]">{productData.name}</h1>
                        </Link>

                             
                        <ProductGridView 
                        customClass={"py-10"} 
                        products={productData?.products} 
                        category_slug={category_slug} 
                        sub_category_slug={productData.slug} 
                        product_count={productData?.product_count} 
                        showViewMoreCard={productData?.product_count > 8 ? true : false}
                        />
                    </div>
                )
            })
        }
    </>)
}