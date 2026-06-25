"use client"
import { useState,useMemo } from "react"
import DOMPurify from 'isomorphic-dompurify';
import ProductCarousel from "./ProductCarousel";
import ProductFaqs from "./productFaqs";
import ProductDocuments from "./ProductDocumets";

const tabs = [
  { id: "overview", label: "Product Overview" },
  { id: "faq", label: "FAQ" },
  { id: "recommendations", label: "Recommendations" },
  { id: "documents", label: "Documents" },
]

export default function ProductTabs({ prdData }: { prdData: any }) {
  const [activeTab, setActiveTab] = useState("overview")

    const cleanHtml = useMemo(() => {
        if(prdData?.description){ 
        return DOMPurify.sanitize(prdData?.description)  
    }else{ return ''}  
        } , [prdData?.description]);

  return (
    <div className="w-full mt-5">
      <div className="flex items-center gap-8 px-4  border-b border-gray-200 shadow-sm">
        {tabs.map(tab => {
            let display = true
            if(tab?.id === "recommendations" && prdData?.recommended_products?.length == 0 ){
                display = false
            }else if(tab?.id === "faq" && prdData?.prd_faqs?.length == 0 ){
                display = false
            }

          return(display && <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex cursor-pointer items-center gap-2 py-4 text-sm whitespace-nowrap transition-all
                after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:transition-all
                ${activeTab === tab.id
                ? "font-bold text-black after:bg-gray-600"
                : "font-normal text-gray-500 hover:text-gray-800 after:bg-transparent"
                }`}
          >
           
            {tab.label}
          </button>)
        })}
      </div>

      <div className="py-6 px-4">
        {activeTab === "overview" && (
          <div dangerouslySetInnerHTML={{ __html: cleanHtml }} />
        )}
        {activeTab === "faq"      &&    <ProductFaqs faqs={prdData?.prd_faqs} />   }
        {activeTab === "recommendations" && <ProductCarousel products={prdData?.recommended_products} is_detailpage={true}/> }
        {activeTab === "documents"       && <ProductDocuments   documents = {prdData?.documents}/>}
      </div>
    </div>
  )
}