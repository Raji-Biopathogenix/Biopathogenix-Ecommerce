"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// import { Cart, clearCart, getCart, removeCartItem, updateCartItem } from "@/lib/cart";
import axios from "axios";

import { CartServices } from "@/services/cartServices";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import CartVariantDetails from "@/components/common/CartVariantDetails";
import { CartItem } from "@/types/cart";
import QtyStepper from "@/components/common/QtyStepper/qtyStepper";
import './cart.css';
import { CART_REMOVE_ITEM, CART_LOW_QUANTITY } from '@/components/utils/AppConstancts';

import { CouponCalulations } from '@/utils/helperFunction';
import ConfirmModal from '@/components/Modal/ConfirmModal';

const FALLBACK_IMAGE = "/images/shop/96-Well-PCR-Plate-1-scaled.jpg";

const getCartItemStock = (item: CartItem) =>
  Number(item?.product_sku?.stock ?? item?.product_obj?.stock_quantity ?? 0);

const getCartItemFlags = (item: CartItem) => {
  const stock = getCartItemStock(item);

  if (item?.has_variants && !item?.product_sku) {
    return { ...item, removeitem: true };
  }

  if (stock <= 0) {
    return { ...item, removeitem: true };
  }

  if (item?.quantity > stock) {
    return { ...item, low_stock: true };
  }

  return { ...item, low_stock: false, removeitem: false };
};

// export type updateditems = CartItem[]  | undefined



export default function CartPage() {
  const router = useRouter();
  const { tmpId, setShowMainPageLoader, reducerState, dispatch } = useAuth();
  const { setToastNotification } = useToast();


  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState<number>(0)
  const [total, setTotal] = useState<number>(0)
  const [couponAmount, setCouponAmount] = useState<number>(0)
  const [couponcode, setCouponcode] = useState<string>('')
  const [hideCheckoutBtn, setHideCheckoutBtn] = useState(false)
  const [cartItemId, setCartItemID] = useState<number>(0)
  const [selectedCartItemsCount, SetSelectedItemsCount] = useState<number>(0)
  const [showClearConfirm, setShowClearConfirm] = useState(false);





  useEffect(() => {
    if (reducerState.cartModalOpenFlag) {
      dispatch({ type: "CART_MODAL", payload: !reducerState.cartModalOpenFlag });
    }
  }, [reducerState])



  useEffect(() => {
    if (!cart?.length) {
      setSubtotal(0)
      setTotal(0)
      setCouponAmount(0)
      SetSelectedItemsCount(0)
      setHideCheckoutBtn(true)
      return
    }

    const selectedCartItems = cart.filter((item) => item?.selected)
    const selectedItemsCount = selectedCartItems.length
    const selectedSubtotal = selectedCartItems.reduce(
      (sum, item) => sum + Number(item.total_price),
      0
    )
    const hasInvalidSelectedItems = selectedCartItems.some(
      (item) => item?.low_stock === true || item?.removeitem === true
    )

    setSubtotal(selectedSubtotal)
    SetSelectedItemsCount(selectedItemsCount)
    setHideCheckoutBtn(selectedItemsCount === 0 || hasInvalidSelectedItems)

    if (cart?.[0]?.coupon_code) {
      const couponRes = CouponCalulations(
        selectedSubtotal,
        cart?.[0]?.coupon_val,
        cart?.[0]?.coupon_type
      )
      if (couponRes) {
        setTotal(couponRes?.totalAmt)
        setCouponAmount(couponRes?.couponAmt)
      } else {
        setTotal(selectedSubtotal)
        setCouponAmount(0)
      }
      setCouponcode(cart?.[0]?.coupon_code)
    } else {
      setTotal(selectedSubtotal)
      setCouponAmount(0)
    }
  }, [cart])





  const loadCart = async () => {
    setShowMainPageLoader(true)
    try {
      let response = await CartServices.getcartItems(tmpId)
      if (response.status === "success") {
        setShowMainPageLoader(false)

        const items = response?.result?.data ?? []
        const updateditems = items.map(getCartItemFlags)

        setCart(updateditems)
        // setSelectedItemIds(updateditems.map((item) => item.id))
      }
    } catch (error) {
      setShowMainPageLoader(false)
      if (axios.isAxiosError(error)) {

        const status = error.response?.status
        const message = error.response?.data?.err

        setToastNotification({
          type: 'error',
          message: message || 'Registration failed!'
        })
      }
    } finally {
      setShowMainPageLoader(false)
    }
  };

  useEffect(() => {
    if (tmpId) {
      loadCart();
    }
  }, [tmpId]);

  const handleQuantityChange = async (itemId: number, quantity: number) => {
    setCartItemID(itemId)
    try {
      let response = await CartServices.updateCartItem(itemId, quantity)
      if (response.status === "success") {
        console.log(response)
        let resData = response?.result?.data
        setCart((prev) => prev.map((item) => item.id === itemId ? getCartItemFlags({ ...item, ...resData }) : item));
        setToastNotification({ type: 'success', message: response?.message });
      }
    } catch (error: any) {
      setToastNotification({ type: "error", message: error?.message });
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
        if (updateditems?.length < 1) {
          router.push('/');
          return;
        }
        setCart(updateditems)
      }
    } catch (error: any) {
      setToastNotification({ type: "error", message: error?.message });
    }
    finally {
      setCartItemID(0)
    }
  };


  const ApplyCouponCode = async (code: string) => {
    setShowMainPageLoader(true)
    try {
      let response = await CartServices.applyCouponCode(tmpId, code)

      if (response.status === "success") {
        if (response?.result) {
          const updateditems = cart.map((e) => ({ ...e, coupon_code: response?.result?.coupon_code, coupon_val: response?.result?.coupon_val, coupon_type: response?.result?.coupon_type }))
          setCart(updateditems)
        }
      }
    } catch (error: any) {
      setToastNotification({ type: "error", message: error?.message });
    }
    finally {
      setShowMainPageLoader(false)
    }
  };


  const RemoveCouponCode = async () => {
    if (couponcode) {
      setShowMainPageLoader(true)
      try {
        let response = await CartServices.removeCouponCode(tmpId, couponcode)
        if (response.status === "success") {
          const updateditems = cart.map((e) => ({ ...e, coupon_code: '', coupon_val: 0.00, coupon_type: '' }))
          setCart(updateditems)
          setCouponcode('')
        }
      } catch (error: any) {
        setToastNotification({ type: "error", message: error?.message });
      }
      finally {
        setShowMainPageLoader(false)
      }

    }
  }

  const handleClearCart = async () => {

    setShowMainPageLoader(true);
    try {
      const response = await CartServices.clearCart(tmpId);
      if (response?.status === "success") {
        setCart([]);
        setToastNotification({ type: "success", message: "Cart cleared." });
      }
    } catch (error: any) {
      setToastNotification({ type: "error", message: error?.message });
    } finally {
      setShowMainPageLoader(false);
    }
  };

  const handleSelectItem = async (itemId: number, checked: boolean) => {
    setCartItemID(itemId)
    try {
      let response = await CartServices.updateCartItemSelect(itemId, checked)
      if (response.status === "success") {
        setCart((prev) => prev.map((item) => item.id === itemId ? { ...item, selected: checked, coupon_code: '', coupon_val: 0.00, coupon_type: '' } : item));
        setCouponcode('')
        setToastNotification({ type: "success", message: response?.message });
      }
    } catch (error: any) {
      setToastNotification({ type: "error", message: error?.message });
    }
    finally {
      setCartItemID(0)
    }
  };


  const handleToggleAll = async () => {
    let type = 'select_all', checkboxVal = true
    if (selectedCartItemsCount === cart.length) {
      type = 'deselect_all'
      checkboxVal = false
    }

    setShowMainPageLoader(true);
    try {
      let response = await CartServices.updateAllCartItemSelection(tmpId, type)
      if (response.status === "success") {
        console.log("===>", "succes")

        setCart((prev) => prev.map((item) => ({ ...item, selected: checkboxVal, coupon_code: '', coupon_val: 0.00, coupon_type: '' })));
        setCouponcode('')
        setToastNotification({ type: "success", message: response?.message });
      }
    } catch (error: any) {
      setToastNotification({ type: "error", message: error?.message });
    }
    finally {
      setShowMainPageLoader(false);
    }
  };

  const handleProceedToCheckout = () => {
    router.push(`/checkout`);
  };


  console.log("total", total, "subtotal", subtotal, "cart", cart)



  return (
    <main className="max-w-6xl mx-auto px-6 py-12 text-[#0b2e59]">

      <ConfirmModal
        isOpen      = {showClearConfirm}
        title       = "Clear cart?"
        description = {`This will remove all ${cart?.length ?? 0} items from your cart. This action cannot be undone.`}
        confirmLabel= "Yes, clear it"
        cancelLabel = "No, keep it"
        onConfirm   = {handleClearCart}
        onClose     = {() => setShowClearConfirm(false)}
      />
      <h1 className="text-4xl font-semibold mb-6">Cart</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="col-span-2">
          <div className="flex items-center gap-4 text-xs uppercase tracking-wide text-[#5b6b7b]">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full border border-[#0b2e59] flex items-center justify-center text-[11px] font-semibold text-[#0b2e59]">1</span>
              <span className="font-semibold text-[#0b2e59]">Shopping Cart</span>
            </div>
            <div className="h-px flex-1 bg-[#dce7f1]" />
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full border border-[#dce7f1] flex items-center justify-center text-[11px]">2</span>
              <span>Shipping and Checkout</span>
            </div>
            <div className="h-px flex-1 bg-[#dce7f1]" />
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-full border border-[#dce7f1] flex items-center justify-center text-[11px]">3</span>
              <span>Confirmation</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-[#5b6b7b] mb-4">
            <p className="text-[12px] text-[#5b6b7b]">
              Check the items you want to proceed with; unselected items will stay in the cart.
            </p>
            <button
              type="button"
              onClick={handleToggleAll}
              className="text-blue-600 hover:underline text-[12px]"
            >
              {selectedCartItemsCount === cart.length ? "Deselect All" : "Select All"}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {cart.length === 0 ? (
        <div className="bg-white border border-[#e6eef5] rounded p-6">
          <p className="text-gray-700">Your cart is empty.</p>
          <Link href="/" className="inline-block mt-4 text-blue-600 hover:underline">
            Continue shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#f3f8fc] rounded-lg p-5 text-xs uppercase font-semibold text-[#1b3b5d]">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">Product</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2 text-right">Subtotal</div>
              </div>
            </div>

            {cart.map((item, idx) => {

              return (
                <CartItemRow key={`item-${item?.id}-idx-${idx}`} item={item} selectedItemIds={selectedItemIds} handleRemove={handleRemove} handleQuantityChange={handleQuantityChange} handleSelectItem={handleSelectItem} cartItemId={cartItemId} />
              )
            })}
          </div>

          <aside className="bg-white border border-[#e6eef5] rounded-lg p-6 h-fit">
            <h3 className="text-sm font-semibold uppercase mb-6">Cart Totals</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Selected items</span>
                <span className="font-semibold">{selectedCartItemsCount}</span>
              </div>
              {subtotal > 0 && <div className="flex items-center justify-between">
                <span>Selected subtotal</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>}
              <div className="flex items-center justify-between">
                <span>Tax</span>
                <span className="font-semibold">$0.00</span>
              </div>
              {couponAmount > 0 && <div className="flex items-center justify-between">
                <span className="flex flex-col">
                  <span>CoponCode {cart[0]?.coupon_val}{cart[0]?.coupon_type != 'fixed' ? '%' : ''}</span>
                </span>

                <span className="font-semibold">${couponAmount}</span>
              </div>}

              <p className="text-xs text-[#5b6b7b] italic">
                Taxes and shipping are calculated at checkout.
              </p>
              {total > 0 && <div className="flex items-center justify-between border-t border-[#e6eef5] pt-4">
                <span className="font-semibold">Selected total</span>
                <span className="font-semibold">${total?.toFixed(2)}</span>
              </div>}
            </div>

            <div className="mt-6">

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={couponcode}
                  onChange={(e) => setCouponcode(e.target.value)}
                  className="flex-1 rounded border border-[#e6eef5] px-3 py-2 text-sm"
                />
                <button
                  disabled={!couponcode || couponcode.length < 3}
                  onClick={() => { if (couponcode && couponcode.length >= 3) ApplyCouponCode(couponcode); }}
                  className={`rounded bg-[#e5edf4] px-4 py-2 text-xs font-semibold uppercase text-[#0b2e59]
                ${couponcode && couponcode.length >= 3 ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`}
                >
                  Apply
                </button>
              </div>

              {couponAmount > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-green-600 font-medium">
                    ✓ {couponcode} applied
                  </span>
                  <button
                    onClick={RemoveCouponCode}
                    className="text-xs text-red-500 hover:text-red-700 font-medium underline"
                  >
                    Remove
                  </button>
                </div>
              )}

            </div>

            {!hideCheckoutBtn && (
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className={`mt-6 block text-center rounded py-3 text-sm font-semibold uppercase text-white bg-[#3b82c4] hover:bg-[#2563eb]`}
              >
                Proceed to Checkout
              </button>
            )}

            <button
              className="mt-4 text-xs text-[#8a99a8] hover:text-[#0b2e59]"
              onClick={()=> setShowClearConfirm(true)}
            >
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}



export interface CartitemRowProps {
  item: CartItem
  selectedItemIds: Number[]
  handleSelectItem: (itemId: number, checked: boolean) => void
  handleQuantityChange: (itemId: number, quantity: number) => void
  handleRemove: (itemId: number) => void,
  cartItemId?: number
}

function CartItemRow({ item, selectedItemIds, handleRemove, cartItemId, handleQuantityChange, handleSelectItem }: CartitemRowProps) {
  const [qty, setQty] = useState(item?.quantity)

  const [qtyErrorMsg, setQtyErrorMsg] = useState<string | null>(null)
  const availableStock = getCartItemStock(item)
  const lowStockMsg = CART_LOW_QUANTITY.replace("CurrentStockVal", `${availableStock}`)
  const rowStateClass = item?.removeitem
    ? "cart-row-remove"
    : item?.low_stock
      ? "cart-row-low-stock"
      : "bg-white"


  return (

    item && <div key={item.id} className={`${rowStateClass} border border-[#e6eef5] rounded-lg p-5 cart-drawer`}>

      {cartItemId === item.id && (
        <div className="cart-overlay">
          <div className="cart-spinner" />
        </div>
      )}




      {qtyErrorMsg ? (
        <div className="cart-row-notice cart-row-notice-error">
          <span className="font-semibold text-xs">{qtyErrorMsg}</span>
        </div>
      ) : item?.selected && item?.removeitem ? (
        <div className="cart-row-notice cart-row-notice-remove">
          <span className="font-semibold text-xs">{CART_REMOVE_ITEM}</span>
        </div>
      ) : item?.selected && item?.low_stock ? (
        <div className="cart-row-notice cart-row-notice-low-stock">
          <span className="font-semibold text-xs">{lowStockMsg}</span>
        </div>
      ) : (
        <></>
      )}


      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-6 flex items-center gap-4">
          <input
            type="checkbox"
            checked={item?.selected}
            onChange={(e) => handleSelectItem(item.id, e.target.checked)}
            className="h-4 w-4 accent-blue-600"
            aria-label={`Select ${item.product_obj.name}`}
          />
          <img
            src={item.product_obj.primary_image?.image || FALLBACK_IMAGE}
            alt={item.product_obj.name}
            className="w-16 h-16 object-cover rounded"
          />
          <div>
            <h2 className="font-semibold text-[#0b2e59]">{item.product_obj.name}</h2>
            <CartVariantDetails variantOptions={item.variant_options} className="mt-1" />
            <button
              className="text-xs mt-1 cursor-pointer "
              // text-red-600
              onClick={() => handleRemove(item.id)}
            >
              Remove
            </button>
          </div>
        </div>
        <div className="col-span-2 text-sm">
          ${Number(item.price).toFixed(2)}
        </div>
        <div className="col-span-2">
          <div className="inline-flex border border-[#dce7f1] rounded">

            <QtyStepper handleQuantityChange={(val) => {
              if (val && val !== item?.quantity && !item?.removeitem) handleQuantityChange(item?.id, val)
            }} is_cart={true} customClass={`cart_quantity`} stock={availableStock} qty={qty} setQty={setQty} setQtyErrorMsg={setQtyErrorMsg}
              Skuobj={item?.has_variants ? !!item?.product_sku : true} />
          </div>
        </div>
        <div className="col-span-2 text-right font-semibold">
          ${Number(item.total_price).toFixed(2)}
        </div>
      </div>
    </div>


  )
}
