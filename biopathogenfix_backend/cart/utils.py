
from .serializers import CartCreateSerializer,CartUpdateSerializer,CartResponseSerializer
from rest_framework.response import Response
from rest_framework import status
from api.views import get_or_none
from .models import Cart,CartVariants
from django.db.models import Count
from product.models import Product

def _get_price_from_value(raw_value, fallback):
    try:
        return float(raw_value) if raw_value not in (None, "") else float(fallback)
    except (TypeError, ValueError):
        return float(fallback)


def _resolve_cart_price(cartData, sku_payload, fallback_price):
    base_price = _get_price_from_value(sku_payload.get('price'), fallback_price)

    if not cartData.get('is_customizable', False):
        return base_price

    custom_price_data = cartData.get('prd_customization_prices') or {}
    custom_price_value = custom_price_data.get('price')
    return _get_price_from_value(custom_price_value, base_price)


def _apply_product_discount(product, price):
    discount_value = _get_price_from_value(getattr(product, 'discount_value', 0), 0)
    if discount_value <= 0:
        return round(price, 2)

    discounted_price = price * max(0, (100 - discount_value)) / 100
    return round(discounted_price, 2)


def _calculate_discount_amount(base_price, discounted_price, quantity):
    discount_per_unit = max(0, round(base_price - discounted_price, 2))
    return round(discount_per_unit * quantity, 2)


def _get_product_discount_value(product):
    return round(_get_price_from_value(getattr(product, 'discount_value', 0), 0), 2)


def CreateCartVariants(cart_id,skuObj):
    print("variants",skuObj.get('sku_options',[]))
    for eachObj in skuObj.get('sku_options',[]):
        print("eachObj",eachObj)
        CartVariants.objects.create(cart_id=cart_id,variant_option_id=eachObj['variant_option_id']) 




def UpdateItemToCart(request,cartData,existed_cart_item):
    skuObj = cartData.get('skuObj') or {}
    product = existed_cart_item.product
    stock_value = skuObj.get('stock')
    stock = 0
    if stock_value not in (None, ""):
        try:
            stock = int(float(stock_value))
        except (ValueError, TypeError):
            stock = 0
    qty = existed_cart_item.quantity + int(float(cartData.get('quantity', 0)))
    base_price = _resolve_cart_price(cartData, skuObj, product.price)
    price = _apply_product_discount(product, base_price)

    
    if stock:
        final_quantity = min(qty, stock)
    else:
        final_quantity = qty

    existed_cart_item.quantity = final_quantity
    existed_cart_item.price = price
    existed_cart_item.total_price = final_quantity * price
    existed_cart_item.discount_value = _get_product_discount_value(product)
    existed_cart_item.discount_amt = _calculate_discount_amount(base_price, price, final_quantity)
    existed_cart_item.has_variants  = cartData.get('has_variants', existed_cart_item.has_variants)
    
    existed_cart_item.save()
    cartupdateData=CartResponseSerializer(existed_cart_item,context={'request': request,'user_id':request.user.id}).data
    return Response({"status": "success","message": "Item Updated Successfully","result": {"data": cartupdateData}}, status=status.HTTP_200_OK)







def AddItemToCart(request,cartData):
    print("cartData payload", cartData)
    price=0.00
    sku_payload = cartData.get('skuObj') or {}
    product_id = cartData.get('product_id')
    if not product_id:
        return Response({"status": "error", "message": "Product ID is required."}, status=status.HTTP_400_BAD_REQUEST)

    product = get_or_none(Product, id=product_id)
    if not product:
        return Response({"status": "error", "message": "Product not found."}, status=status.HTTP_400_BAD_REQUEST)

    quantity = cartData.get('quantity', 1)
    try:
        quantity = int(float(quantity))
    except (TypeError, ValueError):
        quantity = 1
    quantity = max(quantity, 1)

    base_price = _resolve_cart_price(cartData, sku_payload, product.price)
    price = _apply_product_discount(product, base_price)

    total_price = price * quantity
    discount_value = _get_product_discount_value(product)
    discount_amt = _calculate_discount_amount(base_price, price, quantity)

    sku_code = sku_payload.get('sku_code')
    if not sku_code:
        sku_code = product.sku or f"product-{product_id}"

    has_variants = bool(cartData.get('has_variants'))
    tmp_id = cartData.get('tmp_id')
    if not tmp_id:
        return Response({"status": "error", "message": "tmp_id is required."}, status=status.HTTP_400_BAD_REQUEST)

    print("cartData in add to cart util total_price", total_price)

    cartDataDict = {
        "product": product_id,
        "quantity": quantity,
        'is_customizable': cartData.get('is_customizable', False),
        "tax_value": 0,
        "tmp_id": tmp_id,
        "price": price,
        "total_price": total_price,
        "discount_value": discount_value,
        "discount_amt": discount_amt,
        "sku_code": sku_code,
        "has_variants": has_variants,
    }
    if request.user.id:
        cartDataDict["user"] = request.user.id

    cartSerialize = CartCreateSerializer(data=cartDataDict)
    if cartSerialize.is_valid():
        cartSerialize.save()

        print("cartData['has_variants']", has_variants)

        if has_variants:
            CreateCartVariants(cartSerialize.data['id'], cartData.get('skuObj', {}))

        cartItem = get_or_none(Cart, id=cartSerialize.data['id'])
        cartItemData = CartResponseSerializer(cartItem, context={'request': request,'user_id':request.user.id}).data
        return Response({"status": "success", "message": "Item added to cart", "result": {"data": cartItemData}}, status=status.HTTP_201_CREATED)

    print("cartSerialize.errors", cartSerialize.errors)
    return Response({"status": "error", "errors": cartSerialize.errors, "message": "Something Went Wrong!"}, status=status.HTTP_400_BAD_REQUEST)



def cart_has_sku(cart_id: int, selected_option_ids: list[int]):
    return CartVariants.objects.filter(cart_id=cart_id,variant_option__id__in=selected_option_ids).values('variant_option_id').distinct().count()
