"use client"
import { useState } from "react";
import { ProductResponse } from "@/types/product";

import ButtonProps from "../common/Button";
import Link from "next/link";
import ProductCarousel from "../ProductDetail/ProductCarousel";




export interface CarouselCategoryViewProps {
    category_slug: string,
    subCategories: ProductResponse[]
}



export default function CarouselCategoryView({ subCategories, category_slug }: CarouselCategoryViewProps) {

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
                        <ProductCarousel
                            products={productData.products}
                            is_detailpage={false}
                            category_slug={category_slug}
                            sub_category_slug={productData.slug}
                            showViewMoreCard={productData?.product_count > 8 ?true : false} 
                            product_visible_count={4}
                        />
                    </div>
                )
            })
        }
    </>)
}