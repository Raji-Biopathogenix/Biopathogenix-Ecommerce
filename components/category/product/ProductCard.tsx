'use client'
import Link from 'next/link';
import Image from 'next/image';

import { useState,useEffect, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { CartServices } from "@/services/cartServices";
import VariantsModal from '@/components/Modal/variantsModal/VariantModal';
import { Products, ProductSkus, Variant } from '@/types/product';
import { CART_ERR_MSG,CART_Quantity_ERR_MSG } from "@/components/utils/AppConstancts";
import { getProductPricingData } from "@/lib/productPricing";

interface ProductCardItem extends Products {
  has_variants?: boolean;
  is_customizable?: boolean;
  prd_skus?: ProductSkus[];
  prd_variants?: Variant[] | undefined;
  prd_customization_prices?: { price?: number | string } | null;
  hover_image?: { image?: string; alt_text?: string };
  primary_image: { image: string; alt_text?: string };
}

interface ProductCardProps {
  item: ProductCardItem;
  customClass?: string;
  customStyle?: CSSProperties;
  imgCustomclass?: string;
  category_slug? : string | undefined
  sub_category_slug? : string | undefined
}

export default function ProductCard({ item, customClass, customStyle, imgCustomclass,category_slug,
sub_category_slug }: ProductCardProps) {

  const {user, tmpId, reducerState, dispatch, setShowMainPageLoader, fetchCartCount} = useAuth()
  const { setToastNotification } = useToast()
  const router = useRouter();
  const productHref = sub_category_slug ? `/${category_slug}/${sub_category_slug}/${item?.slug}` : `/product-detail/${item?.slug}`;

  const [showModal, setShowModal] = useState(false)
  const [productSkuobj, setProductSkuObj] = useState<ProductSkus>()
  const [qty,setQty] = useState(1)
  const [qtyErrorMsg,setQtyErrorMsg] = useState<string | null>(null)
  const { effectivePrice, originalPrice, discountPercent } = getProductPricingData(item)
  const shouldHidePrice = Boolean(item?.requires_login_to_view_price && !user)
  const shouldSelectOptions = Boolean(
    item?.has_variants &&
    (item?.prd_variants?.length ?? 0) > 0 &&
    (item?.prd_skus?.length ?? 0) !== 1
  )

  const trademarkPrefix =
    item?.trademark?.display && item?.trademark?.postion === "pre"
      ? `${item?.trademark?.text ?? ""}${item?.trademark?.trademark ?? ""}`
      : "";
  const trademarkSuffix =
    item?.trademark?.display && item?.trademark?.postion === "post"
      ? `${item?.trademark?.text ?? ""}${item?.trademark?.trademark ?? ""}`
      : "";


  
  useEffect(() => {
    setProductSkuObj(item?.prd_skus?.[0])
  }, [item?.has_variants, item?.prd_skus])


  const CreateCartItem =async ()=>{

      if(item?.has_variants){
        if (!productSkuobj){
          setQtyErrorMsg(CART_ERR_MSG)
          setTimeout(() => setQtyErrorMsg(null),3000)
          return;
        }else if(!qty){
          setQtyErrorMsg(CART_Quantity_ERR_MSG)
          setTimeout(() => setQtyErrorMsg(null),3000)
          return;
        }
      }

    setShowMainPageLoader(true)
      try {
      const response = await CartServices.AddToCart({
          product_id: item.id,
          quantity: qty,
          tmp_id: `${tmpId}`,
          skuObj: productSkuobj,
          has_variants: item?.has_variants,
          is_customizable: item?.is_customizable,
          prd_customization_prices: item?.prd_customization_prices,
        })
        if (response?.status === "success") {
          setShowMainPageLoader(false)
          setShowModal(false)
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



  const handleAddToCart = async () => {
    if (!user) {
      router.push("/my-account");
      return;
    } else if(shouldSelectOptions) {
      setShowModal(true)
    }else if(item?.is_customizable) {
      router.push(productHref)
      return
    }else{
      CreateCartItem()
    }
  };




  return (
    <div key={item.id} className={`${customClass}`} style={customStyle}>
      <Link href={productHref}>
        <div className={`relative overflow-hidden bg-gray-100 ${imgCustomclass}`}>
          <Image
            src={item?.primary_image?.image}
            fill
            alt={item?.primary_image?.alt_text ?? item?.name}
            unoptimized
            loading='lazy'
            priority={false}
            className="absolute inset-0 w-full h-full object-cover
                   transition-all duration-500 ease-in-out
                   opacity-100 scale-100
                   group-hover:opacity-0 group-hover:scale-105"
          />

          <Image
            src={item?.hover_image?.image ?? item?.primary_image?.image}
            fill
            alt={item?.hover_image?.alt_text ?? item?.name}
            unoptimized
            loading='lazy'
            priority={false}
            className="absolute inset-0 w-full h-full object-cover
                              transition-all duration-500 ease-in-out
                              opacity-0 scale-105
                              group-hover:opacity-100 group-hover:scale-100"
          />

        </div>
      </Link>
        <div className="m-4">
          {/* <p className="text-xs font-bold text-blue-600 mb-2 uppercase">{item?.category}</p> */}
         <Link href={productHref}>
         <h3 className="text-sm font-semibold text-[#0b2e59] mb-3 line-clamp-2 h-10 ">
          {trademarkPrefix ? (
            <>
              {item?.trademark?.text} <sup>{item?.trademark?.trademark}</sup>{" "}
            </>
          ) : null}
          {item?.name}
          {trademarkSuffix ? (
            <>
              {" "}
              {item?.trademark?.text} <sup>{item?.trademark?.trademark}</sup>
            </>
          ) : null}
         </h3> </Link> 

          <div className="flex min-h-7 items-center gap-2 mb-4">
            {shouldHidePrice ? (
              <span className="text-base font-bold text-[#0b2e59]">Login to view price</span>
            ) : (
              <>
                <span className="text-xl font-bold text-[#0b2e59]">${effectivePrice.toFixed(2)}</span>
                {originalPrice && originalPrice > effectivePrice ? (
                  <>
                    <span className="text-sm text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
                    <span className="rounded-full bg-[#e8f7ec] px-2 py-0.5 text-[11px] font-semibold text-[#1f7a3d]">
                      {discountPercent}% OFF
                    </span>
                  </>
                ) : null}
              </>
            )}
          </div>

          <div className=' relative  overflow-visible group'>
          <button
            className="w-full  bg-[#0b2e59] hover:bg-[#0a2246] text-white font-semibold py-2 px-4 rounded text-sm transition-colors disabled:opacity-70 "
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
          >
            {user ? shouldSelectOptions ? "Select Options" : "Add to Cart" : shouldHidePrice ? "Login to View Price" : "Login"}
          </button>
          <VariantsModal  showModal={showModal} setShowModal={setShowModal} prdData={item} createCartItem={CreateCartItem} 
           qty={qty} setQty={setQty} productSkuobj={productSkuobj} setProductSkuObj={setProductSkuObj} 
           qtyErrorMsg = {qtyErrorMsg}
           setQtyErrorMsg = {setQtyErrorMsg}
           
           />
         
          </div>
        </div>
    

     
    </div>
  );


}
