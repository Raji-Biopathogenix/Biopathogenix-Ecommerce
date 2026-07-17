import logging
import uuid
from decimal import Decimal, InvalidOperation
from django.db import transaction as db_transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated,IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from datetime import datetime
from cart.services import UPSService
from services.emailService import send_graph_email
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Sum, Q, F
from .models import Order,OrderItem,OrderVariants,OrderStatusUpdate,Shipment
from .tax_service import calculate_tax_and_shipping
from .serializers import OrderDetailSerializer,AllOrderSerializer,FetchOrderItemSerializer,ShipmentOrderSerailizer,ShipmentSerializer,CancelOrderSerializer,RefundOrderSerializer
from product.models import Product
from payments.utils import (
    get_valid_qb_token,
    charge_card,
    create_qb_invoice,
    notify_admin_critical,
    refund_qb_charge
)
from payments.stripe_utils import refund_stripe_payment, verify_checkout_payment_intent
from prd_variant.models import ProductSKU
from payments.validators import validate_checkout_payload
from django.utils import timezone

from users.models import UserRole
from api.views import get_or_none
from config.settings import configSettings
from payments.models import UPSConfig

from cart.models import Cart,CartVariants
from django.core.mail import EmailMultiAlternatives
from users.models import CustomUser
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404, render
from .services import create_outbound_shipment,create_return_shipment
from django.http import HttpResponse
from .email_service import send_refund_email,send_cancellation_email

logger = logging.getLogger(__name__)
ups = UPSService()

print("imported all the required modules for order views",logger)


def _decimal_or_zero(value):
    return value if value is not None else Decimal("0.00")


def _build_package_from_order_items(item_ids):
    length_in = Decimal("0.00")
    width_in = Decimal("0.00")
    height_in = Decimal("0.00")
    weight_lb = Decimal("0.00")

    for each_id in item_ids:
        order_item = get_or_none(OrderItem, id=each_id)
        if not order_item:
            continue

        sku = get_or_none(ProductSKU, product=order_item.product, sku_code=order_item.sku_code)

        item_length = _decimal_or_zero(getattr(order_item, "length", None))
        item_width = _decimal_or_zero(getattr(order_item, "width", None))
        item_height = _decimal_or_zero(getattr(order_item, "height", None))
        item_weight = _decimal_or_zero(getattr(order_item, "weight", None))

        if sku:
            item_length = item_length or _decimal_or_zero(getattr(sku, "length", None))
            item_width = item_width or _decimal_or_zero(getattr(sku, "width", None))
            item_height = item_height or _decimal_or_zero(getattr(sku, "height", None))
            item_weight = item_weight or _decimal_or_zero(getattr(sku, "weight", None))

        quantity = Decimal(str(order_item.quantity or 1))

        length_in += item_length * quantity
        width_in += item_width * quantity
        height_in += item_height * quantity
        weight_lb += item_weight * quantity

    # UPS rejects zero-weight packages, so send a minimal fallback when data is missing.
    if weight_lb <= 0:
        weight_lb = Decimal("0.10")

    return {
        "length_in": length_in,
        "width_in": width_in,
        "height_in": height_in,
        "weight_lb": weight_lb,
    }


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def CheckoutView(request):
    """
    Below steps need to validate while creating the order
    Handles ALL checkout scenarios:
    - Card payment via QuickBooks Payments
    - Invoice payment (no card processing)
    - Duplicate payment prevention
    - Auto token refresh
    - Order creation with full error handling
    """

    cart_items = Cart.objects.filter(user=request.user.id,selected=True)


    data         = request.data
    user         = request.user
    payment_method = data.get("payment_method", "card")

    print("data",data,"user",user,"payment_method",payment_method)


    # Layer 1: Validate request payload 
    try:
        validate_checkout_payload(data)
    except ValidationError as e:
        return Response({"status":"error", "message": str(e.detail[0]) }, status=400)

    print("---> validated ")

    

    amount          = float(data.get("amount", 0))
    idempotency_key = data.get("idempotency_key")

    # Layer 2: Duplicate payment check
    existing_order = Order.objects.filter(idempotency_key=idempotency_key).first()
    if existing_order:
        logger.info(f"Duplicate order prevented for idempotency_key={idempotency_key}")
        return Response({
            "status":         "success",
            "message":        "Order already processed.",
            "order_number":   f"ORD-{existing_order.id:06d}",
            "transaction_id": existing_order.transaction_id,
            "total":          str(existing_order.amount),
        }, status=200)

    print("---> verfied Duplicate check")





    # CARD PAYMENT FLOW
    if payment_method == "card":
        return _handle_card_payment(request, data, user, amount, idempotency_key,cart_items)

    # INVOICE PAYMENT FLOW
    elif payment_method == "invoice":
        return _handle_invoice_payment(request, data, user, amount, idempotency_key,cart_items)



    return Response({ "error": "Invalid payment method." }, status=400)


def _handle_card_payment(request, data, user, amount, idempotency_key,cartItems):
    """
    Full card payment flow:
    1. Verify successful Stripe payment
    2. Get valid QB token (auto-refreshed) for invoice sync
    3. Create order atomically
    """
    try:
        stripe_result = verify_checkout_payment_intent(
            payment_intent_id=(data.get("stripe_payment_intent_id") or "").strip(),
            expected_amount=amount,
            user=user,
        )
    except ValueError as e:
        return Response({"status":"error", "message": str(e), "retry": True}, status=402)
    except Exception as e:
        logger.error(f"Unexpected Stripe verification error: {e}")
        return Response({
            "status":"error",
            "message": "Payment verification failed. Please try again.",
            "retry": True,
        }, status=500)

    # Step 1: Get valid QB access token (non-blocking — order proceeds even if QB is unavailable)
    access_token = None
    try:
        access_token = get_valid_qb_token()
    except Exception as e:
        logger.warning(f"QB token unavailable at checkout — invoice sync skipped: {e}")

    print("received the access token")

    transaction_id = stripe_result.get("transaction_id")
    card_last4     = stripe_result.get("card_last4", "")
    card_brand     = stripe_result.get("card_brand", "")
    card_name      = stripe_result.get("card_name", "") or data.get("card_name", "")

    logger.info(
        f"Stripe Payment CAPTURED | transaction_id={transaction_id} | "
        f"user={user.id} | amount={amount}"
    )

    return _create_order(
        data=data,
        user=user,
        transaction_id=transaction_id,
        idempotency_key=idempotency_key,
        amount=amount,
        payment_method="card",
        card_last4=card_last4,
        card_brand=card_brand,
        card_name=card_name,
        status="confirmed",
        cartItems=cartItems,
        access_token=access_token
    )

    # # Step 2: Tokenize card (card data → QB token)   ===> We don't required this step
    # try:
    #     card_token = tokenize_card(access_token, data)
    # except ValueError as e:
    #     return Response({  "status":"error", "message":  str(e), "retry": True }, status=400)
    # except Exception as e:
    #     logger.error(f"Card tokenization unexpected error: {e}")
    #     return Response({
    #         "status":"error",
    #         "message":  "Unable to process card. Please try again.",
    #         "retry": True,
    #     }, status=400)

    # print("received card_token")


    use_same = data.get("use_same_address", data.get("useSameAddress", True))
    billing_address = {
        "line1": data['shipping'].get("address_line1") if use_same else data['billing'].get("address_line1", ""),
        "city": data['shipping'].get("city") if use_same else data['billing'].get("city",""),
        "state_code": data['shipping'].get("state_code") if use_same else data['billing'].get("state_code",""),
        "postal_code": data['shipping'].get("postal_code")   if use_same else data['billing'].get("postal_code",   ""),
    }
    

    # Step 3: Charge card via QB Payments API 
    try:
        qb_result = charge_card(access_token,data, amount, idempotency_key,billing_address)
    except ValueError as e:
        # Card declined, invalid token etc.
        return Response({  "status":"error", "message":  str(e), "retry": True }, status=402)
    except ConnectionError as e:
        # Gateway timeout / 5xx
        return Response({  "status":"error", "message":  str(e), "retry": True }, status=503)
    except Exception as e:
        logger.error(f"Unexpected charge error: {e}")
        return Response({"status":"error", "message":  "Payment processing failed. Please try again.",
            "retry": True}, status=500)
    
    print("Chared card",qb_result)


    # Payment CAPTURED — money is now debited
    transaction_id = qb_result.get("id")
    card_last4     = qb_result.get("card", {}).get("number",    "****")
    card_brand     = qb_result.get("card", {}).get("cardType", "Unknown")

    logger.info(
        f"QB Payment CAPTURED | transaction_id={transaction_id} | "
        f"user={user.id} | amount={amount}"
    )

    #  Step 4: Create order (atomic) 
    return _create_order(
        data=data,
        user=user,
        transaction_id=transaction_id,
        idempotency_key=idempotency_key,
        amount=amount,
        payment_method="card",
        card_last4=card_last4,
        card_brand=card_brand,
        card_name=data.get("card_name", ""),
        status="confirmed",
        cartItems=cartItems,
        access_token=access_token
    )


def _handle_invoice_payment(request, data, user, amount, idempotency_key,cartItems):
    """
    Invoice payment — no card processing.
    Just creates the order with status 'pending'.
    Admin sends invoice manually.
    """
    logger.info(f"Invoice order created | user={user.id} | amount={amount}")

    # Step 1: Get valid QB access token (non-blocking — order proceeds even if QB is unavailable)
    access_token = None
    try:
        access_token = get_valid_qb_token()
    except Exception as e:
        logger.warning(f"QB token unavailable at invoice checkout — invoice sync skipped: {e}")

    print("received the access token")

    return _create_order(
        data=data,
        user=user,
        transaction_id=f"INV-{uuid.uuid4().hex[:12].upper()}",  # internal reference
        idempotency_key=idempotency_key,
        amount=amount,
        payment_method="invoice",
        card_last4="",
        card_brand="",
        card_name="",
        status="pending",
        cartItems=cartItems,
        access_token=access_token,
    )


def _create_order(
    data, user, transaction_id, idempotency_key,
    amount, payment_method, card_last4, card_brand, card_name, status,cartItems,access_token
):
    """
    Creates Order + OrderItems atomically.
    If this fails after a card charge, admin is alerted immediately.
    """
    def _attempt_failed_checkout_refund():
        if payment_method != "card":
            return
        if not str(transaction_id).startswith("pi_"):
            return
        try:
            refund_stripe_payment(transaction_id, amount)
            logger.info(
                f"Stripe payment refunded after checkout failure | transaction_id={transaction_id} | amount={amount}"
            )
        except Exception as refund_error:
            logger.critical(
                f"Stripe refund FAILED after checkout error | transaction_id={transaction_id} | error={refund_error}"
            )

    checkout_stage = "prepare_cart_items"
    try:
        prepared_items = []
        for item in cartItems.select_related("product"):
            product = getattr(item, "product", None)
            if not product:
                raise ValueError("One of the cart products is no longer available.")

            sku = ProductSKU.objects.filter(product=product, sku_code=item.sku_code).first()
            if not sku:
                raise ValueError(f"SKU {item.sku_code} is no longer available for {product.name}.")

            if sku.stock < item.quantity:
                raise ValueError(f"Not enough stock is available for {product.name}.")

            prepared_items.append((item, product, sku))

        if not prepared_items:
            raise ValueError("No selected cart items were found for checkout.")

        with db_transaction.atomic():
            checkout_stage = "create_order"
            # Build billing address 
            # If same as shipping, use shipping fields
            use_same = data.get("use_same_address", data.get("useSameAddress", True))
            billing_first  = data['shipping'].get("first_name")  if use_same else data['billing'].get("first_name", "")
            billing_last   = data['shipping'].get("last_name")   if use_same else data['billing'].get("last_name",  "")
            billing_addr   = data['shipping'].get("address_line1") if use_same else data['billing'].get("address_line1", "")
            billing_city   = data['shipping'].get("city")        if use_same else data['billing'].get("city","")
            billing_state  = data['shipping'].get("state_name")       if use_same else data['billing'].get("state_name","")
            billing_state_code  = data['shipping'].get("state_code")       if use_same else data['billing'].get("state_code","")
            billing_zip    = data['shipping'].get("postal_code") if use_same else data['billing'].get("postal_code", "")
            billing_country= data['shipping'].get("country")     if use_same else data['billing'].get("country",     "")


            order = Order.objects.create(
                user               = user,
                transaction_id     = transaction_id,
                idempotency_key    = idempotency_key,
                amount             = amount,
                status             = status,
                paymet_status      = "success" if payment_method == "card" else "pending",
                payment_method     = payment_method,
                card_last4         = str(card_last4 or "")[-4:],
                card_brand         = card_brand,
                card_name          = card_name,

                # Shipping
                shipping_first_name    = data['shipping'].get("first_name", ""),
                shipping_last_name     = data['shipping'].get("last_name",  ""),
                shipping_email         = data['shipping'].get("email",      ""),
                shipping_phone         = data['shipping'].get("phone",      ""),
                shipping_address_line1 = data['shipping'].get("address_line1", ""),
                shipping_address_line2 = data['shipping'].get("address_line2", ""),
                shipping_city          = data['shipping'].get("city",          ""),
                shipping_state         = data['shipping'].get("state_name",""),
                shipping_state_code    = data['shipping'].get("state_code") ,
                shipping_postal_code   = data['shipping'].get("postal_code",   ""),
                shipping_country       = data['shipping'].get("country",       ""),

                # Billing
                billing_first_name    = billing_first,
                billing_last_name     = billing_last,
                billing_address_line1 = billing_addr,
                billing_city          = billing_city,
                billing_state         = billing_state,
                billing_state_code    = billing_state_code,
                billing_postal_code   = billing_zip,
                billing_country       = billing_country,

                # Financials
                subtotal      = data.get("subtotal",      0),
                shipping_cost = data.get("shipping_cost", 0),
                tax_amount    = data.get("tax_amount",    0),
                tax_rate      = data.get("tax_rate",      0),
                customer_notes= data.get("customer_notes", ""),
            )
            logger.info(f"Checkout stage complete | transaction_id={transaction_id} | stage=create_order | order_id={order.id}")
            
            for item, product, sku in prepared_items:
                checkout_stage = f"create_order_item_cart_{item.id}"
                sku_weight = getattr(sku, "weight", None)
                sku_length = getattr(sku, "length", None)
                sku_width = getattr(sku, "width", None)
                sku_height = getattr(sku, "height", None)
                product_weight = getattr(product, "weight", None)
                product_length = getattr(product, "length", None)
                product_width = getattr(product, "width", None)
                product_height = getattr(product, "height", None)
                orderItem = OrderItem.objects.create(
                    order =  order,
                    product =  product,
                    quantity = item.quantity,
                    product_name = product.name,
                    sku_code = item.sku_code,
                    unit_price = item.price,
                    total =  item.quantity * item.price,
                    weight = sku_weight if sku_weight is not None else (product_weight if product_weight is not None else Decimal("0.00")),
                    length = sku_length if sku_length is not None else (product_length if product_length is not None else Decimal("0.00")),
                    width = sku_width if sku_width is not None else (product_width if product_width is not None else Decimal("0.00")),
                    height = sku_height if sku_height is not None else (product_height if product_height is not None else Decimal("0.00")),
                )
                logger.info(
                    f"Checkout stage complete | transaction_id={transaction_id} | "
                    f"stage=create_order_item | order_id={order.id} | order_item_id={orderItem.id} | cart_id={item.id}"
                )

                checkout_stage = f"copy_variants_cart_{item.id}"
                cartVariantItems = CartVariants.objects.filter(cart_id=item.id)
                for cartVariantItem in cartVariantItems:
                    OrderVariants.objects.create(
                        order =  order,
                        order_item = orderItem,
                        variant_option_name = cartVariantItem.variant_option.value,
                        variant_option = cartVariantItem.variant_option
                    )

                checkout_stage = f"delete_cart_variants_cart_{item.id}"
                cartVariantItems.delete()
                checkout_stage = f"update_stock_sku_{sku.id}"
                ProductSKU.objects.filter(pk=sku.pk).update(stock=F("stock") - item.quantity)
                checkout_stage = f"delete_cart_item_{item.id}"
                item.delete()
            
            # result = ups.create_shipment(order)
            # order.tracking_number = result['tracking_number']
            # order.ups_shipment_id = result['shipment_id']

        logger.info(f"Order #{order.id} created | transaction_id={transaction_id}")

    except Product.DoesNotExist as e:
        logger.critical(
            f"Product not found after charge | transaction_id={transaction_id} | "
            f"user={user.id} | error={e}"
        )
        _attempt_failed_checkout_refund()
        if payment_method == "card":
            notify_admin_critical(transaction_id, user.id, user.email, amount, str(e))
        return Response({"status":"error",
                        "message": "Payment was successful but an item was not found. "
                        "Our team has been notified. Do NOT pay again — "
                        "contact support with your Transaction ID.",
            "transaction_id": transaction_id,
            "retry":          False,
        }, status=500)

    except ValueError as e:
        logger.critical(
            f"Order validation FAILED after charge | transaction_id={transaction_id} | "
            f"user={user.id} | amount={amount} | error={e}"
        )
        _attempt_failed_checkout_refund()
        if payment_method == "card":
            notify_admin_critical(transaction_id, user.id, user.email, amount, str(e))
        return Response({"status":"error",
                         "message": "Your cart changed during checkout, so the payment was reversed automatically. Please review your cart and try again.",
                         "transaction_id": transaction_id,
                         "retry":False,
        }, status=409)

    except Exception as e:
        logger.critical(
            f"Order creation FAILED after charge | transaction_id={transaction_id} | "
            f"user={user.id} | amount={amount} | stage={checkout_stage} | error={e}"
        )
        _attempt_failed_checkout_refund()
        if payment_method == "card":
            notify_admin_critical(transaction_id, user.id, user.email, amount, str(e))
        return Response({"status":"error",
                         "message": "Payment was successful but order creation failed. "
                            "Our team has been notified. Do NOT pay again — "
                            "contact support with your Transaction ID.",
                            "transaction_id": transaction_id,
                            "retry":False,
        }, status=500)
    




    # STEP 2: Create QB Invoice (outside atomic — never fails the order) 
    if access_token:
        order_items = OrderItem.objects.filter(order= order.id)
        try:
            create_qb_invoice(
                access_token   = access_token,
                order          = order,
                orderItems     = order_items,
                payment_method = payment_method,
                user = user

            )
        except Exception as e:
            # Order is already saved — just log, don't fail the response
            logger.error(
                f"QB Invoice creation FAILED for Order #{order.id} | "
                f"txn={transaction_id} | error={e} | "
                f"ACTION: Manually create invoice in QB admin"
            )
    else:
        logger.warning(f"QB Invoice skipped for Order #{order.id} — no access token")
    # Send order confirmation email to user and BCC to scope
   

    # Prepare email context
    order_items = OrderItem.objects.filter(order=order)
    context = {
        'logo_url': getattr(settings, 'WELCOME_LOGO_URL', ''),
        'user_name': f"{order.user.first_name} {order.user.last_name}",
        'order_number': f"ORD-{order.id:06d}",
        'order_date': order.created_at.strftime('%B %d, %Y') if order.created_at else datetime.now().strftime('%B %d, %Y'),
        'order_items': order_items,
        'subtotal': order.subtotal,
        'shipping_cost': order.shipping_cost,
        'tax_amount': order.tax_amount,
        'total': order.amount,
        'payment_method': order.payment_method,
        'billing_address': f"{order.billing_first_name} {order.billing_last_name}, {order.billing_address_line1}, {order.billing_city}, {order.billing_state}, {order.billing_postal_code}, {order.billing_country}",
        'shipping_address': f"{order.shipping_first_name} {order.shipping_last_name}, {order.shipping_address_line1}, {order.shipping_city}, {order.shipping_state}, {order.shipping_postal_code}, {order.shipping_country}",
        'invoice_note': "Thank you for choosing Invoice as your payment method. Our team will review your order and send you an invoice with payment instructions shortly. If you have any questions, please contact our billing department at order@biopathogenix.com." if order.payment_method == "invoice" else None,
    }
    subject = f"Your BioPathogenix Order Confirmation - {context['order_number']}"
    to_email = [order.user.email]
    if order.user.laboratory:
        lab_users= CustomUser.objects.filter(laboratory=order.user.laboratory).exclude(id=order.user.id)
        to_email += [lab_user.email for lab_user in lab_users]

    bcc_email = ["scope@biopathogenix.com"]
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@biopathogenix.com')
    html_message = render_to_string('emails/order_confirmation_email.html', context)
    try:
        if getattr(settings, 'GRAPH_ENABLED', False):
            send_graph_email(to_email, subject, html_body=html_message, from_email=from_email, cc_list=bcc_email)
        else:
            email = EmailMessage(
                subject=subject,
                body=html_message,
                from_email=from_email,
                to=to_email,
                bcc=bcc_email,
            )
            email.content_subtype = 'html'
            email.send(fail_silently=False)
        logger.info(f"Order confirmation email sent to {to_email} (bcc: {bcc_email}) for order {order.id}")
    except Exception as e:
        logger.error(f"Failed to send order confirmation email for order {order.id}: {e}")


    return Response({
        "status":"success",
        "message":"Successfully Order Created",
        "result":{
            "data":{
                "order_number":   f"ORD-{order.id:06d}",
                "transaction_id": f"{transaction_id}",
                "total":          str(amount),
                "payment_method": payment_method,
            }
        }
    }, status=201)



 



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def UserOrdersView(request):
    orders = Order.objects.filter(user=request.user).prefetch_related("items", "status_updates").order_by("-created_at")
    serializer = OrderDetailSerializer(orders, many=True, context={'request': request})
    return Response({
        "status": "success",
        "message": "Orders fetched",
        "result": {
            "data": serializer.data
        }
    }, status=status.HTTP_200_OK)



class OrderPagination(PageNumberPagination):
    page_size = 10                      
    page_size_query_param = 'page_size' 
    max_page_size = 100                 


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def AllOrdersView(request):

    superadmin= get_or_none(UserRole,user=request.user,role__name="superadmin")
    if not superadmin:
        return Response({"status":"error", "message":"Access Denied"}, status=status.HTTP_403_FORBIDDEN)
    filter_data={}
    # import pdb;pdb.set_trace();
    
    if 'from_date' in request.query_params and 'to_date' in request.query_params:
        filter_data['created_at__range']=[request.query_params['from_date'],request.query_params['to_date']]

    elif 'from_date' in request.query_params:
        filter_data['created_at__gte']=request.query_params['from_date']

    elif 'to_date' in request.query_params:
        filter_data['created_at__lte']=request.query_params['to_date']
    
    if 'order_id' in request.query_params:
        filter_data['id']=request.query_params['order_id']

    if 'status' in request.query_params:
        filter_data['status__in']=(request.query_params['status']).split(',')

    # if 'return_status' in request.query_params:
    #     filter_data['return_status__in']=(request.query_params['return_status']).split(',')
    
    if 'payment_method' in request.query_params:
        filter_data['payment_method__in']=(request.query_params['payment_method']).split(',')

    print("filter_data",filter_data)
        

    orders = Order.objects.filter(**filter_data).prefetch_related('items').order_by("-created_at")





    # Apply pagination
    paginator = OrderPagination()
    paginated_orders = paginator.paginate_queryset(orders, request)
    serializer = AllOrderSerializer(paginated_orders, many=True, context={'request': request})

    return Response({
        "status": "success",
        "message": "Orders fetched",
        "result": {
            "data": serializer.data,
            "pagination": {
                "total_items": paginator.page.paginator.count,
                "total_pages": paginator.page.paginator.num_pages,
                "current_page": paginator.page.number,
                "page_size": paginator.get_page_size(request),
                "next": paginator.get_next_link(),
                "previous": paginator.get_previous_link(),
            }
        }
    }, status=status.HTTP_200_OK)



@api_view(["GET"])
@permission_classes([IsAuthenticated])
def orderItemsView(request):    
    orderItems=OrderItem.objects.filter(order__id=request.query_params['order_id'])
    serializer = FetchOrderItemSerializer(orderItems, many=True)
    return Response({
        "status": "success",
        "message": "Orders Items fetched",
        "result": {
            "data": serializer.data,
        }
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ShippmentOrderItemsView(request):    
    orderData=Order.objects.filter(id=request.query_params['order_id']).prefetch_related('items','shipments').first()
    serializer = ShipmentOrderSerailizer(orderData,  context={'request': request})
    return Response({
        "status": "success",
        "message": "Orders Items fetched",
        "result": {
            "data": serializer.data,
        }
    }, status=status.HTTP_200_OK)






@api_view(["GET"])
@permission_classes([IsAuthenticated])
def orderReturnRequestView(request):    
    Order.objects.filter(id=request.query_params['order_id']).update(return_requested_reason=request.query_params['note'])
    order = Order.objects.filter(id=request.query_params['order_id']).first()
    context = {
        "order": {"id":order.id,"created_at":order.created_at,"amount":order.amount,"payment_method":order.payment_method,"status":order.status},
        "user" : {"get_full_name":f"{order.user.first_name} {order.user.last_name}","email":order.user.email,"phone":order.user.phone_number},
        "reason": request.query_params['note'],
        "return_deadline":order.return_deadline,
        "company_name"  : "Biopathogenix",
        "admin_order_url" : f"{configSettings.FRONTEND_URL}/orders",
        "current_year" : timezone.now().year,
    }

    subject      = f"Return Request – Order #{order.id}"
    text_content = f"Return request received for Order #{order.id} from {order.user.email}."
    html_content = render_to_string("order/order_return_request.html", context)
    bcc_email = ["scope@biopathogenix.com"]
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@biopathogenix.com')

    if getattr(settings, 'GRAPH_ENABLED', False):
        send_graph_email([order.user.email], subject, html_body=html_content, text_body=text_content, from_email=from_email, cc_list=bcc_email)
    else:
        email = EmailMultiAlternatives(
            subject= subject,
            body= text_content,
            bcc =bcc_email,
            from_email = from_email,
            to = [order.user.email],
        )
        email.attach_alternative(html_content, "text/html")
        email.send()

    return Response({
        "status": "success",
        "message": "Order Request has been updated",
    }, status=status.HTTP_200_OK)




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def AdminorderReturnRequestView(request):

    if request.query_params['type'] == "return_approved":
        pass

    if request.query_params['type'] == "return_rejected":
        Order.objects.filter(id=request.query_params['order_id']).update(return_rejected_reason=request.query_params['note'])
        order = Order.objects.filter(id=request.query_params['order_id']).first()
        context = {
            "order": {"id":order.id,"created_at":order.created_at,"amount":order.amount,"payment_method":order.payment_method,"status":order.status},
            "user" : {"get_full_name":f"{order.user.first_name} {order.user.last_name}"},
            "reason": request.query_params['note'],
            "company_name"  : "Biopathogenix",
            "admin_order_url" : f"{configSettings.FRONTEND_URL}/orders",
            "current_year" : timezone.now().year,
        }
        subject      = f"Return Request Rejected – Order #{order.id}"
        text_content = f"Return request has been rejected for Order #{order.id}."
        html_content = render_to_string("order/order_return_request_reject.html", context)

        bcc_email = ["scope@biopathogenix.com"]
        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@biopathogenix.com')

        if getattr(settings, 'GRAPH_ENABLED', False):
            send_graph_email([order.user.email], subject, html_body=html_content, text_body=text_content, from_email=from_email, cc_list=bcc_email)
        else:
            email = EmailMultiAlternatives(
                subject = subject,
                body = text_content,
                from_email = from_email,
                bcc = bcc_email,
                to = [order.user.email],
            )
            email.attach_alternative(html_content, "text/html")
            email.send()
    return Response({
        "status": "success",
        "message": "Status has been updated!",
    }, status=status.HTTP_200_OK)






@api_view(["POST"])
@permission_classes([IsAuthenticated])
def AdminorderUpdateView(request):
    print("request.data",request.data)
    orderData = Order.objects.filter(id=request.data.get('orderId')).first()
    if not orderData:
        return Response({"status": "error", "message": "Order not found"}, status=status.HTTP_404_NOT_FOUND)

    new_status = request.data.get('status')
    if new_status:
        orderData.status = new_status
    if 'transactionId' in request.data:
        orderData.transaction_id = request.data['transactionId']
    orderData.save()

    searilizer = AllOrderSerializer(orderData,  context={'request': request})

    return Response({
        "status": "success",
        "message": "Status has been updated!",
        "result": {"data": searilizer.data}
    }, status=status.HTTP_200_OK)







class CreateOutboundShipmentView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, order_id):
        order    = get_object_or_404(Order, id=order_id)
        item_ids = request.data.get('item_ids', [])
        if not item_ids:
            return Response({'error': 'item_ids is required'},status=status.HTTP_400_BAD_REQUEST)


        package = _build_package_from_order_items(item_ids)

        weight_override = request.data.get('weight_lb')
        if weight_override not in (None, ''):
            try:
                weight_override = Decimal(str(weight_override))
            except InvalidOperation:
                return Response({'error': 'weight_lb must be a number'}, status=status.HTTP_400_BAD_REQUEST)
            if weight_override <= 0:
                return Response({'error': 'weight_lb must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)
            package['weight_lb'] = weight_override

        suc,ups_response =  ups.create_shipment(order,package)
        if suc:
            success, result = create_outbound_shipment(order, item_ids, ups_response)
            if success:
                return Response({"status":"success","message":"Created Successfully!"},status=status.HTTP_201_CREATED
                )
            return Response({'error': result}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': ups_response}, status=status.HTTP_400_BAD_REQUEST)



class InitiateReturnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        order    = get_object_or_404(Order, id=order_id)
        item_ids = request.data.get('item_ids', [])
        reason   = request.data.get('reason', '').strip()

        if not item_ids:
            return Response({'error': 'item_ids is required'},status=status.HTTP_400_BAD_REQUEST
            )
        if not reason:
            return Response(
                {'error': 'reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        package = _build_package_from_order_items(item_ids)

        suc,ups_response = ups.call_ups_return_api(order,package)

        if suc:
            success, result = create_return_shipment(
                order    = order,
                item_ids = item_ids,
                ups_response = ups_response,
                admin_user   = request.user,
                reason       = reason,
            )
            if success:
                return Response({"status":"success","message":"Created Successfully!","data":ShipmentSerializer(result, context={'request': request}).data},status=status.HTTP_201_CREATED)
            return Response({'error': result}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': ups_response}, status=status.HTTP_400_BAD_REQUEST)


class DownloadLabelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, shipment_id):
        shipment = get_object_or_404(Shipment, id=shipment_id)

        if not shipment.shipping_label:
            return HttpResponse('Label not found', status=404)

        try:
            label_file = shipment.shipping_label
            label_file.open('rb')
            content = label_file.read()
            label_file.close()

            prefix   = 'return_label' if shipment.is_return else 'label'
            filename = f"{prefix}_{shipment.tracking_number}.gif"
            response = HttpResponse(content, content_type='image/gif')
            response['Content-Disposition'] = (
                f'attachment; filename="{filename}"'
            )
            return response
        except Exception as e:
            return HttpResponse(f'Error: {str(e)}', status=500)



class CancelOrderView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        # Guard 
        if not order.is_cancellable:
            return Response({"status":"error",'message': f'Order cannot be cancelled. ' f'Current status: {order.get_status_display()}'},status=status.HTTP_400_BAD_REQUEST)
        
        serializer = CancelOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        data = serializer.validated_data
        # Cancel order 
        order.status = 'cancelled'
        order.items.update(is_cancelled=True, cancelled_at=timezone.now(), cancelled_by=request.user, cancel_notes=data.get('cancel_notes', ''))  # Bulk update items
        order.save(update_fields=['status', 'updated_at'])
        response_data = {
            'status':        'cancelled',
            'cancelled_at':  timezone.now(),
            'cancel_reason': data.get('cancel_notes', ''),
            'cancelled_by':  request.user.get_full_name or request.user.email,
            'message':       f'Order #{order.id} cancelled successfully.', 
        }
        send_cancellation_email(order,response_data)
        return Response({"status": "success","message": f"Order #{order.id} has been cancelled successfully.","data":{
                "order_id": order.id,
                "status": order.status,
        }}, status=status.HTTP_200_OK)




class RefundOrderView(APIView):
    permission_classes = [IsAdminUser]


    def post(self, request, order_id):
        order = get_object_or_404(Order, id=order_id)

        if not order.is_refundable:
            return Response({"status":"error",'message': f'Order not eligible for refund.'},status=400)

        serializer = RefundOrderSerializer(data=request.data,context={'order': order})
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        refund_amount = float(data['refund_amount'])

        # Guard — charge ID must exist 
        if not order.transaction_id :
            return Response({"status":"error",'message': 'No QB charge ID found for this order. Cannot process refund.'},status=400)

        if str(order.transaction_id).startswith("pi_"):
            try:
                stripe_response = refund_stripe_payment(
                    payment_intent_id=order.transaction_id,
                    amount=refund_amount,
                )
            except Exception as e:
                return Response({"status":"error",'message': str(e)},status=400)

            stripe_refund_id = stripe_response.get('id', '')
            stripe_status = stripe_response.get('status', '')
            stripe_created = stripe_response.get('created', '')

            is_partially_refunded = refund_amount < float(order.amount)
            order.is_partially_refunded = is_partially_refunded
            order.refund_status = str(stripe_status).lower()
            order.refund_amount = data['refund_amount']
            order.refunded_at = stripe_created
            order.refunded_by = request.user
            order.refund_notes = data.get('refund_notes', '')
            order.refund_reference = data.get('refund_reference', '') or stripe_refund_id
            order.status = 'partially_refunded' if is_partially_refunded else 'refunded'

            order.save(update_fields=[
                'refund_status', 'refund_amount', 'refunded_at',
                'refunded_by', 'refund_notes', 'refund_reference',
                'status', 'updated_at','is_partially_refunded'
            ])

            response_data = {
                'status': order.status,
                'refund_status': stripe_status,
                'refund_amount': str(order.refund_amount),
                'refunded_at': order.refunded_at,
                'qb_refund_id': stripe_refund_id,
                'qb_status': stripe_status,
                'refunded_by': request.user.get_full_name or request.user.email,
                'message': f'Refund of ${order.refund_amount} processed successfully.',
            }

            send_refund_email(order, response_data)
            return Response({"status":"success","message":"Refunded Amount","data":response_data})

        # Call QB Payments refund 
        try:
            access_token = get_valid_qb_token()
        except Exception as e:
            error_msg = str(e)
            if "QB_REFRESH_EXPIRED" in error_msg:
                # Admin needs to re-authorize — this should never reach end users in production
                logger.critical("QB refresh token expired — admin action required")
                return Response({"status":"error","message": "Payment service is currently unavailable. Please try again later or contact support.","retry": False}, status=503)
            return Response({ "status":"error", "message": error_msg, "retry": True }, status=503)

        try:
            qb_response = refund_qb_charge(
                access_token = access_token,
                charge_id   = order.transaction_id,
                amount      = refund_amount,
                description = (data.get('refund_notes') or f"Refund for Order #{order.id}"),
            )
            # QB refund response fields
            qb_refund_id  = qb_response.get('id',     '')
            qb_status     = qb_response.get('status', '')  # ISSUED / DECLINED
            qb_created    = qb_response.get('created', '')

        except Exception as e:
            return Response({"status":"error",'message': str(e)},status=400)

        # Check QB status 
        if qb_status == 'DECLINED':
            return Response({"status":"error",'message': f'QB refund declined: {qb_response}'},status=400)
        

        # Update order 
        is_partially_refunded = refund_amount < float(order.amount)
        order.is_partially_refunded = is_partially_refunded
        order.refund_status = qb_status.lower()
        order.refund_amount = data['refund_amount']
        order.refunded_at = qb_created
        order.refunded_by = request.user
        order.refund_notes = data.get('refund_notes', '')
        order.refund_reference = data.get('refund_reference', '') or qb_refund_id
        order.status           = 'partially_refunded' if is_partially_refunded else 'refunded'

        # 'qb_refund_id', 
        order.save(update_fields=[
            'refund_status', 'refund_amount', 'refunded_at',
            'refunded_by', 'refund_notes', 'refund_reference',
            'status', 'updated_at','is_partially_refunded'
        ])

        # Build response 
        response_data = {
            'status':          order.status,
            'refund_status':   qb_status,
            'refund_amount':   str(order.refund_amount),
            'refunded_at':     order.refunded_at,
            'qb_refund_id':    qb_refund_id,
            'qb_status':       qb_status,
            'refunded_by':     request.user.get_full_name or request.user.email,
            'message':         f'Refund of ${order.refund_amount} processed successfully.',
        }

        # Send email 
        send_refund_email(order, response_data)

        return Response({"status":"success","message":"Refunded Amount","data":response_data})




class CancelOrderItemView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, order_id, item_id):
        order = get_object_or_404(Order, id=order_id)
        item  = get_object_or_404(OrderItem, id=item_id, order=order)

        # Guard — only unshipped items can be cancelled 
        if item.status:
            return Response(
                {
                    'error': (
                        f'Cannot cancel — item is already '
                        f'{item.status.replace("_", " ")}.'
                    )
                },
                status=400
            )

        if item.is_returned or item.return_status != 'none':
            return Response({'error': 'Cannot cancel — item has an active return.'},status=400)

        # Cancel the item 
        cancel_notes = request.data.get('cancel_notes', '').strip()

        item.is_cancelled = True
        item.cancel_notes = cancel_notes
        item.cancelled_at = timezone.now()
        item.cancelled_by = request.user
        item.save(update_fields=[
            'is_cancelled', 'cancel_notes',
            'cancelled_at', 'cancelled_by',
        ])

        # Update order status if all items cancelled 
        all_cancelled = not order.items.exclude(is_cancelled=True).exists()

        if all_cancelled:
            order.status = 'cancelled'
            order.save(update_fields=['status'])

        response_data = {
            'status':        'cancelled',
            'cancelled_at':  timezone.now(),
            'cancel_reason': request.data.get('cancel_notes', ''),
            'cancelled_by':  request.user.get_full_name or request.user.email,
            'message':       f'Order #{order.id} cancelled successfully.', 
        }

        send_cancellation_email(order,response_data)
        

        return Response({
            "status": "success",
            "data": {
            'status':       'cancelled',
            'item_id':      item.id,
            'product_name': item.product.name,
            'cancel_notes': cancel_notes,
            'cancelled_at': item.cancelled_at,
            },
            'message':      f'{item.product.name} has been cancelled.',
        },status=200)


class PrintLabelView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, shipment_id):
        shipment = get_object_or_404(Shipment, id=shipment_id)

        if not shipment.shipping_label:
            return Response({'error': 'No label found'}, status=404)
        
        upsconfig = UPSConfig.objects.first()
        if not upsconfig:
            raise Exception("UPS shipper configuration is missing. Please add UPS settings in Django admin.")


        order = shipment.order
        items = shipment.items.select_related('product').all()
        # import pdb;pdb.set_trace()

        #  Build item list with prices 
        item_list = []
        for item in items:
            unit_price  = float(item.unit_price  or item.product.price or 0)
            total_price = round(unit_price * item.quantity, 2)
            item_list.append({
                'product_name': item.product_name,
                'product_sku':  item.sku_code,
                'quantity':     item.quantity,
                'unit_price':   f"{unit_price:.2f}",
                'total_price':  f"{total_price:.2f}",
            })

        #  Calculate totals 
        subtotal = sum(
            float(i['total_price']) for i in item_list
        )
        tax      = round(float(order.tax_amount or 0), 2)
        total    = round(subtotal + tax, 2)

        return Response({
            'status':"success",
            "message": "Data Fetched Successfully!",
            'shipment_id': shipment.id,
            'shipment_type': shipment.shipment_type,
            'is_return': shipment.is_return,
            'tracking_number':  shipment.tracking_number,
            'carrier':  shipment.carrier,
            'label_url':  request.build_absolute_uri(shipment.shipping_label.url),
            'order_id': order.id,
            'order_number': f"ORD-{str(order.id).zfill(6)}",
            'label_created_at': shipment.label_created_at,
            'return_reason': shipment.return_reason,

            #  Items with prices
            'items':  item_list,
            'subtotal': f"{subtotal:.2f}",
            'tax': f"{tax:.2f}",
            'total':    f"{total:.2f}",

            # Ship to
            'ship_to': {
                'name':    order.fullName,
                'address': order.shipping_address_line1,
                'city':    order.shipping_city,
                'state':   order.shipping_state,
                'zip':     order.shipping_postal_code,
                'country': order.shipping_country or 'US',
            },

            # Ship from
            'ship_from': {
                'name':    upsconfig.name,
                'address': upsconfig.street,
                'city':    upsconfig.city,
                'state':   upsconfig.state,
                'zip':     upsconfig.zip,
            },

            # Company info
            'company': {
                'name':    configSettings.COMPANY_NAME,
                'phone':   upsconfig.phone,
                'email':   configSettings.SUPPORT_EMAIL,
                'website': configSettings.FRONTEND_URL,
            },
        })
