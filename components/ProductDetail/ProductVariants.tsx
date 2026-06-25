import {Variant,VariantOption} from '@/types/product';
import { useEffect, useState } from 'react';





export default function ProductVariants(
    {variants,findSku}:
    {variants: Variant[],findSku:(selectedVariantOptionIds: number[])=> void }){

    const [variantData,setVariantData] = useState<Variant[]>(variants ?? [])


    useEffect(()=>{
        // if(Array.isArray(variants)){
        // }
        setVariantData(variants.sort((a, b) => a.order - b.order));
        findSku([])
    },[variants])

    // useEffect(() => {
    //     setVariantData(variants ?? [])
    //     findSku([])
    // }, [variants, findSku])








    // const getOptionIds = (option?: VariantOption) => {
    //     if (!option) return [];
    //     const ids: number[] = [];
    //     if (typeof option.id === "number") ids.push(option.id);
    //     if (typeof option.variant_option_id === "number") ids.push(option.variant_option_id);
    //     return ids;
    // };

    const handleOPtionSelection = (variant_id: number,option:VariantOption) =>{ 
        let newVariantData = variantData?.map((e) =>
            e.id == variant_id
                ? {
                    ...e,
                    variant_options: e?.variant_options?.map((e1) =>
                        e1.id == option.id ? { ...e1, selected: !e1?.selected } : {...e1, selected: false}
                    )
                }
                : e
        )
        setVariantData(newVariantData)
        // const selectedOptions = newVariantData
        //     ?.flatMap((e) => e?.variant_options?.filter((e1) => e1.selected))
        //     ?? []
        // const variantOptionIds = Array.from(
        //     new Set(selectedOptions.flatMap((option) => getOptionIds(option))),
        // )

        let variantOptionIds = newVariantData?.flatMap((e) => e?.variant_options?.filter(e1 => e1.selected)).map((e3)=> e3.id)
        // console.log("variantOptionIds",variantOptionIds)
        findSku(variantOptionIds)
    }
    





    return(<>

    {
        variantData?.map((e)=>{

            let variantOPtions =  e?.variant_options.sort((a, b) => a.order - b.order);



            return(
                <div key={e?.id}>
                <label className="block text-xs tracking-widest uppercase text-gray-400 font-semibold mb-2" style={{ fontFamily: "sans-serif" }}>
                    {e?.name}
                </label>
                <div className="flex flex-wrap gap-2">
                    {variantOPtions?.map((option) => (
                        <button
                            key={option?.id}
                            onClick={() => handleOPtionSelection(e?.id,option)}
                            className={`px-4 py-2 text-sm rounded border transition-all duration-150 ${
                            option?.selected
                                ? "border-[#1e6fb5] bg-[#e8f2fb] text-[#1e6fb5] font-medium"
                                : "border-gray-300 text-gray-600 hover:border-gray-400 bg-white"
                            }`}
                            style={{ fontFamily: "sans-serif" }}
                        >
                            {option?.value}
                        </button>
                    ))
                    }
                </div>
                </div>
            )
        })
    }
    
  
    
    </>)
}












