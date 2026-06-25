'use client'


import { useCallback, useEffect, useState } from "react"
import ProductVariants from "@/components/ProductDetail/ProductVariants"
import { ProductSkus } from '@/types/product';
import {CircleTickIcon,CrossIcon} from '@/components/app_icons/app_icons';
import QtyStepper from "@/components/common/QtyStepper/qtyStepper";
import Button from "@/components/common/Button";



export interface VariantsModalProps {
    showModal: boolean
    setShowModal: (val: boolean) => void
    prdData: any
    createCartItem: () => void
    qty:number;
    setQty:React.Dispatch<React.SetStateAction<number>>;
    productSkuobj: ProductSkus  |undefined
    setProductSkuObj: (skuObj: ProductSkus | undefined) => void
    qtyErrorMsg : string | null
    setQtyErrorMsg:(msg: string|null)=>void

}

export default function VariantsModal({ showModal, setShowModal, prdData, createCartItem,qty,setQty ,productSkuobj,setProductSkuObj,qtyErrorMsg,setQtyErrorMsg }: VariantsModalProps) {

    const [productSkus, setProductSkus] = useState<ProductSkus[]>(prdData?.prd_skus ?? [])
    

    // const findSku = useCallback((selectedVariantOPtionIds: number[]) => {
    //         const selectedSet = new Set<number>(selectedVariantOPtionIds)
    //         const matched = productSkus.find((sku) =>
    //             sku?.sku_options?.every((opt) => selectedSet.has(opt.variant_option_id)),
    //         )
    //         if (matched) {
    //             setProductSkuObj(matched)
    //         } else {
    //             setProductSkuObj(undefined)
    //         }
    //     },[productSkus, setProductSkuObj],)

    // useEffect(() => {
    //     if (!showModal || hasFetchedDetail || productSkus.length > 0 || isFetchingDetail) return
    //     if (!prdData?.slug) return

    //     const controller = new AbortController()

    //     const fetchDetailSkus = async () => {
    //         setIsFetchingDetail(true)
    //         try {
    //             const response = await fetch(`${API_BASE_URL}/v1/product_detail?slug=${prdData.slug}`, {
    //                 cache: "no-store",
    //                 signal: controller.signal,
    //             })
    //             if (!response.ok) throw new Error("Failed to fetch SKU data")
    //             const payload = await response.json()
    //             const detail = payload?.result?.data
    //             if (detail?.prd_skus?.length) {
    //                 setProductSkus(detail.prd_skus)
    //             } else if (detail?.prd_skus === null) {
    //                 setProductSkus([])
    //             }
    //         } catch (error) {
    //             if ((error as Error).name !== "AbortError") {
    //                 console.error("Unable to fetch variant SKUs", error)
    //             }
    //         } finally {
    //             if (!controller.signal.aborted) {
    //                 setIsFetchingDetail(false)
    //                 setHasFetchedDetail(true)
    //             }
    //         }
    //     }

    //     fetchDetailSkus()
    //     return () => {
    //         controller.abort()
    //     }
    // }, [showModal, hasFetchedDetail, productSkus.length, isFetchingDetail, prdData?.slug])


    

    const findSku = (selectedVariantOPtionIds: number[]) => {
        const matched = productSkus.find(sku => sku.sku_options.every(opt => selectedVariantOPtionIds.includes(opt.variant_option_id)))
        if (matched) {
            setProductSkuObj(matched)
        } else {
            setProductSkuObj(undefined)
        }
    }

    const handleClose=()=>{
        setQtyErrorMsg(null)
        setQty(1) 
        setShowModal(false)
    }

    return (<>
        {showModal && (<>
            <div
                className="fixed inset-0 z-40 bg-black/40"
                onClick={handleClose}
            />
            <div className="absolute bottom-full w-[340] left-0 z-50 mb-2 bg-white rounded-lg shadow-xl border p-6">

                <div className="absolute -bottom-2 left-8 w-4 h-4 bg-white border-b border-r border-gray-200 rotate-45" />
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                <CrossIcon /> 
                </button>

                <div className="flex flex-col gap-5">
               
                <ProductVariants variants={prdData?.prd_variants} findSku={findSku}  />
                </div>
                {productSkuobj && 
                <>
                <div className="flex items-center gap-3 my-5" >
                    <div>
                        <span className="font-semibold ">{productSkuobj?.price ? "$" + productSkuobj?.price : " "} </span>
                    </div>
                    <div className="flex items-center ">
                        {
                         productSkuobj?.stock > 0 ? <><CircleTickIcon /> <span className="ms-1 font-semibold text-xs text-gray-500"> IN STOCK  </span> </> : <span className="ms-1 font-semibold text-xs text-gray-500"> OUT OF STOCK  </span> 
                        }
                    </div>
                </div>
                </>
                }
                { 
                    <div className="flex items-center my-3 ">
                        {
                        qtyErrorMsg ? <> 
                            <span className="ms-1 font-semibold text-xs text-rose-500">{qtyErrorMsg}  </span> </> : ""
                        }
                    </div>
                }
        
                

                <div className={`flex items-center gap-3 ${!productSkuobj && 'mt-5'}`}>
                    <QtyStepper stock={productSkuobj?.stock ?? 0}   qty={qty} setQty={setQty}  setQtyErrorMsg={setQtyErrorMsg}
                    Skuobj={!!productSkuobj}
                    />                
                    <Button
                        customClass="flex-1 h-11 bg-[#1e6fb5] text-white text-sm font-bold tracking-widest uppercase rounded hover:bg-[#1558a0] active:bg-[#0f4480] transition-colors"
                        customStyle={{ fontFamily: "sans-serif" }}
                        onClick={() =>  createCartItem()}
                        btnLable={"ADD TO CART"}
                    />
                </div>

            </div>
        </>)}


    </>)
}

