from django.db import OperationalError, ProgrammingError
from rest_framework import serializers
from .models import Product, ProductImage, ProductDocument, ProductFaQ, Pathogen, ProductAssayDetail, ProductRelatedInfo, AssayPanelTargetDocument
from category.serializers import CategoryListSerializer
from prd_variant.serializers import ProductSKUSerializer
from users.models import CustomUser,CustomizableProductprices
from users.serializers import CustomizableProductpriceSerializer
from api.views import get_or_none


ASSAY_CATEGORY_SLUG_MARKERS = {
    'qplex-pcr-assays',
    'respiratory-tract-infections',
    'urinary-tract-infections',
    'urogenital-infections',
    'gastrointestinal-infections',
    'wound-and-nail-infections',
}


def _get_customer_product_price_data(product, user_id):
    if not user_id or not product.is_customizable:
        return None

    user = get_or_none(CustomUser, id=user_id)
    if not user or not user.laboratory_id:
        return None

    custom_price = CustomizableProductprices.objects.filter(
        product=product.id,
        laboratory_id=user.laboratory_id,
    ).first()
    return CustomizableProductpriceSerializer(custom_price).data if custom_price else None


def _requires_login_to_view_price(product):
    try:
        if product.assay_detail:
            return True
    except ProductAssayDetail.DoesNotExist:
        pass

    category_slugs = []
    categories = getattr(product, '_prefetched_objects_cache', {}).get('categories')
    if categories is not None:
        category_slugs = [category.slug for category in categories]
        category_slugs.extend(category.parent.slug for category in categories if category.parent_id and category.parent)
    else:
        category_slugs = list(
            product.categories.filter(is_active=True).values_list('slug', flat=True)
        )
        category_slugs.extend(
            product.categories.filter(parent__isnull=False, is_active=True).values_list('parent__slug', flat=True)
        )

    return any(
        slug in ASSAY_CATEGORY_SLUG_MARKERS or 'assay' in slug or 'qplex' in slug
        for slug in category_slugs
        if slug
    )


class ProductFaqSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductFaQ
        fields = ['id','question', 'answer']

class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id','image', 'image_url', 'alt_text', 'is_primary', 'sort_order']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return None



class ProductPrimaryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['image', 'alt_text']


class ProductRelatedInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRelatedInfo
        fields = ['id', 'title', 'content', 'sort_order']


# class ProductListSerializer(serializers.ModelSerializer):
#     category_name = serializers.CharField(source='category.name', read_only=True)
#     category_slug = serializers.CharField(source='category.slug', read_only=True)
#     primary_image = serializers.SerializerMethodField()
#     discount_percentage = serializers.SerializerMethodField()

#     class Meta:
#         model = Product
#         fields = ['id', 'name', 'slug', 'category', 'category_name', 'category_slug', 'short_description',
#                   'sku', 'price', 'compare_price', 'discount_percentage', 'stock_quantity',
#                   'is_in_stock', 'is_featured', 'primary_image', 'views_count', 'created_at']

#     def get_primary_image(self, obj):
#         image = obj.images.filter(is_primary=True).first()
#         if image:
#             request = self.context.get("request")
#             return ProductImageSerializer(image,context={'request': request}).data
#         return None

#     def get_discount_percentage(self, obj):
#         if obj.compare_price and obj.compare_price > obj.price:
#             return int(((obj.compare_price - obj.price) / obj.compare_price) * 100)
#         return 0






class CartProductItemSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    prd_customization_prices = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug','sku', 'price', 'stock_quantity','is_in_stock', 'is_featured', 'primary_image','is_customizable','has_variants','trademark','prd_customization_prices']

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first()
        if image:
            request = self.context.get("request")
            return ProductImageSerializer(image,context={'request': request}).data
        return None
    
    def get_prd_customization_prices(self, obj):
        user_id = self.context.get('user_id')
        return _get_customer_product_price_data(obj, user_id)




class ProductByCategorySerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    hover_image = serializers.SerializerMethodField()
    parent_category_slug = serializers.SerializerMethodField()
    sub_category_slug = serializers.SerializerMethodField()
    prd_variants = serializers.SerializerMethodField()
    prd_skus = serializers.SerializerMethodField()
    prd_customization_prices = serializers.SerializerMethodField()
    requires_login_to_view_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug','sku', 'price', 'compare_price', 'discount_value', 'stock_quantity','is_in_stock', 'is_featured', 'primary_image','hover_image', 'parent_category_slug', 'sub_category_slug','is_customizable','has_variants','prd_variants','prd_skus','trademark','is_customizable','prd_customization_prices','requires_login_to_view_price']


    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first()
        if image:
            request = self.context.get("request")
            return ProductPrimaryImageSerializer(image,context={'request': request}).data
        return None


    def get_hover_image(self, obj):
        image = obj.images.filter(hover=True).first()
        if image:
            request = self.context.get("request")
            return ProductPrimaryImageSerializer(image,context={'request': request}).data
        return None

    def _get_child_category(self, obj):
        return obj.categories.filter(parent__isnull=False, is_active=True).first()

    def get_parent_category_slug(self, obj):
        child = self._get_child_category(obj)
        if child and child.parent:
            return child.parent.slug
        return None

    def get_sub_category_slug(self, obj):
        child = self._get_child_category(obj)
        if child:
            return child.slug
        return None
    
    def get_prd_variants(self, obj):
        variant_options = obj.variant_options.select_related('variant_option__variant')
        grouped = {}
        for pvo in variant_options:
            variant = pvo.variant_option.variant
            if variant.id not in grouped:
                grouped[variant.id] = {
                    'id': variant.id,
                    'name': variant.name,
                    'order': variant.order,
                    'variant_options': []
                }
            grouped[variant.id]['variant_options'].append({
                'id': pvo.variant_option.id,
                'value': pvo.variant_option.value,
                'order': pvo.variant_option.order,
                'selected':False
            })

        return list(grouped.values())


    def get_prd_skus(self, obj):
        skus = getattr(obj, 'active_skus', [])
        if not skus:
            return None
        return ProductSKUSerializer(skus,many=True).data

    def get_prd_customization_prices(self, obj):
        user_id = self.context.get('user_id')
        return _get_customer_product_price_data(obj, user_id)

    def get_requires_login_to_view_price(self, obj):
        return _requires_login_to_view_price(obj)








class ProductDetailImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['image','is_primary']


class ProductDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    sku_code = serializers.CharField(source='sku.sku_code', read_only=True)
    section = serializers.CharField(source='section.name', read_only=True)
    file_extension = serializers.SerializerMethodField()

    class Meta:
        model = ProductDocument
        fields = [
            'id', 'section', 'certificate_type', 'title', 'file_url',
            'file_extension', 'sku_id', 'sku_code', 'sort_order'
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj.file:
            return None
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def get_file_extension(self, obj):
        if not obj.file:
            return ''
        return obj.file.name.rsplit('.', 1)[-1].lower() if '.' in obj.file.name else ''








class ProductDetailSerializer(serializers.ModelSerializer):
    prd_images = serializers.SerializerMethodField()
    prd_faqs = serializers.SerializerMethodField()
    prd_variants = serializers.SerializerMethodField()
    prd_skus = serializers.SerializerMethodField()
    recommended_products = serializers.SerializerMethodField()
    documents = serializers.SerializerMethodField()
    related_information = serializers.SerializerMethodField()
    category_path = serializers.SerializerMethodField()
    prd_customization_prices = serializers.SerializerMethodField()
    requires_login_to_view_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug','sku', 'price', 'compare_price', 'discount_value', 'stock_quantity','is_in_stock', 'is_featured', 'prd_images','description','short_description','prd_skus','has_variants','prd_variants','documents','related_information','category_path','recommended_products','is_customizable','trademark','prd_faqs','prd_customization_prices','requires_login_to_view_price']

# 


    def get_prd_images(self, obj):
        image = obj.images.order_by('sort_order')
        if image:
            request = self.context.get("request")
            return ProductDetailImageSerializer(image,many=True,context={'request': request}).data
        return None

    def get_prd_faqs(self, obj):
        faqs = obj.faq.filter(is_active=True).order_by('sort_order')
        return ProductFaqSerializer(faqs,many=True).data
    
    def get_prd_skus(self, obj):
        skus = getattr(obj, 'active_skus', [])
        if not skus:
            return None
        return ProductSKUSerializer(skus,many=True).data

    
    def get_prd_variants(self, obj):
        variant_options = obj.variant_options.select_related(
            'variant_option__variant'
        )
        
        grouped = {}
        for pvo in variant_options:
            variant = pvo.variant_option.variant
            if variant.id not in grouped:
                grouped[variant.id] = {
                    'id': variant.id,
                    'name': variant.name,
                    'order': variant.order,
                    'variant_options': []
                }
            grouped[variant.id]['variant_options'].append({
                'id': pvo.variant_option.id,
                'value': pvo.variant_option.value,
                'order': pvo.variant_option.order,
                'selected':False
            })

        return list(grouped.values())

    def get_documents(self, obj):
        documents = getattr(obj, 'active_documents', None)
        if documents is None:
            documents = obj.documents.filter(is_active=True).select_related('section', 'sku')
        request = self.context.get("request")
        return ProductDocumentSerializer(documents, many=True, context={'request': request}).data

    def get_related_information(self, obj):
        try:
            related_information = getattr(obj, 'active_related_information', None)
            if related_information is None:
                related_information = obj.related_information.filter(is_active=True).order_by('sort_order', 'id')
            return ProductRelatedInfoSerializer(related_information, many=True).data
        except (OperationalError, ProgrammingError):
            return []

    def get_category_path(self, obj):
        child_category = obj.categories.filter(parent__isnull=False, is_active=True).select_related('parent').first()
        if not child_category or not child_category.parent:
            return None
        return {
            "parent_slug": child_category.parent.slug,
            "sub_category_slug": child_category.slug,
        }

    def get_recommended_products(self, obj):
        child_categories = obj.categories.filter(parent__isnull=False)
        if child_categories:
            request = self.context.get("request")
            user_id = self.context.get("user_id")
            recommended = Product.objects.filter(categories__in=child_categories).exclude(id=obj.id).distinct()[:10]
            return ProductByCategorySerializer(
                recommended,
                many=True,
                context={'request': request, 'user_id': user_id},
            ).data
        return None


    def get_prd_customization_prices(self, obj):
        user_id = self.context.get('user_id')
        return _get_customer_product_price_data(obj, user_id)

    def get_requires_login_to_view_price(self, obj):
        return _requires_login_to_view_price(obj)


# ── Assay / Pathogen serializers ──────────────────────────────────────────────

class PathogenSerializer(serializers.ModelSerializer):
    pathogen_type_label = serializers.CharField(source='get_pathogen_type_display', read_only=True)

    class Meta:
        model = Pathogen
        fields = ['id', 'name', 'scientific_name', 'pathogen_type', 'pathogen_type_label']


class ProductAssayDetailSerializer(serializers.ModelSerializer):
    assay_type_label = serializers.CharField(source='get_assay_type_display', read_only=True)

    class Meta:
        model = ProductAssayDetail
        fields = ['assay_type', 'assay_type_label', 'reaction_format', 'panel_name', 'catalog_number', 'target_count']


class AssayProductSerializer(serializers.ModelSerializer):
    """Product serializer enriched with assay detail and pathogens for assay landing pages."""
    primary_image = serializers.SerializerMethodField()
    assay_detail = ProductAssayDetailSerializer(read_only=True)
    documents = serializers.SerializerMethodField()
    related_information = serializers.SerializerMethodField()
    short_description = serializers.CharField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'sku', 'short_description',
            'price', 'compare_price', 'is_in_stock',
            'primary_image', 'assay_detail', 'documents', 'related_information', 'trademark',
        ]

    def get_primary_image(self, obj):
        image = obj.images.filter(is_primary=True).first()
        if image:
            request = self.context.get('request')
            return ProductPrimaryImageSerializer(image, context={'request': request}).data
        return None

    def get_documents(self, obj):
        documents = getattr(obj, 'active_documents', None)
        if documents is None:
            documents = obj.documents.filter(is_active=True).select_related('section', 'sku')
        request = self.context.get('request')
        return ProductDocumentSerializer(documents, many=True, context={'request': request}).data

    def get_related_information(self, obj):
        try:
            related_information = getattr(obj, 'active_related_information', None)
            if related_information is None:
                related_information = obj.related_information.filter(is_active=True).order_by('sort_order', 'id')
            return ProductRelatedInfoSerializer(related_information, many=True).data
        except (OperationalError, ProgrammingError):
            return []


class AssayPanelTargetDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_extension = serializers.SerializerMethodField()
    panel_type_label = serializers.CharField(source='get_panel_type_display', read_only=True)
    document_type_label = serializers.CharField(source='get_document_type_display', read_only=True)

    class Meta:
        model = AssayPanelTargetDocument
        fields = [
            'id', 'panel_type', 'panel_type_label', 'document_type',
            'document_type_label', 'title', 'file_url', 'file_extension',
            'target_count', 'sort_order',
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if not obj.file:
            return None
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def get_file_extension(self, obj):
        if not obj.file:
            return ''
        return obj.file.name.rsplit('.', 1)[-1].lower() if '.' in obj.file.name else ''
