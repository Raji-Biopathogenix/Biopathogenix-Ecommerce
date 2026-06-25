

import json
from itertools import product as itertools_product

from django import forms
from django.contrib import admin
from django.db import transaction
from django.utils.html import format_html
from django.utils.safestring import mark_safe


from django.contrib import admin
from .models import Product, ProductImage
from prd_variant.models import ProductSKU,ProductVariantOption,ProductSKUOption
from variant.models import Variant,VariantOption

# class ProductImageInline(admin.TabularInline):
#     model = ProductImage
#     extra = 1
#     fields = ['image', 'alt_text', 'is_primary', 'sort_order']


# @admin.register(Product)
# class ProductAdmin(admin.ModelAdmin):
#     list_display  = ['name', 'sku', 'get_categories', 'price', 'stock_quantity', 'is_active', 'is_featured', 'created_at']
#     list_filter   = ['is_active', 'is_featured', 'categories', 'created_at']
#     search_fields = ['name', 'sku', 'description']
#     prepopulated_fields = {'slug': ('name',)}
#     readonly_fields = ['created_by', 'updated_by', 'created_at', 'updated_at', 'views_count']

#     inlines = [ProductImageInline]

#     fieldsets = (
#         ('Basic Info', {
#             'fields': ('name', 'slug', 'sku')
#         }),
#         ('Categories', {
#             'fields': ('categories',),                        
#         }),
#         ('Description', {
#             'fields': ('short_description', 'description')
#         }),
#         ('Pricing', {
#             'fields': ('price', 'compare_price', 'cost_price')
#         }),
#         ('Inventory', {
#             'fields': ('stock_quantity', 'low_stock_threshold')
#         }),
#         ('Dimensions', {
#             'fields': ('weight', 'length', 'width', 'height'),
#             'classes': ('collapse',)
#         }),
#         ('SEO', {
#             'fields': ('meta_title', 'meta_description'),
#             'classes': ('collapse',)
#         }),
#         ('Status', {
#             'fields': ('is_active', 'is_featured')
#         }),
#         ('Metadata', {
#             'fields': ('views_count', 'created_by', 'updated_by', 'created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )

#     # Renders categories as comma-separated in list view
#     @admin.display(description='Categories')
#     def get_categories(self, obj):
#         return ', '.join(obj.categories.values_list('name', flat=True)) or '—'

    
#     filter_horizontal = ('categories',)

#     def save_model(self, request, obj, form, change):
#         if not change:
#             obj.created_by = request.user
#         obj.updated_by = request.user
#         super().save_model(request, obj, form, change)

#     def get_queryset(self, request):
#         qs = super().get_queryset(request)
#         return qs.prefetch_related('categories')


# @admin.register(ProductImage)
# class ProductImageAdmin(admin.ModelAdmin):
#     list_display = ['product', 'image', 'is_primary', 'sort_order', 'created_at']
#     list_filter  = ['is_primary', 'created_at']
#     search_fields = ['product__name', 'alt_text']



# import json
# from django.contrib import admin
# from django.db import transaction
# from django.utils.safestring import mark_safe




# class ProductImageInline(admin.TabularInline):
#     model = ProductImage
#     extra = 1
#     fields = ['image', 'alt_text', 'is_primary', 'sort_order']


# class ProductSKUInline(admin.TabularInline):
#     model = ProductSKU
#     extra = 0
#     fields = ['sku_code', 'price', 'stock', 'is_active']
#     readonly_fields = ['sku_code']
#     can_delete = True

#     def has_add_permission(self, request, obj=None):
#         return False


# @admin.register(Product)
# class ProductAdmin(admin.ModelAdmin):

#     list_display        = ['name', 'sku', 'get_categories', 'price', 'stock_quantity', 'is_active', 'is_featured', 'created_at']
#     list_filter         = ['is_active', 'is_featured', 'categories', 'created_at']
#     search_fields       = ['name', 'sku', 'description']
#     prepopulated_fields = {'slug': ('name',)}
#     filter_horizontal   = ('categories',)
#     inlines             = [ProductImageInline, ProductSKUInline]
#     change_form_template = 'admin/product/product/change_form.html'

#     readonly_fields = [
#         'variant_selector',
#         'created_by', 'updated_by', 'created_at', 'updated_at', 'views_count'
#     ]

#     fieldsets = (
#         ('Basic Info', {'fields': ('name', 'slug', 'sku')}),
#         ('Categories', {'fields': ('categories',)}),
#         ('Description', {'fields': ('short_description', 'description')}),
#         ('Pricing', {'fields': ('price', 'compare_price', 'cost_price')}),
#         ('Inventory', {'fields': ('stock_quantity', 'low_stock_threshold')}),
#         ('Variants & SKU Generator', {
#             'fields': ('variant_selector',),
#             'description': 'Select variant options to auto-generate SKU combinations.'
#         }),
#         ('Dimensions', {'fields': ('weight', 'length', 'width', 'height'), 'classes': ('collapse',)}),
#         ('SEO', {'fields': ('meta_title', 'meta_description'), 'classes': ('collapse',)}),
#         ('Status', {'fields': ('is_active', 'is_featured')}),
#         ('Metadata', {
#             'fields': ('views_count', 'created_by', 'updated_by', 'created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )

#     def variant_selector(self, obj):
#         selected_ids = []
#         if obj and obj.pk:
#             selected_ids = list(
#                 ProductVariantOption.objects
#                 .filter(product=obj)
#                 .values_list('variant_option_id', flat=True)
#             )
#         selected_str = ','.join(str(i) for i in selected_ids)

#         return mark_safe(f"""
#         <div id="variant-sku-section" style="width:100%;">
#             <input type="hidden" name="selected_variant_options"
#                    id="selected_variant_options" value="{selected_str}">
#             <input type="hidden" name="sku_combinations" id="sku_combinations" value="">
#             <div id="variant-checkboxes">
#                 <p style="color:#999; font-size:13px;">
#                     Please select a category above to load variants.
#                 </p>
#             </div>
#             <div id="sku-preview-section" style="margin-top:20px; display:none;">
#                 <h3 style="font-size:14px; margin-bottom:8px; color:#333;">📦 SKU Combinations</h3>
#                 <table style="width:100%; border-collapse:collapse; font-size:13px;">
#                     <thead>
#                         <tr style="background:#f0f0f0;">
#                             <th style="padding:8px; border:1px solid #ddd; text-align:left;">SKU Code</th>
#                             <th style="padding:8px; border:1px solid #ddd; text-align:left;">Price</th>
#                             <th style="padding:8px; border:1px solid #ddd; text-align:left;">Stock</th>
#                         </tr>
#                     </thead>
#                     <tbody id="sku-preview-body"></tbody>
#                 </table>
#             </div>
#         </div>
#         """)

#     variant_selector.short_description = 'Variant Options'


#     def add_view(self, request, form_url='', extra_context=None):
#         extra_context = extra_context or {}
#         print("_get_all_variants_json-1",self._get_all_variants_json())
#         extra_context['all_variants_json'] = self._get_all_variants_json()
#         extra_context['variants_json']     = '[]'   # none selected yet
#         extra_context['selected_json']     = '[]'
#         return super().add_view(request, form_url, extra_context)

#     def change_view(self, request, object_id, form_url='', extra_context=None):
#         extra_context = extra_context or {}
#         print("_get_all_variants_json-2",self._get_all_variants_json())

#         extra_context['all_variants_json'] = self._get_all_variants_json()

#         # Get product's current categories
#         category_ids = list(
#             Product.objects.filter(pk=object_id)
#             .values_list('categories__id', flat=True)
#         )
#         extra_context['variants_json'] = self._get_variants_json_by_categories(category_ids)

#         selected_ids = list(
#             ProductVariantOption.objects
#             .filter(product_id=object_id)
#             .values_list('variant_option_id', flat=True)
#         )
#         extra_context['selected_json'] = json.dumps(selected_ids)
#         return super().change_view(request, object_id, form_url, extra_context)

#     def _get_all_variants_json(self):
#         grouped = {}
#         for variant in Variant.objects.prefetch_related('options').order_by('order'):
#             print("variant===>",variant)
#             options = [{'id': opt.id, 'value': opt.value} for opt in variant.options.all()]
#             if not options:
#                 continue
#             # key: category id or "null" for global variants
#             key = str(variant.category_id) if variant.category_id else 'null'
#             if key not in grouped:
#                 grouped[key] = []
#             grouped[key].append({
#                 'id': variant.id,
#                 'name': variant.name,
#                 'options': options
#             })
        
#         return json.dumps(grouped)

#     # Variants filtered by given category ids (for change_view preload)
#     def _get_variants_json_by_categories(self, category_ids):
#         variants_data = []
#         qs = Variant.objects.prefetch_related('options').order_by('order')

#         print("category_ids===>",category_ids)
#         print("qs===>",qs)

#         if category_ids:
#             qs = qs.filter(category_id__in=category_ids)
#         else:
#             qs = qs.none()
#         for variant in qs:
#             options = [{'id': opt.id, 'value': opt.value} for opt in variant.options.all()]
#             if options:
#                 variants_data.append({
#                     'id': variant.id,
#                     'name': variant.name,
#                     'options': options
#                 })
#         return json.dumps(variants_data)

#     class Media:
#         js = ('admin/js/variant_sku_generator.js',)

#     def save_model(self, request, obj, form, change):
#         if not change:
#             obj.created_by = request.user
#         obj.updated_by = request.user
#         super().save_model(request, obj, form, change)

#     @transaction.atomic
#     def save_related(self, request, form, formsets, change):
#         super().save_related(request, form, formsets, change)
#         obj = form.instance

#         selected_ids_raw     = request.POST.get('selected_variant_options', '')
#         sku_combinations_raw = request.POST.get('sku_combinations', '')

#         if not selected_ids_raw:
#             return

#         selected_ids = [int(i) for i in selected_ids_raw.split(',') if i.strip().isdigit()]

#         ProductVariantOption.objects.filter(product=obj).exclude(
#             variant_option_id__in=selected_ids
#         ).delete()

#         existing_ids = set(
#             ProductVariantOption.objects
#             .filter(product=obj)
#             .values_list('variant_option_id', flat=True)
#         )
#         ProductVariantOption.objects.bulk_create([
#             ProductVariantOption(product=obj, variant_option_id=vid)
#             for vid in selected_ids if vid not in existing_ids
#         ])

#         if sku_combinations_raw:
#             try:
#                 combinations = json.loads(sku_combinations_raw)
#             except (json.JSONDecodeError, ValueError):
#                 combinations = []

#             existing_sku_codes = set(
#                 ProductSKU.objects.filter(product=obj).values_list('sku_code', flat=True)
#             )

#             print("combinations",combinations,"sku_combinations_raw",sku_combinations_raw)

#             for combo in combinations:
#                 sku_code   = combo.get('sku_code', '')
#                 option_ids = combo.get('option_ids', [])
#                 if not sku_code or sku_code in existing_sku_codes:
#                     continue
#                 sku = ProductSKU.objects.create(
#                     product=obj,
#                     sku_code=sku_code,
#                     price=combo.get('price', 0.00),
#                     stock=combo.get('stock', 0),
#                 )
#                 for opt_id in option_ids:
#                     ProductSKUOption.objects.create(sku=sku, variant_option_id=opt_id)

#     @admin.display(description='Categories')
#     def get_categories(self, obj):
#         return ', '.join(obj.categories.values_list('name', flat=True)) or '—'

#     def get_queryset(self, request):
#         return super().get_queryset(request).prefetch_related('categories')


# @admin.register(ProductImage)
# class ProductImageAdmin(admin.ModelAdmin):
#     list_display  = ['product', 'image', 'is_primary', 'sort_order', 'created_at']
#     list_filter   = ['is_primary', 'created_at']
#     search_fields = ['product__name', 'alt_text']


# @admin.register(ProductSKU)
# class ProductSKUAdmin(admin.ModelAdmin):
#     list_display    = ['product', 'sku_code', 'price', 'stock', 'is_active', 'created_at']
#     list_filter     = ['is_active', 'created_at']
#     search_fields   = ['sku_code', 'product__name']
#     list_editable   = ['price', 'stock', 'is_active']
#     readonly_fields = ['sku_code', 'created_at']

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('product')
import json
from django.contrib import admin
from django.db import transaction
from django.utils.safestring import mark_safe




class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'is_primary', 'sort_order']


class ProductSKUInline(admin.TabularInline):
    model = ProductSKU
    extra = 0
    fields = ['sku_code', 'price', 'stock', 'is_active']
    readonly_fields = ['sku_code']
    can_delete = True

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display        = ['name', 'sku', 'get_categories', 'price', 'stock_quantity', 'is_active', 'is_featured', 'created_at']
    list_filter         = ['is_active', 'is_featured', 'categories', 'created_at']
    search_fields       = ['name', 'sku', 'description']
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal   = ('categories',)
    inlines             = [ProductImageInline, ProductSKUInline]
    change_form_template = 'admin/product/product/change_form.html'

    readonly_fields = [
        'variant_selector',
        'created_by', 'updated_by', 'created_at', 'updated_at', 'views_count'
    ]

    fieldsets = (
        ('Basic Info', {'fields': ('name', 'slug', 'sku')}),
        ('Categories', {'fields': ('categories',)}),
        ('Description', {'fields': ('short_description', 'description')}),
        ('Pricing', {'fields': ('price', 'compare_price', 'cost_price')}),
        ('Inventory', {'fields': ('stock_quantity', 'low_stock_threshold')}),
        ('Variants & SKU Generator', {
            'fields': ('variant_selector',),
            'description': 'Select variant options to auto-generate SKU combinations.'
        }),
        ('Dimensions', {'fields': ('weight', 'length', 'width', 'height'), 'classes': ('collapse',)}),
        ('SEO', {'fields': ('meta_title', 'meta_description'), 'classes': ('collapse',)}),
        ('Status', {'fields': ('is_active', 'is_featured')}),
        ('Metadata', {
            'fields': ('views_count', 'created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def variant_selector(self, obj):
        selected_ids = []
        if obj and obj.pk:
            selected_ids = list(
                ProductVariantOption.objects
                .filter(product=obj)
                .values_list('variant_option_id', flat=True)
            )
        selected_str = ','.join(str(i) for i in selected_ids)

        return mark_safe(f"""
        <div id="variant-sku-section" style="width:100%;">
            <input type="hidden" name="selected_variant_options"
                   id="selected_variant_options" value="{selected_str}">
            <input type="hidden" name="sku_combinations"
                   id="sku_combinations" value="">
            <div id="variant-checkboxes">
                <p style="color:#999; font-size:13px;">
                    Please select a category above to load variants.
                </p>
            </div>
            <div id="sku-preview-section" style="margin-top:20px; display:none;">
                <h3 style="font-size:14px; margin-bottom:8px; color:#333;">📦 SKU Combinations</h3>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                        <tr style="background:#f0f0f0;">
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">SKU Code</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Price</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Stock</th>
                        </tr>
                    </thead>
                    <tbody id="sku-preview-body"></tbody>
                </table>
            </div>
        </div>
        """)

    variant_selector.short_description = 'Variant Options'

    # ─────────────────────────────────────────────────────────
    # add_view: no product yet → pass ALL variants grouped by
    # category so JS can filter client-side when user picks a category
    # ─────────────────────────────────────────────────────────
    def add_view(self, request, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['all_variants_json'] = self._get_all_variants_json()
        extra_context['variants_json']     = '[]'   # none selected yet
        extra_context['selected_json']     = '[]'
        return super().add_view(request, form_url, extra_context)

    # change_view: product exists → filter by its categories
    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['all_variants_json'] = self._get_all_variants_json()

        # Get product's current categories
        category_ids = list(
            Product.objects.filter(pk=object_id)
            .values_list('categories__id', flat=True)
        )
        extra_context['variants_json'] = self._get_variants_json_by_categories(category_ids)

        selected_ids = list(
            ProductVariantOption.objects
            .filter(product_id=object_id)
            .values_list('variant_option_id', flat=True)
        )
        extra_context['selected_json'] = json.dumps(selected_ids)
        return super().change_view(request, object_id, form_url, extra_context)

    # All variants grouped by category_id → for JS filtering
    def _get_all_variants_json(self):
        grouped = {}
        for variant in Variant.objects.prefetch_related('options').order_by('order'):
            options = [{'id': opt.id, 'value': opt.value} for opt in variant.options.all()]
            if not options:
                continue
            # key: category id or "null" for global variants
            key = str(variant.category_id) if variant.category_id else 'null'
            if key not in grouped:
                grouped[key] = []
            grouped[key].append({
                'id': variant.id,
                'name': variant.name,
                'options': options
            })
        return json.dumps(grouped)

    # Variants filtered by given category ids (for change_view preload)
    def _get_variants_json_by_categories(self, category_ids):
        variants_data = []
        qs = Variant.objects.prefetch_related('options').order_by('order')
        if category_ids:
            qs = qs.filter(category_id__in=category_ids)
        else:
            qs = qs.none()
        for variant in qs:
            options = [{'id': opt.id, 'value': opt.value} for opt in variant.options.all()]
            if options:
                variants_data.append({
                    'id': variant.id,
                    'name': variant.name,
                    'options': options
                })
        return json.dumps(variants_data)

    class Media:
        js = ('admin/js/variant_sku_generator.js',)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
        # Helper: wipe all variant data for a product 
    
    def _delete_all_variant_data(self, obj):
        sku_ids = list(
            ProductSKU.objects.filter(product=obj).values_list('id', flat=True)
        )
        if sku_ids:
            ProductSKUOption.objects.filter(sku_id__in=sku_ids).delete()
            ProductSKU.objects.filter(id__in=sku_ids).delete()
        ProductVariantOption.objects.filter(product=obj).delete()

    @transaction.atomic
    def save_related(self, request, form, formsets, change):
        # Capture old categories BEFORE super() saves new ones
        old_category_ids = set()
        if change and form.instance.pk:
            old_category_ids = set(
                form.instance.categories.values_list('id', flat=True)
            )

        super().save_related(request, form, formsets, change)
        obj = form.instance

        # If categories changed → wipe all variant data and stop
        new_category_ids = set(obj.categories.values_list('id', flat=True))
        if old_category_ids != new_category_ids:
            self._delete_all_variant_data(obj)
            return


        selected_ids_raw     = request.POST.get('selected_variant_options', '')
        sku_combinations_raw = request.POST.get('sku_combinations', '')

        # Don't return early — even empty means "delete all"
        # Only skip if the hidden input wasn't submitted at all (not in POST)
        if 'selected_variant_options' not in request.POST:
            return

        selected_ids = [int(i) for i in selected_ids_raw.split(',') if i.strip().isdigit()]

        #  Step 1: Delete ALL existing rows for this product 
        # Delete in order: SKUOption → SKU → VariantOption
        sku_ids = list(ProductSKU.objects.filter(product=obj).values_list('id', flat=True))
        if sku_ids:
            ProductSKUOption.objects.filter(sku_id__in=sku_ids).delete()
            ProductSKU.objects.filter(id__in=sku_ids).delete()
        ProductVariantOption.objects.filter(product=obj).delete()

        # Step 2: Recreate ProductVariantOptions 
        ProductVariantOption.objects.bulk_create([
            ProductVariantOption(product=obj, variant_option_id=vid)
            for vid in selected_ids
        ])

        # Step 3: Recreate SKUs from combinations 
        try:
            combinations = json.loads(sku_combinations_raw) if sku_combinations_raw else []
        except (json.JSONDecodeError, ValueError):
            combinations = []

        for combo in combinations:
            sku_code   = combo.get('sku_code', '')
            option_ids = combo.get('option_ids', [])
            if not sku_code:
                continue
            sku = ProductSKU.objects.create(
                product=obj,
                sku_code=sku_code,
                price=combo.get('price', 0.00),
                stock=combo.get('stock', 0),
            )
            for opt_id in option_ids:
                ProductSKUOption.objects.create(sku=sku, variant_option_id=opt_id)

    @admin.display(description='Categories')
    def get_categories(self, obj):
        return ', '.join(obj.categories.values_list('name', flat=True)) or '—'

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('categories')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display  = ['product', 'image', 'is_primary', 'sort_order', 'created_at']
    list_filter   = ['is_primary', 'created_at']
    search_fields = ['product__name', 'alt_text']


@admin.register(ProductSKU)
class ProductSKUAdmin(admin.ModelAdmin):
    list_display    = ['product', 'sku_code', 'price', 'stock', 'is_active', 'created_at']
    list_filter     = ['is_active', 'created_at']
    search_fields   = ['sku_code', 'product__name']
    list_editable   = ['price', 'stock', 'is_active']
    readonly_fields = ['sku_code', 'created_at']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product')
    













# class ProductImageInline(admin.TabularInline):
#     model = ProductImage
#     extra = 1
#     fields = ['image', 'alt_text', 'is_primary', 'sort_order']


# @admin.register(Product)
# class ProductAdmin(admin.ModelAdmin):
#     list_display  = ['name', 'sku', 'get_categories', 'price', 'stock_quantity', 'is_active', 'is_featured', 'created_at']
#     list_filter   = ['is_active', 'is_featured', 'categories', 'created_at']
#     search_fields = ['name', 'sku', 'description']
#     prepopulated_fields = {'slug': ('name',)}
#     readonly_fields = ['created_by', 'updated_by', 'created_at', 'updated_at', 'views_count']

#     inlines = [ProductImageInline]

#     fieldsets = (
#         ('Basic Info', {
#             'fields': ('name', 'slug', 'sku')
#         }),
#         ('Categories', {
#             'fields': ('categories',),                        
#         }),
#         ('Description', {
#             'fields': ('short_description', 'description')
#         }),
#         ('Pricing', {
#             'fields': ('price', 'compare_price', 'cost_price')
#         }),
#         ('Inventory', {
#             'fields': ('stock_quantity', 'low_stock_threshold')
#         }),
#         ('Dimensions', {
#             'fields': ('weight', 'length', 'width', 'height'),
#             'classes': ('collapse',)
#         }),
#         ('SEO', {
#             'fields': ('meta_title', 'meta_description'),
#             'classes': ('collapse',)
#         }),
#         ('Status', {
#             'fields': ('is_active', 'is_featured')
#         }),
#         ('Metadata', {
#             'fields': ('views_count', 'created_by', 'updated_by', 'created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )

#     # Renders categories as comma-separated in list view
#     @admin.display(description='Categories')
#     def get_categories(self, obj):
#         return ', '.join(obj.categories.values_list('name', flat=True)) or '—'

    
#     filter_horizontal = ('categories',)

#     def save_model(self, request, obj, form, change):
#         if not change:
#             obj.created_by = request.user
#         obj.updated_by = request.user
#         super().save_model(request, obj, form, change)

#     def get_queryset(self, request):
#         qs = super().get_queryset(request)
#         return qs.prefetch_related('categories')


# @admin.register(ProductImage)
# class ProductImageAdmin(admin.ModelAdmin):
#     list_display = ['product', 'image', 'is_primary', 'sort_order', 'created_at']
#     list_filter  = ['is_primary', 'created_at']
#     search_fields = ['product__name', 'alt_text']



# import json
# from django.contrib import admin
# from django.db import transaction
# from django.utils.safestring import mark_safe




# class ProductImageInline(admin.TabularInline):
#     model = ProductImage
#     extra = 1
#     fields = ['image', 'alt_text', 'is_primary', 'sort_order']


# class ProductSKUInline(admin.TabularInline):
#     model = ProductSKU
#     extra = 0
#     fields = ['sku_code', 'price', 'stock', 'is_active']
#     readonly_fields = ['sku_code']
#     can_delete = True

#     def has_add_permission(self, request, obj=None):
#         return False


# @admin.register(Product)
# class ProductAdmin(admin.ModelAdmin):

#     list_display        = ['name', 'sku', 'get_categories', 'price', 'stock_quantity', 'is_active', 'is_featured', 'created_at']
#     list_filter         = ['is_active', 'is_featured', 'categories', 'created_at']
#     search_fields       = ['name', 'sku', 'description']
#     prepopulated_fields = {'slug': ('name',)}
#     filter_horizontal   = ('categories',)
#     inlines             = [ProductImageInline, ProductSKUInline]
#     change_form_template = 'admin/product/product/change_form.html'

#     readonly_fields = [
#         'variant_selector',
#         'created_by', 'updated_by', 'created_at', 'updated_at', 'views_count'
#     ]

#     fieldsets = (
#         ('Basic Info', {'fields': ('name', 'slug', 'sku')}),
#         ('Categories', {'fields': ('categories',)}),
#         ('Description', {'fields': ('short_description', 'description')}),
#         ('Pricing', {'fields': ('price', 'compare_price', 'cost_price')}),
#         ('Inventory', {'fields': ('stock_quantity', 'low_stock_threshold')}),
#         ('🧩 Variants & SKU Generator', {
#             'fields': ('variant_selector',),
#             'description': 'Select variant options to auto-generate SKU combinations.'
#         }),
#         ('Dimensions', {'fields': ('weight', 'length', 'width', 'height'), 'classes': ('collapse',)}),
#         ('SEO', {'fields': ('meta_title', 'meta_description'), 'classes': ('collapse',)}),
#         ('Status', {'fields': ('is_active', 'is_featured')}),
#         ('Metadata', {
#             'fields': ('views_count', 'created_by', 'updated_by', 'created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )

#     def variant_selector(self, obj):
#         selected_ids = []
#         if obj and obj.pk:
#             selected_ids = list(
#                 ProductVariantOption.objects
#                 .filter(product=obj)
#                 .values_list('variant_option_id', flat=True)
#             )
#         selected_str = ','.join(str(i) for i in selected_ids)

#         return mark_safe(f"""
#         <div id="variant-sku-section" style="width:100%;">
#             <input type="hidden" name="selected_variant_options"
#                    id="selected_variant_options" value="{selected_str}">
#             <input type="hidden" name="sku_combinations" id="sku_combinations" value="">
#             <div id="variant-checkboxes">
#                 <p style="color:#999; font-size:13px;">
#                     Please select a category above to load variants.
#                 </p>
#             </div>
#             <div id="sku-preview-section" style="margin-top:20px; display:none;">
#                 <h3 style="font-size:14px; margin-bottom:8px; color:#333;">📦 SKU Combinations</h3>
#                 <table style="width:100%; border-collapse:collapse; font-size:13px;">
#                     <thead>
#                         <tr style="background:#f0f0f0;">
#                             <th style="padding:8px; border:1px solid #ddd; text-align:left;">SKU Code</th>
#                             <th style="padding:8px; border:1px solid #ddd; text-align:left;">Price</th>
#                             <th style="padding:8px; border:1px solid #ddd; text-align:left;">Stock</th>
#                         </tr>
#                     </thead>
#                     <tbody id="sku-preview-body"></tbody>
#                 </table>
#             </div>
#         </div>
#         """)

#     variant_selector.short_description = 'Variant Options'

#     # ─────────────────────────────────────────────────────────
#     # add_view: no product yet → pass ALL variants grouped by
#     # category so JS can filter client-side when user picks a category
#     # ─────────────────────────────────────────────────────────
#     def add_view(self, request, form_url='', extra_context=None):
#         extra_context = extra_context or {}
#         print("_get_all_variants_json-1",self._get_all_variants_json())
#         extra_context['all_variants_json'] = self._get_all_variants_json()
#         extra_context['variants_json']     = '[]'   # none selected yet
#         extra_context['selected_json']     = '[]'
#         return super().add_view(request, form_url, extra_context)

#     # ─────────────────────────────────────────────────────────
#     # change_view: product exists → filter by its categories
#     # ─────────────────────────────────────────────────────────
#     def change_view(self, request, object_id, form_url='', extra_context=None):
#         extra_context = extra_context or {}
#         print("_get_all_variants_json-2",self._get_all_variants_json())

#         extra_context['all_variants_json'] = self._get_all_variants_json()

#         # Get product's current categories
#         category_ids = list(
#             Product.objects.filter(pk=object_id)
#             .values_list('categories__id', flat=True)
#         )
#         extra_context['variants_json'] = self._get_variants_json_by_categories(category_ids)

#         selected_ids = list(
#             ProductVariantOption.objects
#             .filter(product_id=object_id)
#             .values_list('variant_option_id', flat=True)
#         )
#         extra_context['selected_json'] = json.dumps(selected_ids)
#         return super().change_view(request, object_id, form_url, extra_context)

#     # ─────────────────────────────────────────────────────────
#     # All variants grouped by category_id → for JS filtering
#     # { category_id: [ {id, name, options}, ... ] }
#     # ─────────────────────────────────────────────────────────
#     def _get_all_variants_json(self):
#         grouped = {}
#         for variant in Variant.objects.prefetch_related('options').order_by('order'):
#             print("variant===>",variant)
#             options = [{'id': opt.id, 'value': opt.value} for opt in variant.options.all()]
#             if not options:
#                 continue
#             # key: category id or "null" for global variants
#             key = str(variant.category_id) if variant.category_id else 'null'
#             if key not in grouped:
#                 grouped[key] = []
#             grouped[key].append({
#                 'id': variant.id,
#                 'name': variant.name,
#                 'options': options
#             })
        
#         return json.dumps(grouped)

#     # Variants filtered by given category ids (for change_view preload)
#     def _get_variants_json_by_categories(self, category_ids):
#         variants_data = []
#         qs = Variant.objects.prefetch_related('options').order_by('order')

#         print("category_ids===>",category_ids)
#         print("qs===>",qs)

#         if category_ids:
#             qs = qs.filter(category_id__in=category_ids)
#         else:
#             qs = qs.none()
#         for variant in qs:
#             options = [{'id': opt.id, 'value': opt.value} for opt in variant.options.all()]
#             if options:
#                 variants_data.append({
#                     'id': variant.id,
#                     'name': variant.name,
#                     'options': options
#                 })
#         return json.dumps(variants_data)

#     class Media:
#         js = ('admin/js/variant_sku_generator.js',)

#     def save_model(self, request, obj, form, change):
#         if not change:
#             obj.created_by = request.user
#         obj.updated_by = request.user
#         super().save_model(request, obj, form, change)

#     @transaction.atomic
#     def save_related(self, request, form, formsets, change):
#         super().save_related(request, form, formsets, change)
#         obj = form.instance

#         selected_ids_raw     = request.POST.get('selected_variant_options', '')
#         sku_combinations_raw = request.POST.get('sku_combinations', '')

#         if not selected_ids_raw:
#             return

#         selected_ids = [int(i) for i in selected_ids_raw.split(',') if i.strip().isdigit()]

#         ProductVariantOption.objects.filter(product=obj).exclude(
#             variant_option_id__in=selected_ids
#         ).delete()

#         existing_ids = set(
#             ProductVariantOption.objects
#             .filter(product=obj)
#             .values_list('variant_option_id', flat=True)
#         )
#         ProductVariantOption.objects.bulk_create([
#             ProductVariantOption(product=obj, variant_option_id=vid)
#             for vid in selected_ids if vid not in existing_ids
#         ])

#         if sku_combinations_raw:
#             try:
#                 combinations = json.loads(sku_combinations_raw)
#             except (json.JSONDecodeError, ValueError):
#                 combinations = []

#             existing_sku_codes = set(
#                 ProductSKU.objects.filter(product=obj).values_list('sku_code', flat=True)
#             )

#             print("combinations",combinations,"sku_combinations_raw",sku_combinations_raw)

#             for combo in combinations:
#                 sku_code   = combo.get('sku_code', '')
#                 option_ids = combo.get('option_ids', [])
#                 if not sku_code or sku_code in existing_sku_codes:
#                     continue
#                 sku = ProductSKU.objects.create(
#                     product=obj,
#                     sku_code=sku_code,
#                     price=combo.get('price', 0.00),
#                     stock=combo.get('stock', 0),
#                 )
#                 for opt_id in option_ids:
#                     ProductSKUOption.objects.create(sku=sku, variant_option_id=opt_id)

#     @admin.display(description='Categories')
#     def get_categories(self, obj):
#         return ', '.join(obj.categories.values_list('name', flat=True)) or '—'

#     def get_queryset(self, request):
#         return super().get_queryset(request).prefetch_related('categories')


# @admin.register(ProductImage)
# class ProductImageAdmin(admin.ModelAdmin):
#     list_display  = ['product', 'image', 'is_primary', 'sort_order', 'created_at']
#     list_filter   = ['is_primary', 'created_at']
#     search_fields = ['product__name', 'alt_text']


# @admin.register(ProductSKU)
# class ProductSKUAdmin(admin.ModelAdmin):
#     list_display    = ['product', 'sku_code', 'price', 'stock', 'is_active', 'created_at']
#     list_filter     = ['is_active', 'created_at']
#     search_fields   = ['sku_code', 'product__name']
#     list_editable   = ['price', 'stock', 'is_active']
#     readonly_fields = ['sku_code', 'created_at']

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('product')

# ----------------------------------------------- 2- option

# import json
# from django.contrib import admin
# from django.db import transaction
# from django.utils.safestring import mark_safe




# class ProductImageInline(admin.TabularInline):
#     model = ProductImage
#     extra = 1
#     fields = ['image', 'alt_text', 'is_primary', 'sort_order']


# class ProductSKUInline(admin.TabularInline):
#     model = ProductSKU
#     extra = 0
#     fields = ['sku_code', 'price', 'stock', 'is_active']
#     readonly_fields = ['sku_code']
#     can_delete = True

#     def has_add_permission(self, request, obj=None):
#         return False


# @admin.register(Product)
# class ProductAdmin(admin.ModelAdmin):

#     list_display        = ['name', 'sku', 'get_categories', 'price', 'stock_quantity', 'is_active', 'is_featured', 'created_at']
#     list_filter         = ['is_active', 'is_featured', 'categories', 'created_at']
#     search_fields       = ['name', 'sku', 'description']
#     prepopulated_fields = {'slug': ('name',)}
#     filter_horizontal   = ('categories',)
#     inlines             = [ProductImageInline, ProductSKUInline]
#     change_form_template = 'admin/product/product/change_form.html'

#     readonly_fields = [
#         'variant_selector',
#         'created_by', 'updated_by', 'created_at', 'updated_at', 'views_count'
#     ]

#     fieldsets = (
#         ('Basic Info', {'fields': ('name', 'slug', 'sku')}),
#         ('Categories', {'fields': ('categories',)}),
#         ('Description', {'fields': ('short_description', 'description')}),
#         ('Pricing', {'fields': ('price', 'compare_price', 'cost_price')}),
#         ('Inventory', {'fields': ('stock_quantity', 'low_stock_threshold')}),
#         ('🧩 Variants & SKU Generator', {
#             'fields': ('variant_selector',),
#             'description': 'Select variant options to auto-generate SKU combinations.'
#         }),
#         ('Dimensions', {'fields': ('weight', 'length', 'width', 'height'), 'classes': ('collapse',)}),
#         ('SEO', {'fields': ('meta_title', 'meta_description'), 'classes': ('collapse',)}),
#         ('Status', {'fields': ('is_active', 'is_featured')}),
#         ('Metadata', {
#             'fields': ('views_count', 'created_by', 'updated_by', 'created_at', 'updated_at'),
#             'classes': ('collapse',)
#         }),
#     )

#     def variant_selector(self, obj):
#         selected_ids = []
#         if obj and obj.pk:
#             selected_ids = list(
#                 ProductVariantOption.objects
#                 .filter(product=obj)
#                 .values_list('variant_option_id', flat=True)
#             )
#         selected_str = ','.join(str(i) for i in selected_ids)

#         return mark_safe(f"""
#         <div id="variant-sku-section" style="width:100%;">
#             <input type="hidden" name="selected_variant_options"
#                    id="selected_variant_options" value="{selected_str}">
#             <input type="hidden" name="sku_combinations"
#                    id="sku_combinations" value="">
#             <div id="variant-checkboxes">
#                 <p style="color:#999; font-size:13px;">
#                     Please select a category above to load variants.
#                 </p>
#             </div>
#             <div id="sku-preview-section" style="margin-top:20px; display:none;">
#                 <h3 style="font-size:14px; margin-bottom:8px; color:#333;">📦 SKU Combinations</h3>
#                 <table style="width:100%; border-collapse:collapse; font-size:13px;">
#                     <thead>
#                         <tr style="background:#f0f0f0;">
#                             <th style="padding:8px; border:1px solid #ddd; text-align:left;">SKU Code</th>
#                             <th style="padding:8px; border:1px solid #ddd; text-align:left;">Price</th>
#                             <th style="padding:8px; border:1px solid #ddd; text-align:left;">Stock</th>
#                         </tr>
#                     </thead>
#                     <tbody id="sku-preview-body"></tbody>
#                 </table>
#             </div>
#         </div>
#         """)

#     variant_selector.short_description = 'Variant Options'

#     # ─────────────────────────────────────────────────────────
#     # add_view: no product yet → pass ALL variants grouped by
#     # category so JS can filter client-side when user picks a category
#     # ─────────────────────────────────────────────────────────
#     def add_view(self, request, form_url='', extra_context=None):
#         extra_context = extra_context or {}
#         extra_context['all_variants_json'] = self._get_all_variants_json()
#         extra_context['variants_json']     = '[]'   # none selected yet
#         extra_context['selected_json']     = '[]'
#         return super().add_view(request, form_url, extra_context)

#     # ─────────────────────────────────────────────────────────
#     # change_view: product exists → filter by its categories
#     # ─────────────────────────────────────────────────────────
#     def change_view(self, request, object_id, form_url='', extra_context=None):
#         extra_context = extra_context or {}
#         extra_context['all_variants_json'] = self._get_all_variants_json()

#         # Get product's current categories
#         category_ids = list(
#             Product.objects.filter(pk=object_id)
#             .values_list('categories__id', flat=True)
#         )
#         extra_context['variants_json'] = self._get_variants_json_by_categories(category_ids)

#         selected_ids = list(
#             ProductVariantOption.objects
#             .filter(product_id=object_id)
#             .values_list('variant_option_id', flat=True)
#         )
#         extra_context['selected_json'] = json.dumps(selected_ids)
#         return super().change_view(request, object_id, form_url, extra_context)

#     # ─────────────────────────────────────────────────────────
#     # All variants grouped by category_id → for JS filtering
#     # { category_id: [ {id, name, options}, ... ] }
#     # ─────────────────────────────────────────────────────────
#     def _get_all_variants_json(self):
#         grouped = {}
#         for variant in Variant.objects.prefetch_related('options').order_by('order'):
#             options = [{'id': opt.id, 'value': opt.value} for opt in variant.options.all()]
#             if not options:
#                 continue
#             # key: category id or "null" for global variants
#             key = str(variant.category_id) if variant.category_id else 'null'
#             if key not in grouped:
#                 grouped[key] = []
#             grouped[key].append({
#                 'id': variant.id,
#                 'name': variant.name,
#                 'options': options
#             })
#         return json.dumps(grouped)

#     # Variants filtered by given category ids (for change_view preload)
#     def _get_variants_json_by_categories(self, category_ids):
#         variants_data = []
#         qs = Variant.objects.prefetch_related('options').order_by('order')
#         if category_ids:
#             qs = qs.filter(category_id__in=category_ids)
#         else:
#             qs = qs.none()
#         for variant in qs:
#             options = [{'id': opt.id, 'value': opt.value} for opt in variant.options.all()]
#             if options:
#                 variants_data.append({
#                     'id': variant.id,
#                     'name': variant.name,
#                     'options': options
#                 })
#         return json.dumps(variants_data)

#     class Media:
#         js = ('admin/js/variant_sku_generator.js',)

#     def save_model(self, request, obj, form, change):
#         if not change:
#             obj.created_by = request.user
#         obj.updated_by = request.user
#         super().save_model(request, obj, form, change)

#     @transaction.atomic
#     def save_related(self, request, form, formsets, change):
#         super().save_related(request, form, formsets, change)
#         obj = form.instance

#         selected_ids_raw     = request.POST.get('selected_variant_options', '')
#         sku_combinations_raw = request.POST.get('sku_combinations', '')

#         # ✅ Don't return early — even empty means "delete all"
#         # Only skip if the hidden input wasn't submitted at all (not in POST)
#         if 'selected_variant_options' not in request.POST:
#             return

#         selected_ids = [int(i) for i in selected_ids_raw.split(',') if i.strip().isdigit()]

#         # ── Step 1: Delete ALL existing rows for this product ─
#         # Delete in order: SKUOption → SKU → VariantOption
#         sku_ids = list(ProductSKU.objects.filter(product=obj).values_list('id', flat=True))
#         if sku_ids:
#             ProductSKUOption.objects.filter(sku_id__in=sku_ids).delete()
#             ProductSKU.objects.filter(id__in=sku_ids).delete()
#         ProductVariantOption.objects.filter(product=obj).delete()

#         # ── Step 2: Recreate ProductVariantOptions ────────────
#         ProductVariantOption.objects.bulk_create([
#             ProductVariantOption(product=obj, variant_option_id=vid)
#             for vid in selected_ids
#         ])

#         # ── Step 3: Recreate SKUs from combinations ───────────
#         try:
#             combinations = json.loads(sku_combinations_raw) if sku_combinations_raw else []
#         except (json.JSONDecodeError, ValueError):
#             combinations = []

#         for combo in combinations:
#             sku_code   = combo.get('sku_code', '')
#             option_ids = combo.get('option_ids', [])
#             if not sku_code:
#                 continue
#             sku = ProductSKU.objects.create(
#                 product=obj,
#                 sku_code=sku_code,
#                 price=combo.get('price', 0.00),
#                 stock=combo.get('stock', 0),
#             )
#             for opt_id in option_ids:
#                 ProductSKUOption.objects.create(sku=sku, variant_option_id=opt_id)

#     @admin.display(description='Categories')
#     def get_categories(self, obj):
#         return ', '.join(obj.categories.values_list('name', flat=True)) or '—'

#     def get_queryset(self, request):
#         return super().get_queryset(request).prefetch_related('categories')


# @admin.register(ProductImage)
# class ProductImageAdmin(admin.ModelAdmin):
#     list_display  = ['product', 'image', 'is_primary', 'sort_order', 'created_at']
#     list_filter   = ['is_primary', 'created_at']
#     search_fields = ['product__name', 'alt_text']


# @admin.register(ProductSKU)
# class ProductSKUAdmin(admin.ModelAdmin):
#     list_display    = ['product', 'sku_code', 'price', 'stock', 'is_active', 'created_at']
#     list_filter     = ['is_active', 'created_at']
#     search_fields   = ['sku_code', 'product__name']
#     list_editable   = ['price', 'stock', 'is_active']
#     readonly_fields = ['sku_code', 'created_at']

#     def get_queryset(self, request):
#         return super().get_queryset(request).select_related('product')


# --------------------------------------- Option - 3