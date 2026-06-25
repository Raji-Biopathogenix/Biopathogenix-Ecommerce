
from django.urls import path, include
from rest_framework import routers

from users.views import CustomerViews,LoginCustomer,OTPView,VerifyOTP,ForgotPasswordAPIView,ChangePasswordAPIView,VerificationEmail,ActivationEmail,EmailAvailabilityView

from country.views import StateViewset,CountryViewset

from category.views import CategoryViewset, GetCategoryChildrenWithProducts
from product.views import ProductViewset,GetProductDetialData,GetAllProductSlugs
# GetProductByCategoryView, GetProductBySubCategoryView
from cart.views import CartViewset,ShippingRateView,TrackShipmentView,CalculateTaxView
from shipping.views import AddressViewset
from order.views import CheckoutView,UserOrdersView,AllOrdersView,orderItemsView,orderReturnRequestView,AdminorderReturnRequestView,AdminorderUpdateView,ShippmentOrderItemsView,CreateOutboundShipmentView,InitiateReturnView,DownloadLabelView,CancelOrderView,CancelOrderItemView,RefundOrderView,PrintLabelView

from home.views import HeaderMenuViewset, CareerOpenRoleViewset, CareerApplicationCreateView,LandingPageView,BlogPostViewset

from api.views import AssayInquiryView, ContactValidationView, CustomTargetRequestView
from payments.views import create_payment_intent, create_setup_intent, list_payment_methods, save_payment_method, stripe_config


router = routers.DefaultRouter()
router.register(r'states',StateViewset,'states')
router.register(r'categories',CategoryViewset,'categories')
router.register(r'products',ProductViewset,'products')
router.register(r'cart',CartViewset,'cart')
router.register(r'address',AddressViewset,'address')
router.register(r'countries',CountryViewset,'countries')
router.register(r'headermenu',HeaderMenuViewset,'headermenu')
router.register(r'open-roles',CareerOpenRoleViewset,'open-roles')
router.register(r'blog-posts',BlogPostViewset,'blog-posts')








# Login 
urlpatterns =[
    path('signup/', CustomerViews.as_view(), name='signup'),
    path('check-email/', EmailAvailabilityView.as_view(), name='check-email'),
    path('login/', LoginCustomer.as_view(), name='login'),
    path('send-otp/', OTPView.as_view(), name='send-otp'),
    path('verify-otp/', VerifyOTP.as_view(), name='verify-otp'),
    path('forgot-password/', ForgotPasswordAPIView.as_view(), name='forgot-password'),
    path('change-password/', ChangePasswordAPIView.as_view(), name='change-password'),
    path('superadmin/forgot-password/', ForgotPasswordAPIView.as_view(), name='superadmin-forgot-password'),
    path('verify-user/',VerificationEmail,name='verify-user'),
    path('activate-user/',ActivationEmail,name='activate-user'),   
]


#home 
urlpatterns +=[
    path('landing-page/',LandingPageView,name='landing-page/'),
]



# cart
urlpatterns += [
    path("rates/", ShippingRateView.as_view(), name="shipping-rates"),
    path("tax/calculate/", CalculateTaxView.as_view(), name="tax_calculate"),
    path("track/<str:tracking_number>/", TrackShipmentView.as_view(), name="track-shipment"),
    
]



# products
urlpatterns +=[
    # path("get-products-by-category",GetProductByCategoryView,name="get-products-by-category"),
    # path("get-products-by-sub-category",GetProductBySubCategoryView,name="get-products-by-sub-category"),
    path("product_detail",GetProductDetialData,name="product_detail"),
    path("product-slugs/", GetAllProductSlugs, name="product_slugs"),
    path("category-children-products", GetCategoryChildrenWithProducts, name="category_children_products"),    
]





# Orders
urlpatterns += [
    path("checkout/",CheckoutView,name="checkout"),
    path("orders/", UserOrdersView, name="user_orders"),
    path("all_orders/", AllOrdersView, name="all_orders"),
    path("orderItems/", orderItemsView, name="orderItems"),
    path("shipment_orderItems/", ShippmentOrderItemsView, name="shipment_orderItems"),
    path("order_return_request/", orderReturnRequestView, name="orderReturnRequest"),
    path("admin_order_return_handle/", AdminorderReturnRequestView, name="AdminorderReturnRequestHandle"),
    path("admin_order_edit_handle/", AdminorderUpdateView, name="admin_order_edit_handle"),
    path("contact-validation/", ContactValidationView.as_view(), name="contact_validation"),
    path("assay-inquiry/", AssayInquiryView.as_view(), name="assay_inquiry"),
    path("custom-target-request/", CustomTargetRequestView.as_view(), name="custom_target_request"),
    path("career-applications/", CareerApplicationCreateView.as_view(), name="career_applications"),
    path('<int:order_id>/create_order_shipments/',CreateOutboundShipmentView.as_view(),name='create-shipment'),
    path('<int:order_id>/initiate_return/',InitiateReturnView.as_view(),name='initiate-return'),
    path('shipments/<int:shipment_id>/label/download/',DownloadLabelView.as_view(),name='shipment-label-download'),
    path('<int:order_id>/cancel/',CancelOrderView.as_view(),name='cancel'),
    path('<int:order_id>/refund/',RefundOrderView.as_view(),name='refund'),
    path('<int:order_id>/items/<int:item_id>/cancel/',CancelOrderItemView.as_view(),name='cancel-order-item'),
    path('<int:shipment_id>/printlable/',PrintLabelView.as_view(),name='print-shipment-label'),

    
]


urlpatterns += [
    path('', include(router.urls)),
]


urlpatterns += [
    path("payment-methods/payment-intent/", create_payment_intent, name="payment_methods_payment_intent"),
    path("payment-methods/setup-intent/", create_setup_intent, name="payment_methods_setup_intent"),
    path("payment-methods/", list_payment_methods, name="payment_methods_list"),
    path("payment-methods/save/", save_payment_method, name="payment_methods_save"),
    path("payment-methods/stripe-config/", stripe_config, name="payment_methods_stripe_config"),
]



