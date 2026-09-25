
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
            from order.pricing import price_items, shipping_quote
            items = list(Cart.objects.filter(user=request.user, selected=True).select_related('product'))
            price_items(items, request.user)
            amount = shipping_quote(items, request.data['shipping'])
            if amount == 0:
                return Response({"status": "success", "message": "Free Shipping", "type": "free_shipping"})
            return Response({"status": "success", "result": [{
                "service_code": "03", "service_name": "Shipping", "currency": "USD",
                "total_charge": str(amount),
            }]})
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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from order.pricing import price_items, coupon_discount, money
        from order.tax_service import calculate_tax_and_shipping

        data = request.data
        required = ('shipping_country', 'shipping_postal_code', 'shipping_state')
        missing = [field for field in required if not data.get(field)]
        if missing:
            return Response({'error': f"Missing required field(s): {', '.join(missing)}"}, status=400)

        try:
            items = list(Cart.objects.filter(user=request.user, selected=True).select_related('product'))
            # Match final checkout using validated catalog prices and coupon,
            # rather than trusting the browser's pre-discount amount.
            subtotal = price_items(items, request.user)
            _, discount = coupon_discount(items, request.user, subtotal)
            discounted_subtotal = money(subtotal - discount)
            quote = calculate_tax_and_shipping(
                subtotal=discounted_subtotal,
                shipping_cost=money(data.get('shipping', 0) or 0),
                shipping_state=data['shipping_state'],
                shipping_country=data['shipping_country'],
                shipping_postal_code=data['shipping_postal_code'],
                shipping_city=data.get('shipping_city', ''),
                shipping_address_line1=data.get('shipping_address_line1', ''),
                item_quantity=sum(item.quantity for item in items),
            )
        except ValueError as exc:
            return Response({'error': str(exc)}, status=400)
        except Exception:
            logger.exception('Unable to calculate checkout tax preview')
            return Response({'error': 'Unable to calculate tax. Please try again.'}, status=503)

        return Response({'status': 'success', 'result': {
            'amount_to_collect': quote['tax_amount'],
            'rate': quote['tax_rate'],
            'taxable_amount': float(discounted_subtotal),
        }})
