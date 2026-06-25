"use client";
import { useState } from "react";
import { addToCart } from "@/lib/cart";
import {CartServices} from "@/services/cartServices";
import { useRouter } from 'next/navigation';
import {useAuth} from "@/context/AuthContext"
import {useToast} from "@/context/ToastContext"
import axios from "axios";


export type ShopProduct = {
  id: number;
  title: string;
  image: string;
  sku?: string;
  price: number;
  originalPrice: number;
  category: string;
  is_customizable?: boolean;
  prd_customization_prices?: {
    price: number | string;
  } | null;
};

type ShopProductGridProps = {
  products: ShopProduct[];
};



export default function ShopProductGrid({ products }: ShopProductGridProps) {
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const { user,tmpId,setShowMainPageLoader,fetchCartCount } = useAuth()
  const { setToastNotification } = useToast()

  const handleAddToCart = async (productItem: ShopProduct) => {
    if(user){
      setShowMainPageLoader(true)

      try{
        const skuCode =
          productItem.sku ??
          productItem.title
            ?.replace(/[^\w-]/g, "")
            .replace(/\s+/g, "-")
            .toUpperCase();
        const response = await CartServices.AddToCart({
          product_id: productItem.id,
          tmp_id: `${tmpId}`,
          price: productItem.price,
          quantity: 1,
          has_variants: false,
          is_customizable: productItem.is_customizable,
          prd_customization_prices: productItem.prd_customization_prices ?? undefined,
          skuObj: {
            id: 0,
            sku_code: skuCode,
            price: productItem.price,
            stock: 9999,
            low_stock_threshold: 0,
            sku_options: [],
          },
        })
        if(response?.status === "success"){
          fetchCartCount(tmpId)
          setToastNotification({type: 'success',message: 'Add to cart'})
          setShowMainPageLoader(false)
        }
      }catch(error){
          setShowMainPageLoader(false)
          if(axios.isAxiosError(error)){
            const status = error.response?.status
            const message = error.response?.data?.err
             if (status === 400) {
                setToastNotification({
                    type: 'error',
                    message: message || 'Something Went Wrong!'
                })
            } else {
                setToastNotification({
                    type: 'error',
                    message: message || 'Something Went Wrong!'
                })
            }
          }
        
      }finally{
          setShowMainPageLoader(false)
      }
    }else{
      router.push("/my-account");
    }


    // setMessage(null);
    // setLoadingId(productId);
    // console.log("===========> handle cart")
    // try {
    //   await addToCart(productId, 1);
    //   setMessage("Added to cart.");
    // } catch (error) {
    //   console.log("===========> handle cart",error)

    //   if (error instanceof Error && error.message === "Not authenticated") {
    //     window.location.href = "/my-account";
    //     return;
    //   }
    //   setMessage(error instanceof Error ? error.message : "Unable to add to cart");
    // } finally {
    //   setLoadingId(null);
    // }




  };

  return (
    
    <div>
      {message && <p className="text-sm text-blue-600 mb-4">{message}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((item) => (
          <div key={item.id} className="group relative bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <div className="relative h-[280px] overflow-hidden bg-gray-100">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {item.originalPrice > item.price && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  SALE
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="text-xs font-bold text-blue-600 mb-2 uppercase">{item.category}</p>
              <h3 className="text-sm font-semibold text-[#0b2e59] mb-3 line-clamp-2 h-10">{item.title}</h3>

              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-[#0b2e59]">${item.price.toFixed(2)}</span>
                {item.originalPrice > item.price && (
                  <span className="text-xs text-gray-400 line-through">${item.originalPrice.toFixed(2)}</span>
                )}
              </div>

              <button
                className="w-full bg-[#0b2e59] hover:bg-[#0a2246] text-white font-semibold py-2 px-4 rounded text-sm transition-colors disabled:opacity-70"
              onClick={() => handleAddToCart(item)}
                // disabled={loadingId === item.id}
              >
                {user? "Add to Cart" : "Login"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
