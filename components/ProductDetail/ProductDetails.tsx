import { useCallback, useEffect, useMemo, useState } from "react";
import ProductVariants from "./ProductVariants";
import ButtonProps from '@/components/common/Button';
import QtyStepper from '@/components/common/QtyStepper/qtyStepper';
import ShareIcons from "../common/shareIcons";
import { ProductSkus, Variant } from '@/types/product';
import { useAuth } from "@/context/AuthContext";
import { CartServices } from "@/services/cartServices";
import { useToast } from "@/context/ToastContext"
import { useRouter } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';
import { CircleTickIcon } from '../app_icons/app_icons';
import { CART_ERR_MSG, CART_Quantity_ERR_MSG } from "@/components/utils/AppConstancts";
import { getProductPricingData } from "@/lib/productPricing";

export interface ProductPrices {
  max_price: number,
  min_price: number
}

interface ProductDocumentDownload {
  id: number;
  certificate_type?: string;
  section?: string;
  title: string;
  file_url?: string | null;
  sku_id?: number | null;
  sku_code?: string | null;
}

interface ProductDetailData {
  id: number;
  name: string;
  slug?: string;
  sku?: string;
  price?: number | string;
  compare_price?: number | string | null;
  discount_value?: number | string | null;
  stock_quantity?: number;
  short_description?: string;
  has_variants?: boolean;
  is_customizable?: boolean;
  requires_login_to_view_price?: boolean;
  prd_customization_prices?: { price?: number | string } | null;
  prd_skus?: ProductSkus[];
  prd_variants?: Variant[];
  documents?: ProductDocumentDownload[];
  assay_detail?: {
    catalog_number?: string;
    reaction_format?: string;
    target_count?: number;
  } | null;
  trademark?: {
    display?: boolean;
    postion?: "pre" | "post";
    text?: string;
    trademark?: string;
  };
}

export default function ProductDetails({ prdData }: { prdData: ProductDetailData }) {
  const router = useRouter();
  const cleanshortHtml = useMemo(() => DOMPurify.sanitize(prdData?.short_description ?? ""), [prdData?.short_description]);


  const { user, tmpId, reducerState, dispatch, setShowMainPageLoader, fetchCartCount } = useAuth()
  const { setToastNotification } = useToast()


  const [productSkus, setProductSkus] = useState<ProductSkus[]>(prdData?.prd_skus ?? [])
  const [productSkuobj, setProductSkuObj] = useState<ProductSkus>()
  const [prices, setPrices] = useState<ProductPrices>({ "min_price": 0, "max_price": 0 })
  const [qty, setQty] = useState(1)
  const [qtyErrorMsg, setQtyErrorMsg] = useState<string | null>(null)
  const fallbackSku = useMemo(
    () => ({
      id: 0,
      sku_code: prdData?.sku ?? `product-${prdData?.id ?? "unknown"}`,
      price: Number(prdData?.price ?? 0),
      stock: Number(prdData?.stock_quantity ?? 0),
      low_stock_threshold: 0,
      sku_options: [],
    }),
    [prdData?.id, prdData?.price, prdData?.sku, prdData?.stock_quantity],
  )
  const availableStock = productSkuobj?.stock ?? Number(prdData?.stock_quantity ?? 0)
  const hasSelectableSku = prdData?.has_variants ? !!productSkuobj : true
  const shouldHidePrice = Boolean(prdData?.requires_login_to_view_price && !user)
  const { effectivePrice, originalPrice, discountPercent } = getProductPricingData(prdData)



  const handleAddToCart = async () => {
    if (!user) {
      router.push("/my-account");
      return;

    } else if (prdData?.has_variants && productSkuobj == undefined) {
      setQtyErrorMsg(CART_ERR_MSG)
      setTimeout(() => setQtyErrorMsg(null), 3000)
      return;
    } else if (!qty) {
      setQtyErrorMsg(CART_Quantity_ERR_MSG)
      setTimeout(() => setQtyErrorMsg(null), 3000)
      return;
    } else {
      setShowMainPageLoader(true)
      try {
        const response = await CartServices.AddToCart({ "product_id": prdData.id, "quantity": qty, "tmp_id": `${tmpId}`, "skuObj": productSkuobj, "has_variants": prdData?.has_variants, 'is_customizable': prdData?.is_customizable, "prd_customization_prices": prdData?.prd_customization_prices })
        if (response?.status === "success") {
          setShowMainPageLoader(false)
          setToastNotification({ type: 'success', message: 'Add to cart' })
          fetchCartCount(tmpId)
          dispatch({ type: "CART_MODAL", payload: !reducerState.cartModalOpenFlag });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unable to add product to cart";
        setToastNotification({ type: "error", message })
        setShowMainPageLoader(false)
      } finally {
        setShowMainPageLoader(false)
      }
    }
  };


  // console.log("prdData", prdData)


  const findSku = useCallback((selectedVariantOPtionIds: number[]) => {
    const matched = productSkus.find((sku) =>
      sku.sku_options.every((opt) => selectedVariantOPtionIds.includes(opt.variant_option_id)),
    )
    if (matched) {
      setProductSkuObj(matched)
    } else {
      setProductSkuObj(undefined)
    }
  },
    [productSkus],
  )




  useEffect(() => {
    setProductSkus(prdData?.prd_skus ?? [])
  }, [prdData?.prd_skus])

  useEffect(() => {
    if (prdData?.has_variants) {
      const values = (prdData?.prd_skus ?? []).map((item: ProductSkus) => Number(item.price)).filter((value: number) => !Number.isNaN(value))
      if (values.length > 0) {
        setPrices({ "min_price": Math.min(...values), "max_price": Math.max(...values) })
      }
      setProductSkuObj(undefined)
    } else {
      setPrices({ "min_price": 0, "max_price": 0 })
      setProductSkuObj(prdData?.prd_skus?.[0] ?? fallbackSku)
    }
  }, [fallbackSku, prdData?.has_variants, prdData?.prd_skus])


  // console.log("productSkuobj", productSkuobj)

  return (<>

    <div className="lg:w-[50%] flex flex-col gap-5 md:mt-10">

      {/* Title */}
      <div>
        <h1 className="text-4xl  text-[#1e3a5f] leading-tight mb-3">
          {prdData?.trademark?.display && prdData?.trademark?.postion === "pre" ? <>
            {prdData?.trademark?.text} <sup>{prdData?.trademark?.trademark}</sup> </> : ''}  {prdData?.name}
          {prdData?.trademark?.display && prdData?.trademark?.postion === "post" ? <>
            {prdData?.trademark?.text} <sup>{prdData?.trademark?.trademark}</sup> </> : ''}
        </h1>

        <div className="text-[#1e6fb5] font-semibold" style={{ fontFamily: "sans-serif" }}>
          {shouldHidePrice ? (
            "Login to view price"
          ) : prdData?.is_customizable ? (
            user ? "$" + effectivePrice.toFixed(2) : "Login for Custom Pricing"
          ) : prdData?.has_variants ? (
            prices?.min_price === prices?.max_price
              ? "$" + (prices?.min_price).toFixed(2)
              : "$" + (prices?.min_price).toFixed(2) + " - " + "$" + (prices?.max_price).toFixed(2)
          ) : (
            <div className="flex items-center gap-2">
              <span>${effectivePrice.toFixed(2)}</span>
              {originalPrice && originalPrice > effectivePrice ? (
                <>
                  <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
                  <span className="rounded-full bg-[#e8f7ec] px-2 py-0.5 text-[11px] font-semibold text-[#1f7a3d]">
                    {discountPercent}% OFF
                  </span>
                </>
              ) : null}
            </div>
          )}
        </div>
        {cleanshortHtml && <p className="text my-4" style={{ fontFamily: "sans-serif" }}> {cleanshortHtml} </p>
        }
      </div>

      {

        prdData?.has_variants
          ? <>
            <ProductVariants variants={prdData?.prd_variants ?? []} findSku={findSku} />
	            { !prdData?.is_customizable && !shouldHidePrice && <div className="flex items-center gap-3 mt-1" >
              <div>
                <span className="font-semibold ">{productSkuobj?.price ? "$" + productSkuobj?.price : " "} </span>
              </div>
              <div className="flex items-center">
                {hasSelectableSku ? availableStock > 0 ? <><CircleTickIcon /> <span className="ms-1 font-semibold text-xs text-gray-500"> IN STOCK  </span> </> : <span className="ms-1 font-semibold text-xs text-gray-500"> OUT OF STOCK </span> : ""}
              </div>
            </div>}
          </>
          : <></>
      }

      {
        <div className="flex items-center my-3 ">
          {
            qtyErrorMsg ? <>
              <span className="ms-1 font-semibold text-xs text-rose-500">{qtyErrorMsg}  </span> </> : ""
          }
        </div>
      }



      {/* Quantity + Add to Cart */}
      <div className="flex items-center gap-3 mt-1">
        {!shouldHidePrice ? (
          <QtyStepper stock={availableStock} qty={qty} setQty={setQty} setQtyErrorMsg={setQtyErrorMsg}
            Skuobj={hasSelectableSku} />
        ) : null}



        <ButtonProps
          customClass="flex-1 h-11 bg-[#1e6fb5] text-white text-sm font-bold tracking-widest uppercase rounded hover:bg-[#1558a0] active:bg-[#0f4480] transition-colors"
          customStyle={{ fontFamily: "sans-serif" }}
          onClick={() => handleAddToCart()}
	          btnLable={shouldHidePrice ? "LOGIN TO VIEW PRICE" : "ADD TO CART"}
	        />
      </div>

      {/* Login notice */}
      {/* <p className="text-sm text-gray-600 leading-relaxed" style={{ fontFamily: "sans-serif" }}>
                Please{" "}
                <a href="#" className="text-[#1e6fb5] underline underline-offset-2 hover:no-underline">
                  login or request an account
                </a>{" "}
                to view pricing and product specifications.
              </p> */}

      {/* Divider */}
      <div className="h-px bg-gray-200 my-1" />

      {/* Catalog Number + SKU */}
      <div className="text-sm text-gray-500 space-y-1" style={{ fontFamily: "sans-serif" }}>
        {prdData?.assay_detail?.catalog_number ? (
          <p>
            <span className="font-medium text-gray-700">Catalog Number:</span>{" "}
            {prdData.assay_detail.catalog_number}
          </p>
        ) : null}
        {productSkuobj?.sku_code ? (
          <p><span className="font-medium text-gray-700">SKU:</span> {productSkuobj.sku_code}</p>
        ) : prdData?.sku ? (
          <p><span className="font-medium text-gray-700">SKU:</span> {prdData.sku}</p>
        ) : null}
      </div>

      {/* Share */}
      <ShareIcons />
    </div>


  </>)
}
