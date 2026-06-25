"use client"
import { useState } from "react";
import { ProductResponse } from "@/types/product";
import CarouselCategoryView from "./CarouselCategoryView";
import PlainCategoryView from "./PlainCategoryView";
import ButtonProps from "../common/Button";

export interface CategoryWiseProductsProps{
    category_name: string,
    category_slug : string,
    subCategories: ProductResponse[]
}



export default function CategoryWiseProducts({category_name,category_slug,subCategories}:CategoryWiseProductsProps) {

    const [activeCategory, setActiveCategory] = useState<string>('carousel');

    const handleCategoryChange = (type: string) => {
        setActiveCategory(type);
    }


    return (<>

    <h1 className="text-4xl font-bold text-[#0b2e59] mb-8">{category_name}</h1>

    <div className="max-w-[1400px] flex mx-auto mb-10">
        <ButtonProps   customClass={`w-50 h-11  text-gray-500 hover:text-white bg-gray-100 hover:bg-gray-300  transition-colors text-lg font-light border-l border-gray-300`} btnLable ={"Carousel"} onClick={() =>  handleCategoryChange('carousel') }/>
        <ButtonProps  customClass={`w-50 h-11  ms-3 text-gray-500 hover:text-white bg-gray-100 hover:bg-gray-300  transition-colors text-lg font-light border-l border-gray-300`} btnLable ={"No Carousel"} onClick={() =>  handleCategoryChange('no_carousel') }/>
        
    </div>


    {
        activeCategory == "carousel"
        ?<>
            <CarouselCategoryView  subCategories={subCategories} category_slug={category_slug} />
        </>
        :<>
        
            <PlainCategoryView subCategories={subCategories} category_slug={category_slug} />
        </>

    }
    </>)

}