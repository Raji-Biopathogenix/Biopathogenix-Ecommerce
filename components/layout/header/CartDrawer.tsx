"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchCategories, sortCategories, CATEGORY_FALLBACK, type Category } from "@/lib/categories";
import {CartServices} from "@/services/cartServices";
import {CartItem} from "@/types/cart";
import {useAuth} from "@/context/AuthContext";
import {useToast} from "@/context/ToastContext";
import axios from "axios";
import CartVariantDetails from "@/components/common/CartVariantDetails";
import {removeCartItem} from "@/lib/cart";
import "./cart-drawer.css";

type CartDrawerProps = {
  open: boolean;
  cartCount:number;
  onClose: () => void;
  onCartCountChange?: (count: number) => void;
};

export default function CartDrawer({ open, onClose, onCartCountChange,cartCount }: CartDrawerProps) {
  const [categories, setCategories] = useState<Category[]>(CATEGORY_FALLBACK);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const [subTotal, setSubtotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const {tmpId,setShowMainPageLoader} = useAuth()
  const {setToastNotification} = useToast()

  useEffect(() => {
    if(open){
      fetchCategories().then((data) => {
        const sorted = sortCategories(data.length ? data : CATEGORY_FALLBACK);
        setCategories(sorted);
        setCategoriesLoaded(true);
      });

    }
  }, [open]);


  const fetchCartItems = async()=>{
      setShowMainPageLoader(true)
      try{
        const response = await CartServices.getcartItems(tmpId)
        if(response?.status === "success"){
          setShowMainPageLoader(false)
          setCart(response?.result?.data)
          setToastNotification({type: 'success',message: response.message })
        }
      }catch(error) {
          setShowMainPageLoader(false)
          if(axios.isAxiosError(error)){  
            const message = error.response?.data?.err
            setToastNotification({
                    type: 'error',
                    message: message || 'Something Went Wrong!'
            })
          }
    }
  }

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    if (quantity < 1) {
      await handleRemove(itemId);
      return;
    }

    setShowMainPageLoader(true);
    try {
      const response = await CartServices.updateCartItem(itemId, quantity);
      if (response?.status === "success") {
        setCart((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, quantity, total_price: quantity * item.price } : item,
          ),
        );
        setToastNotification({ type: "success", message: "Cart updated!" });
      }
    } catch (err) {
      setToastNotification({ type: "error", message: "Unable to update cart" });
    } finally {
      setShowMainPageLoader(false);
    }
  };

  const handleRemove = async (itemId: number) => {
    setShowMainPageLoader(true);
    try {
      await removeCartItem(itemId);
      setCart((prev) => prev.filter((item) => item.id !== itemId));
      onCartCountChange?.(cartCount - 1);
      setToastNotification({ type: "success", message: "Item removed from cart!" });
    } catch (err) {
      setToastNotification({ type: "error", message: "Unable to remove item" });
    } finally {
      setShowMainPageLoader(false);
    }
  };

  useEffect(() => {
    if(open){
      fetchCartItems()    
    }
  }, [open]);

  


  useEffect(()=>{
    const totalPrice = cart.reduce((sum, item) => sum + (item.total_price), 0)
    setSubtotal(totalPrice)
  },[cart])


  


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
          {cartCount > 0 && <div className="cart-drawer-subtotal">Subtotal: ${subTotal}</div>}
        </div>

        <div className="cart-drawer-body">
          {loading && <p>Loading...</p>}
          {!loading && cartCount === 0 && (
            <p className="cart-drawer-empty">No products in the cart.</p>
          )}
          {!loading && cartCount > 0 && (
            <div className="cart-drawer-items">
              {cart?.map((item) => (
                <div key={item.id} className="cart-drawer-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={item.product_obj?.primary_image?.image || "/images/shop/96-Well-PCR-Plate-1-scaled.jpg"}
                    alt={item.product_obj.name}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, background: '#f3f8fc' }}
                  />
                  <div>
                    <div className="cart-drawer-item-name">{item.product_obj.name}</div>
                    <CartVariantDetails variantOptions={item.variant_options} className="mt-1" />
                    <div className="cart-drawer-item-meta">
                      Qty: {item.quantity} · ${item.price}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        className="px-3 py-1 text-xs border border-[#dce7f1] rounded"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="text-sm">{item.quantity}</span>
                      <button
                        className="px-3 py-1 text-xs border border-[#dce7f1] rounded"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                      <button
                        className="text-xs text-[#9aa8b5] hover:text-red-600"
                        onClick={() => handleRemove(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
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

          <div className="cart-drawer-category">
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
          </div>
        </div>
      </aside>
    </div>
  );
}
