import { CartItem } from "@/types/cart";

interface OrderSummaryProps {
  cart: CartItem[];
  subtotal: number;
  shippingCost: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  formatCurrency: (value: number | string) => string;
  couponcode: string
  setCouponcode :(msg: string) => void
  ApplyCouponCode :(code: string) => void
  RemoveCouponCode :() => void
  couponAmount: number
  freeShipping: boolean
}

export default function OrderSummary({
  cart,
  subtotal,
  shippingCost,
  taxRate,
  taxAmount,
  total,
  formatCurrency,
  couponcode,
  setCouponcode,
  ApplyCouponCode,
  RemoveCouponCode,
  couponAmount,
  freeShipping
}: OrderSummaryProps) {
  return (
    <section className="space-y-6">
      <div className="border rounded-lg p-5">
        <h2 className="text-xl font-semibold text-[#0b2e59] mb-4">Your order</h2>
        <div className="space-y-4">
          {cart?.length ? (
            cart.map((item) => (
              <div key={item.id} className={`${item?.removeitem? `bg-[#e7000b] text-white`  : item?.low_stock? `bg-[#ffff00] ` : ``}   flex items-start justify-between gap-4`}>
                <div className="flex gap-3">
                  {item.product_obj?.primary_image?.image && (
                    <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                      <img src={item.product_obj.primary_image.image} alt={item.product_obj.name} className="w-full h-full object-cover rounded" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm text-[#0b2e59]">{item.product_obj?.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">${formatCurrency(item.total_price)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Your cart is empty.</p>
          )}

          <div className="border-t pt-4 space-y-2 text-sm">
              {/* <div className="mt-6 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Coupon code"
                  value={`${couponcode}`}
                  onChange={(e) => setCouponcode(e.target.value)}
                  className="flex-1 rounded border border-[#e6eef5] px-3 py-2 text-sm"
                />
                <button 
                className="rounded bg-[#e5edf4] px-4 py-2 text-xs font-semibold uppercase text-[#0b2e59]"
                onClick={()=> ApplyCouponCode(couponcode)}>
                  Apply
                </button>
            </div> */}

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

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold">${(subtotal)}</span>
            </div>
            
            {couponAmount > 0 && <div className="flex items-center justify-between">
              <span className="flex flex-col">
                  <span>CoponCode {cart[0]?.coupon_val}{cart[0]?.coupon_type != 'fixed' ? '%' : ''}</span>
                </span>
              <span className="font-semibold">${(couponAmount)}</span>
            </div>}

            <div className="flex items-center justify-between">
              <span className="text-gray-500">Shipping {freeShipping?<span className="text-xs text-green-600 font-medium">(Free Shipping)</span>:""}</span>
              <span className="font-semibold">${(shippingCost)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Tax {taxRate ? `(${(taxRate * 100).toFixed(2)}%)` : ""}</span>
              <span className="font-semibold">${(taxAmount)}</span>
            </div>
          </div>

          <div className="border-t pt-4 flex items-center justify-between">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-lg font-bold text-[#0b2e59]">${(total)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
