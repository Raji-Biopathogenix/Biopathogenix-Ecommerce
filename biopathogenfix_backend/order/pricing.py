"""Authoritative checkout pricing. Never accept monetary values from the browser."""
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

from django.utils import timezone

from cart.services import UPSService
from coupon.models import Coupon
from prd_variant.models import ProductSKU
from settings.models import Settings
from users.models import CustomizableProductprices
from .models import Order
from .tax_service import (calculate_tax_and_shipping, _resolve_country_code,
                          _resolve_state_code, US_STATE_TAX_RATES)


def money(value):
    try:
        value = Decimal(str(value))
        if not value.is_finite() or value < 0:
            raise ValueError
        return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError('Invalid monetary amount.') from None


def catalog_price(product, sku, user):
    base = sku.price
    if product.is_customizable and getattr(user, 'laboratory_id', None):
        custom = CustomizableProductprices.objects.filter(
            product=product, laboratory_id=user.laboratory_id,
        ).first()
        if custom is not None:
            base = custom.price
    base = money(base)
    discount = Decimal(str(product.discount_value or 0))
    if not discount.is_finite() or not 0 <= discount <= 100:
        raise ValueError('Invalid product discount configuration.')
    return base, money(base * (100 - discount) / 100)


def price_items(items, user):
    if not items:
        raise ValueError('Your cart is empty.')
    for item in items:
        sku = ProductSKU.objects.filter(
            product=item.product, sku_code=item.sku_code, is_active=True,
        ).first()
        if not item.product.is_active or not sku:
            raise ValueError('One of the selected products is no longer available.')
        if item.quantity < 1 or sku.stock < item.quantity:
            raise ValueError('A selected product has insufficient stock.')
        base, item.price = catalog_price(item.product, sku, user)
        item.total_price = money(item.price * item.quantity)
        item.discount_value = item.product.discount_value or 0
        item.discount_amt = money((base - item.price) * item.quantity)
        item.save(update_fields=['price', 'total_price', 'discount_value', 'discount_amt'])
        item.checkout_sku = sku
    return money(sum(item.total_price for item in items))


def coupon_discount(items, user, subtotal):
    codes = {item.coupon_code for item in items if item.coupon_code}
    if not codes:
        return None, Decimal('0.00')
    if len(codes) != 1:
        raise ValueError('Please reapply your coupon.')
    coupon = Coupon.objects.filter(code=codes.pop()).first()
    today = timezone.localdate()
    if (not coupon or not coupon.is_active or coupon.status != 'active'
            or not coupon.start_date <= today <= coupon.end_date
            or subtotal < coupon.min_price
            or (coupon.max_price is not None and subtotal > coupon.max_price)):
        raise ValueError('This coupon is no longer valid for your cart. Please remove it.')
    orders = Order.objects.filter(coupon_code=coupon.code)
    if ((coupon.total_count and max(coupon.used_count, orders.count()) >= coupon.total_count)
            or (coupon.per_user_limit and orders.filter(user=user).count() >= coupon.per_user_limit)):
        raise ValueError('This coupon has reached its usage limit. Please remove it.')
    value = money(coupon.discount_value)
    if coupon.discount_type == 'percentage':
        value = money(subtotal * value / 100)
    elif coupon.discount_type != 'fixed':
        raise ValueError('Invalid coupon configuration.')
    # Keep the cart display in sync if an administrator changed this coupon.
    for item in items:
        item.coupon_code = coupon.code
        item.coupon_val = coupon.discount_value
        item.coupon_type = coupon.discount_type
        item.save(update_fields=['coupon_code', 'coupon_val', 'coupon_type'])
    return coupon, min(subtotal, value)


def shipping_quote(items, address):
    # Match the existing category fees and shipping exemption policy.
    from cart.views import _category_group

    groups = {item.id: _category_group(item.product) for item in items}
    group_a = [item for item in items if groups[item.id] == 'A']
    group_b = [item for item in items if groups[item.id] == 'B']
    fee = Decimal('0.00')
    if group_a and sum(item.total_price for item in group_a) < 500:
        fee += 20
    fee += 20 * len(group_b)
    record = Settings.objects.filter(name='shipping_exemption').first()
    threshold = money(record.value if record and record.value else 0)
    optional_total = sum(item.total_price for item in items if not item.product.is_shipping_required)
    shipped = [item for item in items if item.product.is_shipping_required or optional_total < threshold]
    if not shipped:
        return fee
    other_items = any(groups[item.id] not in ('A', 'B') for item in shipped)
    if fee > 0 and not other_items:
        return fee
    # Group A remains free once its own subtotal reaches the threshold.
    if group_a and not group_b and not other_items:
        return fee
    package = {name: sum(getattr(item.checkout_sku, field) * item.quantity for item in shipped)
               for name, field in [('length_in', 'length'), ('width_in', 'width'),
                                   ('height_in', 'height'), ('weight_lb', 'weight')]}
    package['weight_lb'] = max(package['weight_lb'], Decimal('0.10'))
    package['totalCartItems'] = len(shipped)
    rates = UPSService().get_rates(recipient_address=address, package=package)
    if not rates:
        raise ValueError('Unable to calculate shipping. Please try again.')
    if rates[0].get('currency', 'USD') != 'USD':
        raise ValueError('Unsupported shipping currency.')
    return money(fee + money(rates[0]['total_charge']))


def checkout_quote(items, user, address):
    # Use the actual address fields, not independently supplied code aliases.
    country = _resolve_country_code(address.get('country'))
    state = _resolve_state_code(address.get('state'))
    if country != 'US' or state not in US_STATE_TAX_RATES:
        raise ValueError('Please select a valid US shipping country and state.')
    address['country_code'] = country
    address['state_code'] = state
    subtotal = price_items(items, user)
    coupon, discount = coupon_discount(items, user, subtotal)
    shipping = shipping_quote(items, address)
    # Preserve the existing tax preview policy: tax is quoted on the product
    # subtotal; coupon discounts are deducted separately from the final total.
    tax = calculate_tax_and_shipping(
        subtotal=subtotal, shipping_cost=shipping,
        shipping_state=address.get('state_code') or address.get('state'),
        shipping_country=address.get('country_code') or address.get('country'),
        shipping_postal_code=address.get('postal_code'),
        shipping_city=address.get('city', ''),
        shipping_address_line1=address.get('address_line1', ''),
        item_quantity=sum(item.quantity for item in items),
    )
    return dict(subtotal=subtotal, shipping_cost=shipping,
                tax_amount=money(tax['tax_amount']), tax_rate=Decimal(str(tax['tax_rate'])),
                coupon_code=coupon.code if coupon else '',
                coupon_val=coupon.discount_value if coupon else Decimal('0'),
                coupon_type=coupon.discount_type if coupon else '', coupon_amt=discount,
                amount=money(subtotal - discount + shipping + money(tax['tax_amount'])))
