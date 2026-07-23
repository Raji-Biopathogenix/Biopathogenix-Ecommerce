
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Cart
from .serializers import CartSerializer,CartResponseSerializer
from rest_framework import viewsets
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.views import get_or_none
from .utils import UpdateItemToCart,AddItemToCart,cart_has_sku
from rest_framework.decorators import action
from rest_framework.permissions import  AllowAny
from prd_variant.models import ProductSKU
from django.utils import timezone
from order.models import Order
from coupon.models import Coupon
from datetime import date
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .services import UPSService
import logging
from users.models import CustomUser,CustomizableProductprices
from payments.models import TaxConfig
import requests
from .taxjar_client import get_taxjar_headers, get_base_url
from settings.models import Settings
from .utils import _apply_product_discount
from decimal import Decimal


logger = logging.getLogger(__name__)
ups = UPSService()

# Category-based shipping fee rules (matched by slug/name keyword, same style
# as product/serializers.py's ASSAY_CATEGORY_SLUG_MARKERS, so minor slug/name
# differences don't break the match). Matching on name too matters in
# practice: the real "Consumables & Lab Supplies" category's slug is
# "specimen-collection-supplies" — it doesn't contain "consumable" at all.
GROUP_A_KEYWORDS = ('qplex', 'extraction')                # qPLEX PCR Assays, Extraction & Sample Prep
GROUP_B_KEYWORDS = ('consumable', 'ppe', 'supplies')       # Consumables & Lab Supplies, PPE
GROUP_A_FLAT_FEE = Decimal("20.00")
GROUP_A_FREE_THRESHOLD = Decimal("500")
GROUP_B_PER_ITEM_FEE = Decimal("20.00")


def _category_group(product):
    categories = product.categories.filter(is_active=True).select_related('parent')
    tokens = []
    for category in categories:
        tokens.append(category.slug)
        tokens.append(category.name)
        if category.parent_id and category.parent:
            tokens.append(category.parent.slug)
            tokens.append(category.parent.name)
    tokens = [t.lower() for t in tokens if t]
    if any(any(k in t for k in GROUP_A_KEYWORDS) for t in tokens):
        return 'A'
    if any(any(k in t for k in GROUP_B_KEYWORDS) for t in tokens):
        return 'B'
    return None

# def update(self, request, *args, **kwargs):
#         # Update cart item quantity
#         item_id = kwargs.get('pk')
#         try:
#             cart_item = Cart.objects.get(pk=item_id)
#         except Cart.DoesNotExist:
#             return Response({"status": "error", "message": "Cart item not found"}, status=status.HTTP_404_NOT_FOUND)

#         quantity = request.data.get('quantity')
#         if quantity is None:
#             return Response({"status": "error", "message": "Quantity is required"}, status=status.HTTP_400_BAD_REQUEST)
#         try:
#             quantity = int(quantity)
#         except (TypeError, ValueError):
#             return Response({"status": "error", "message": "Quantity must be an integer"}, status=status.HTTP_400_BAD_REQUEST)
#         if quantity < 1:
#             return Response({"status": "error", "message": "Quantity must be at least 1"}, status=status.HTTP_400_BAD_REQUEST)

#         cart_item.quantity = quantity
#         cart_item.total_price = cart_item.price * quantity
#         cart_item.save()

#         cartupdateData = CartResponseSerializer(cart_item, context={'request': request}).data
#         return Response({"status": "success", "message": "Cart item updated", "result": {"data": cartupdateData}}, status=status.HTTP_200_OK)

class CartViewset(viewsets.ModelViewSet):
    queryset=Cart.objects.all()
    serializer_class=CartSerializer
    authentication_classes = [JWTAuthentication]
    permission_classes = [permissions.IsAuthenticated]


    
    def list(self, request, *args, **kwargs):
        cartItems =Cart.objects.filter(user_id = request.user.id)
        serializer = CartSerializer(cartItems,many=True,context={'request': request})
        return Response({
            "status": "success",
            "message": "Item added to cart",             
            "data":{"items": serializer.data,"total_items":3,
            "subtotal":55}
        }, status=status.HTTP_200_OK)
    

    def create(self, request, *args, **kwargs):
        cartData = request.data
        is_item_exist_flag = False
        if cartData.get("has_variants"):
            sku_options = cartData.get("skuObj", {}).get("sku_options")
            if not sku_options:
                return Response({
                    "status": "error",
                    "message": "Variant selections are required."
                }, status=status.HTTP_400_BAD_REQUEST)
            if request.user and request.user.id:
                cartItems = Cart.objects.filter(product_id=cartData["product_id"],user_id=request.user.id)
            else:
                cartItems = Cart.objects.filter(tmp_id=cartData["tmp_id"],product_id=cartData["product_id"])

            existed_cart_item = None
            selected_option_ids = [eachOPt['variant_option_id'] for eachOPt in sku_options]
            for eachObj in cartItems:
                matched_count = cart_has_sku(eachObj.id,selected_option_ids)
                if matched_count == len(selected_option_ids):
                    existed_cart_item = eachObj
                    is_item_exist_flag = True
                    break
        else:
            if request.user and request.user.id:
                existed_cart_item = get_or_none(Cart,product_id=cartData["product_id"],user_id=request.user.id)
            else:
                existed_cart_item = get_or_none(Cart,tmp_id=cartData["tmp_id"],product_id=cartData["product_id"])
            is_item_exist_flag = bool(existed_cart_item)
        print("existed_cart_item",existed_cart_item,"is_item_exist_flag",is_item_exist_flag)
        if is_item_exist_flag:
            return UpdateItemToCart(request,cartData,existed_cart_item)
        else:
            return AddItemToCart(request,cartData)

    def partial_update(self, request, *args, **kwargs):
        cart_item = self.get_object()
        quantity = request.data.get("quantity")
        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response({"status": "error", "message": "Quantity must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        if quantity < 1:
            return Response({"status": "error", "message": "Quantity must be at least 1"}, status=status.HTTP_400_BAD_REQUEST)

        sku = get_or_none(ProductSKU,product= cart_item.product, sku_code=cart_item.sku_code)
        base_price = sku.price if sku else cart_item.price
        if cart_item.product.is_customizable and request.user.id:
            user= get_or_none(CustomUser, id=request.user.id)
            if user and user.laboratory_id:
                customPrd= CustomizableProductprices.objects.filter(product=cart_item.product.id,laboratory_id=user.laboratory_id).first()
                base_price = customPrd.price if customPrd else cart_item.price
            
        price = _apply_product_discount(cart_item.product, float(base_price))
        cart_item.quantity = quantity
        cart_item.price = price
        cart_item.total_price = price * quantity
        cart_item.discount_value = round(float(getattr(cart_item.product, "discount_value", 0) or 0), 2)
        cart_item.discount_amt = max(0, round((float(base_price) - float(price)) * quantity, 2))
        cart_item.save()
        cartupdateData = CartResponseSerializer(cart_item, context={'request': request,'user_id':request.user.id}).data
        return Response({"status": "success", "message": "Item updated", "result": {"data": cartupdateData}}, status=status.HTTP_200_OK)

    


        
    def destroy(self, request, pk=None):
        instance =  get_or_none(Cart,id=self.kwargs['pk'])
        if not instance:
            return Response({{"status": "error","message": "Item Not Found"}},status=status.HTTP_404_NOT_FOUND)
        self.perform_destroy(instance)
        return Response({"status": "success","message": "Item Deleted Successfully"},status=status.HTTP_200_OK)



        

        
    @action(detail=True,methods=['GET'],permission_classes=[AllowAny])
    def get_cartitems_count(self,request,**kwargs):
        tmp_id = self.kwargs.get('pk')
        cart_count = 0
        # If authenticated, count by user; else, by tmp_id
        if request.user and hasattr(request.user, 'id') and request.user.id:
            # Optionally update tmp_id carts to user
            Cart.objects.filter(tmp_id=tmp_id, user__isnull=True).update(user=request.user.id)
            cart_count = Cart.objects.filter(user=request.user.id).count()
        elif tmp_id:
            cart_count = Cart.objects.filter(tmp_id=tmp_id).count()
        return Response({"status": "success",
                         "message": "Item Updated Successfully",
                         "result": {"count": cart_count}}, status=status.HTTP_200_OK)
    


    @action(detail=True,methods=['GET'],permission_classes=[AllowAny],serializer_class=CartResponseSerializer,url_path='cartItems')
    def cartitems(self,request,**kwargs):
        if request.user and request.user.id:
            cartItems = Cart.objects.filter(user=request.user.id)
        else:
            cartItems = Cart.objects.filter(tmp_id=self.kwargs['pk'])
        cartData= CartResponseSerializer(cartItems,many=True,context={'request': request,'user_id':request.user.id}).data
        return Response({"status": "success","message": "Get Cart Items","result": {"data": cartData}}, status=status.HTTP_200_OK)
    

    @action(detail=True,methods=['GET'],permission_classes=[AllowAny],serializer_class=CartResponseSerializer,url_path='checkoutItems')
    def checkoutitems(self,request,**kwargs):
        if request.user and request.user.id:
            cartItems = Cart.objects.filter(user=request.user.id,selected=True)
        else:
            cartItems = Cart.objects.filter(tmp_id=self.kwargs['pk'],selected=True)
        cartData= CartResponseSerializer(cartItems,many=True,context={'request': request,'user_id':request.user.id}).data
        return Response({"status": "success","message": "Get Cart Items","result": {"data": cartData}}, status=status.HTTP_200_OK)
    
    

    @action(detail=True,methods=['GET'],permission_classes=[AllowAny],serializer_class=CartResponseSerializer,url_path='items_selection')
    def cartItemDeselected(self,request,**kwargs):
        if 'selection_type' in request.query_params:
            selectionVal = False if request.query_params['selection_type'] == 'deselect_all' else True
            if request.user and request.user.id:
                Cart.objects.filter(user=request.user.id).update(selected=selectionVal,coupon_code='',coupon_val=0.00,coupon_type='')
            else:
                Cart.objects.filter(tmp_id=self.kwargs['pk']).update(selected=selectionVal,coupon_code='',coupon_val=0.00,coupon_type='')
        else:
            cartitem = get_or_none(Cart, id=self.kwargs['pk'])
            cartitem.selected =  False if request.query_params['selection'] == 'false' else True 
            cartitem.save()
        return Response({"status": "success","message": "Updated Sucessfully"}, status=status.HTTP_200_OK)
    
    
    

    @action(detail=True,methods=['GET'],permission_classes=[AllowAny],serializer_class=CartResponseSerializer,url_path='coupon_code_validate')
    def CartCoponValidate(self,request,**kwargs):
        # import pdb;pdb.set_trace();
        couponExist = get_or_none(Coupon,code= request.query_params['coupon_code'])
        if couponExist and couponExist.is_active:
            today = date.today()
            coupon_count= Order.objects.filter(coupon_code= couponExist.code).count()
            if(couponExist.status == 'active' and couponExist.start_date <= today <= couponExist.end_date and (couponExist.total_count == 0 or couponExist.used_count < couponExist.total_count or  coupon_count < couponExist.per_user_limit)):
                if request.user and request.user.id:
                    # cart_total= Cart.objects.filter(user=request.user.id).aggregate(cart_total=sum('total_price'))
                    Cart.objects.filter(user=request.user.id).update(coupon_code=couponExist.code,coupon_val=couponExist.discount_value,coupon_type=couponExist.discount_type)
                else:
                    # cart_total= Cart.objects.filter(tmp_id=self.kwargs['pk']).aggregate(cart_total=sum('total_price'))
                    # .aggregate(cart_total=Sum('total_price')

                    Cart.objects.filter(tmp_id=self.kwargs['pk']).update(coupon_code=couponExist.code,coupon_val=couponExist.discount_value,coupon_type=couponExist.discount_type)


                # if cart_total < self.min_price:
                #     return False
                # if self.max_price and cart_total > self.max_price:
                #     return False
                # return True

                # remove coupon on qty change and on deletion of product



                return Response({"status": "success","message": "Coupon applied","result": {"coupon_code":couponExist.code,"coupon_val":couponExist.discount_value,"coupon_type":couponExist.discount_type}},status=status.HTTP_200_OK)
            else:
                if not self.start_date <= today <= self.end_date:
                    couponExist.is_active= False
                    couponExist.status= 'expired'
                    return Response({"status": "success","message": "Expired Coupon"},status=status.HTTP_200_OK)
                
        return Response({"status": "success","message": "Coupon Not applicable"},status=status.HTTP_200_OK) 


    @action(detail=True,methods=['GET'],permission_classes=[AllowAny],serializer_class=CartResponseSerializer,url_path='remove_coupon_code')
    def RemoveCoponCode(self,request,**kwargs):
        if request.user and request.user.id:
            Cart.objects.filter(user=request.user.id).update(coupon_code='',coupon_val=0.00,coupon_type='')
        else:
            Cart.objects.filter(tmp_id=self.kwargs['pk']).update(coupon_code='',coupon_val=0.00,coupon_type='')
        return Response({"status": "success","message": "Successfully removed the coupon!"},status=status.HTTP_200_OK) 
    

    @action(detail=True,methods=['GET'],permission_classes=[AllowAny],serializer_class=CartResponseSerializer,url_path='cart_clear')
    def ClearCart(self,request,**kwargs):
        if request.user and request.user.id:
            cart=Cart.objects.filter(user=request.user.id)
        else:
            cart=Cart.objects.filter(tmp_id=self.kwargs['pk'])
        cart.all().delete()
        return Response({"status": "success","message": "Successfully Updated"},status=status.HTTP_200_OK)



class ShippingRateView(APIView):
    permission_classes =  [permissions.IsAuthenticated]

    def post(self, request):
        try:
            data = request.data
            length_in = 0
            width_in = 0
            height_in = 0
            weight_lb = 0

            recipient_address = data['shipping']
            record = get_or_none(Settings, name="shipping_exemption")
            exemption_threshold = float(record.value) if record and record.value else 0

            cart_items = Cart.objects.filter(user=request.user.id,selected=True)

            # Category-based shipping fee: qPLEX PCR Assays / Extraction & Sample Prep
            # (group A) get a flat fee only when their own subtotal is under $500;
            # Consumables & Lab Supplies / PPE (group B) always add a fee per distinct
            # product line, on top, regardless of cart total.
            group_a_subtotal = Decimal("0.00")
            group_b_line_count = 0
            has_group_a = False
            has_group_b = False
            category_cart_ids = set()
            for item in cart_items:
                group = _category_group(item.product)
                if group == 'A':
                    has_group_a = True
                    group_a_subtotal += item.total_price or Decimal("0.00")
                    category_cart_ids.add(item.id)
                elif group == 'B':
                    has_group_b = True
                    group_b_line_count += 1
                    category_cart_ids.add(item.id)

            category_fee = Decimal("0.00")
            if has_group_a and group_a_subtotal < GROUP_A_FREE_THRESHOLD:
                category_fee += GROUP_A_FLAT_FEE
            if has_group_b:
                category_fee += GROUP_B_PER_ITEM_FEE * group_b_line_count

            shippment_req_prds = cart_items.filter(product__is_shipping_required = True)
            shippment_not_req_prds_qs = cart_items.filter(product__is_shipping_required = False)
            shippment_not_req_prds = shippment_not_req_prds_qs.aggregate(cart_total=Sum('total_price'))
            other_cart_total = shippment_not_req_prds['cart_total'] or 0
            total_shipment_items = shippment_req_prds
            if not other_cart_total >= exemption_threshold:
                total_shipment_items= shippment_req_prds | shippment_not_req_prds_qs

            if len(total_shipment_items) == 0:
                if category_fee > 0:
                    Cart.objects.filter(user=request.user.id,selected=True).update(shipping_amt = category_fee)
                    result = [{
                        "service_code": "20",
                        "service_name": "Flat Rate Shipping",
                        "currency": "USD",
                        "total_charge": str(category_fee),
                    }]
                    return Response({"status": "success","message": "Data fetched successfully","result":result},status=status.HTTP_200_OK)
                return Response({"status": "success","message": "Free Shipping","type":"free_shipping"},status=status.HTTP_200_OK)

            has_other_items = bool(
                set(total_shipment_items.values_list('id', flat=True)) - category_cart_ids
            )

            for  eachItem in  total_shipment_items:
                prdSKU = get_or_none(ProductSKU,product=eachItem.product,sku_code=eachItem.sku_code)
                length_in += prdSKU.length
                width_in += prdSKU.width
                height_in += prdSKU.height
                weight_lb += prdSKU.weight

            # UPS rejects zero-weight packages, so send a minimal fallback when data is missing.
            if weight_lb <= 0:
                weight_lb = 0.10

            package={
                'length_in':length_in,
                'width_in':width_in,
                'height_in':height_in,
                'weight_lb':weight_lb,
                'totalCartItems' : len(data['cartData'])
            }
            rates = ups.get_rates(recipient_address=recipient_address,package=package)
            print("rates ====>",rates)

            ups_rate = Decimal(str(rates[0]['total_charge'])) if rates else Decimal("0.00")

            if category_fee > 0:
                # UPS is still called above for weight/tracking data, but the charged
                # amount for category-priced items is the flat/per-item fee, not the
                # UPS quote — the quote is only added on top for any non-categorized
                # ("other") items sharing the same package.
                final_amount = category_fee + (ups_rate if has_other_items else Decimal("0.00"))
                base_entry = dict(rates[0]) if rates else {
                    "service_code": "03",
                    "service_name": "UPS Ground",
                    "currency": "USD",
                }
                base_entry["total_charge"] = str(final_amount)
                result = [base_entry]
            else:
                final_amount = ups_rate
                result = rates

            if category_fee > 0 or rates:
                Cart.objects.filter(user=request.user.id,selected=True).update(shipping_amt = final_amount)

            return Response({"status": "success","message": "Data fetched successfully","result":result},status=status.HTTP_200_OK)
        except KeyError as e:
            return Response({"error": f"Missing field: {e}"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"UPS rate error: {e}")
            return Response({"error": str(e) or "Failed to fetch rates"}, status=status.HTTP_502_BAD_GATEWAY)


class TrackShipmentView(APIView):
    permission_classes =  [permissions.IsAuthenticated]

    def get(self, request, tracking_number):
        try:
            result = ups.track_shipment(tracking_number)
            return Response(result)
        except Exception as e:
            logger.error(f"UPS tracking error: {e}")
            return Response({"error": "Failed to fetch tracking info"}, status=status.HTTP_502_BAD_GATEWAY)
class CalculateTaxView(APIView):
    def post(self, request):
        data = request.data

        tax_row= TaxConfig.objects.first()
        if not tax_row:
            return Response({"error": "Tax configuration is missing."}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = Cart.objects.filter(user=request.user.id,selected=True)
        if not cart_items.exists():
            return Response({"error": "No selected cart items found for tax calculation."}, status=status.HTTP_400_BAD_REQUEST)

        required_fields = {
            "shipping_country": data.get("shipping_country"),
            "shipping_postal_code": data.get("shipping_postal_code"),
            "shipping_state": data.get("shipping_state"),
            "amount": data.get("amount"),
        }
        missing_fields = [field for field, value in required_fields.items() if value in (None, "", [])]
        if missing_fields:
            return Response(
                {"error": f"Missing required field(s): {', '.join(missing_fields)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # --- QuickBooks tax path ---
        if tax_row.provider == "quickbooks":
            from decimal import Decimal
            from order.tax_service import _calculate_with_quickbooks
            try:
                qb_tax_amount, qb_tax_rate, _county = _calculate_with_quickbooks(
                    subtotal=Decimal(str(data['amount'])),
                    shipping_cost=Decimal(str(data.get('shipping', 0) or 0)),
                    to_state=data['shipping_state'],
                    to_zip=data['shipping_postal_code'],
                    to_country=data['shipping_country'],
                    to_city=data.get('shipping_city', ''),
                    to_street=data.get('shipping_address_line1', ''),
                )
            except Exception as e:
                logger.warning("QuickBooks tax calculation failed | error=%s", e)
                return Response({'error': f'Unable to calculate tax from QuickBooks: {e}'}, status=status.HTTP_400_BAD_REQUEST)

            return Response({"status": "success", "result": {
                "amount_to_collect": float(qb_tax_amount),
                "rate":              float(qb_tax_rate),
                "has_nexus":         float(qb_tax_amount) > 0,
                "taxable_amount":    float(data['amount']),
                "freight_taxable":   False,
            }}, status=200)

        # --- TaxJar path (used when provider is set to "taxjar") ---
        payload = {
            # Ship FROM — your warehouse
            'from_country': tax_row.nexus_country ,
            'from_zip':    tax_row.nexus_zip ,
            'from_state':  tax_row.nexus_state ,
            'from_city':   tax_row.nexus_city ,
            'from_street':  tax_row.nexus_street ,

            # Ship TO — customer
            'to_country': data['shipping_country'],   # 'US'
            'to_zip':     data['shipping_postal_code'],        # required for US
            'to_state':   data['shipping_state'],      # required for US
            'to_city':    data.get('shipping_city', ''),
            'to_street':  data.get('shipping_address_line1', ''),

            # Order amounts
            'amount':   data['amount'],          # subtotal excl. shipping
            'shipping': data.get('shipping', 0),

            # Line items
            'line_items': [
                {
                    'id':str(item.id),
                    'quantity':int(item.quantity),
                    'unit_price':float(item.price),
                    'discount':float(0),
                    # item.get('discount', 0),
                    # 'product_tax_code':  item.get('product_tax_code', ''),
                }
                for item in cart_items
            ],

        }
        response = requests.post(f'{get_base_url(tax_row)}/taxes',headers=get_taxjar_headers(tax_row),json=payload,)
        # TaxJar returned an error
        if response.status_code != 200:
            try:
                error_payload = response.json()
            except ValueError:
                error_payload = {}

            detail = (
                error_payload.get('detail')
                or error_payload.get('error')
                or error_payload.get('message')
                or response.text
                or 'TaxJar error'
            )
            logger.warning(
                "Tax calculation failed | status=%s | payload=%s | detail=%s",
                response.status_code,
                payload,
                detail,
            )
            return Response(
                {'error': detail},
                status=status.HTTP_400_BAD_REQUEST
            )
        tax = response.json()['tax']
        return Response({"status": "success", "result": {
            "amount_to_collect": tax['amount_to_collect'],
            "rate":              tax['rate'],
            "has_nexus":         tax['has_nexus'],
            "taxable_amount":    tax['taxable_amount'],
            "freight_taxable":   tax['freight_taxable'],
        }}, status=200)
