"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchCategories, sortCategories, CATEGORY_FALLBACK, type Category } from "@/lib/categories";
import { CartServices } from "@/services/cartServices";
import { CartItem } from "@/types/cart";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import axios from "axios";
import CartVariantDetails from "@/components/common/CartVariantDetails";
import { removeCartItem } from "@/lib/cart";
import "./cartModal.css";
import Button from "@/components/common/Button";
import { CrossIcon } from "@/components/app_icons/app_icons";
import QtyStepper from "@/components/common/QtyStepper/qtyStepper";

type CartModalProps = {
  open: boolean;
  cartCount: number;
  onClose: () => void;
  onCartCountChange?: (count: number) => void;
};

export default function CartModal({ open, onClose, onCartCountChange, cartCount }: CartModalProps) {
  const [categories, setCategories] = useState<Category[]>(CATEGORY_FALLBACK);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartItemId, setCartItemID] = useState<number>(0)

  const [subTotal, setSubtotal] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const { tmpId, setShowMainPageLoader } = useAuth()
  const { setToastNotification } = useToast()

  useEffect(() => {
    if (open) {
      fetchCategories().then((data) => {
        const sorted = sortCategories(data.length ? data : CATEGORY_FALLBACK);
        setCategories(sorted);
        setCategoriesLoaded(true);
      });

    }
  }, [open]);


  const fetchCartItems = async () => {
    setShowMainPageLoader(true)
    try {
      const response = await CartServices.getcartItems(tmpId)
      if (response?.status === "success") {
        setShowMainPageLoader(false)
        setCart(response?.result?.data)
        setToastNotification({ type: 'success', message: response.message })
      }
    } catch (error) {
      setShowMainPageLoader(false)
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.err
        setToastNotification({
          type: 'error',
          message: message || 'Something Went Wrong!'
        })
      }
    }
  }

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    setCartItemID(itemId)
    try {
      let response = await CartServices.updateCartItem(itemId, quantity)
      if (response.status === "success") {
        let resData = response?.result?.data
        setCart((prev) => prev.map((item) => item.id === itemId ? { ...item,...resData, low_stock: quantity > resData?.product_sku?.stock  } : item));
        setToastNotification({ type: 'success', message: response?.message });
      }
    } catch (error:any) {
      setToastNotification({ type: "error", message:error?.message });
    }
    finally {
      setCartItemID(0)
    }
  };

    const handleRemove = async (itemId: number) => {
    setCartItemID(itemId)
    try {
      let response = await CartServices.deleteCartItem(itemId)
      if (response.status === "success") {
        const updateditems = cart.filter((item) => item?.id !== itemId)
        setCart(updateditems)
      }
    } catch (error:any) {
      setToastNotification({ type: "error", message:error?.message });
    }
    finally {
      setCartItemID(0)
    }
  };

  useEffect(() => {
    if (open) {
      fetchCartItems()
    }
  }, [open]);




  useEffect(() => {
    const totalPrice = cart.reduce((sum, item) => sum + Number(item.total_price), 0)
    setSubtotal(totalPrice)
  }, [cart])




  const cartTitle = useMemo(() => {
    if (loading) return "Loading cart...";
    if (cartCount === 0) return "Your Shopping Cart 0";
    return `Your Shopping Cart ${cartCount}`;
  }, [loading, cartCount]);

  if (!open) return null;

  return (
    <div className="cart-drawer-overlay" role="dialog" aria-modal="true">
      <div className="cart-drawer-backdrop" onClick={onClose} />
      <aside className="cart-drawer-panel">
        <button className="cart-drawer-close" onClick={onClose} aria-label="Close cart">
          ×
        </button>

        <div className="cart-drawer-header">
          <h3>{cartTitle}</h3>
          {cartCount > 0 && <div className="cart-drawer-subtotal">Subtotal: ${subTotal.toFixed(2)}</div>}
        </div>

        <div className="cart-drawer-body">
          {loading && <p>Loading...</p>}
          {!loading && cartCount === 0 && (
            <p className="cart-drawer-empty">No products in the cart.</p>
          )}
          {!loading && cartCount > 0 && (
            <div className="cart-drawer-items">
              {cart?.map((item, idx) => (

                <CartitemRow key={`item-${item?.id}-idx-${idx}`} item={item} handleQuantityChange={handleQuantityChange} handleRemove={handleRemove} cartItemId={cartItemId} />

              ))}
              <div className="cart-drawer-actions">
                <Link className="cart-drawer-link" href="/cart">
                  View cart
                </Link>
                <Link className="cart-drawer-link" href="/checkout">
                  Checkout
                </Link>
              </div>
            </div>
          )}

          {cartCount === 0 && <div className="cart-drawer-category">
            <h4>Shop by Category</h4>
            <ul>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/product-category/${category.slug}`}>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
            <Link className="cart-drawer-shop" href="/shop">
              Shop All
            </Link>
          </div>}
        </div>
      </aside>
    </div>
  );
}

export interface CartitemRowProps {
  item: CartItem
  handleQuantityChange: (itemId: number, quantity: number) => void
  handleRemove: (itemId: number) => void,
  cartItemId?:number
}


function CartitemRow({ item, handleQuantityChange, handleRemove,cartItemId }: CartitemRowProps) {

  const [qty,setQty] = useState(item?.quantity)
  const [qtyErrorMsg,setQtyErrorMsg] = useState<string | null>(null)





  return (<div key={item.id} className="cart-drawer-item mb-5" style={{}}>
    {cartItemId === item.id  && (
        <div className="cart-overlay">
          <div className="cart-spinner" />
        </div>
    )}

    <img
      src={item.product_obj?.primary_image?.image || "/images/shop/96-Well-PCR-Plate-1-scaled.jpg"}
      alt={item.product_obj.name}
      style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, background: '#f3f8fc' }}
    />
    <div style={{flex:1}}>
      <div className="flex justify-between items-start " >
        <div className="cart-drawer-item-name">{item.product_obj.name}</div>

        <Button 
        customClass="text-xs cursor-pointer"
        onClick={() =>  handleRemove(item.id)}
        btnLable={<CrossIcon />}
        />


      </div>
      <CartVariantDetails variantOptions={item.variant_options} className="mt-1" />
      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-2 items-center">
        <QtyStepper handleQuantityChange={(val) => {if(val && val !== item?.quantity) handleQuantityChange(item?.id,val) }}  is_cart={true} customClass={`cart_quantity`} stock={item?.product_sku?.stock ?? 0}  qty={qty} setQty={setQty}   setQtyErrorMsg={setQtyErrorMsg}
        Skuobj={!!(item?.product_sku)} />

        <span className="text-xs text-[#002C56] font-medium"> ${item?.price} </span>
        </div>

        {qty > 1 && <div>
          <span  className="text-xs text-[#002C56] font-medium"> ${item?.total_price}</span>
        </div>}
        
      </div>

      {qtyErrorMsg ? <> 
        <div className="flex items-center my-3 ">
              <span className="ms-1 font-semibold text-xs text-rose-500">{qtyErrorMsg}  </span> 
        </div>
        </> : ""
      }
    </div>
  </div>)
}