

import json
from itertools import product as itertools_product

from django import forms
from django.contrib import admin
from django.db import transaction
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.core.cache import cache


from django.contrib import admin
from .models import Product, ProductImage, ProductDocument, ProductFaQ, Pathogen, ProductPathogen, ProductAssayDetail, ProductRelatedInfo, AssayPanelTargetDocument
from prd_variant.models import ProductSKU,ProductVariantOption,ProductSKUOption
from variant.models import Variant,VariantOption
from category.models import Category

import json
from django.contrib import admin
from django.db import transaction
from django.utils.safestring import mark_safe
from django.contrib.contenttypes.admin import GenericTabularInline
from comment.models import Comment
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType

from comment.mixins import CommentInline, CommentMixin

class CommentInline(GenericTabularInline):
    model = Comment
    extra = 1
    max_num = 1          
    can_delete = False   
    min_num = 1          
    validate_min = True  
    fields = ['description']
    readonly_fields = ['created_at']

    def get_queryset(self, request):
        return Comment.objects.none()


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'is_primary','hover', 'sort_order']


class ProductFaqInline(admin.TabularInline):
    model = ProductFaQ
    extra = 1
    fields = ['question', 'answer', 'sort_order','is_active']


class ProductSKUInline(admin.TabularInline):
    model = ProductSKU
    extra = 0
    fields = ['sku_code', 'price', 'stock','low_stock_threshold','weight', 'length', 'width', 'height', 'is_active']
    readonly_fields = []
    can_delete = True

    def has_add_permission(self, request, obj=None):
        return False

    def get_readonly_fields(self, request, obj=None):
        if obj and getattr(obj, 'has_variants', False):
            return ['sku_code', 'price', 'stock', 'low_stock_threshold', 'weight', 'length', 'width', 'height']
        return []


class ProductDocumentInline(admin.TabularInline):
    model = ProductDocument
    extra = 0
    fields = ['section', 'title', 'file', 'sku', 'target_search_text', 'sort_order', 'is_active']
    autocomplete_fields = ['sku']

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'sku':
            object_id = request.resolver_match.kwargs.get('object_id') if request.resolver_match else None
            if object_id:
                kwargs['queryset'] = ProductSKU.objects.filter(product_id=object_id).order_by('sku_code')
            else:
                kwargs['queryset'] = ProductSKU.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


class ProductPathogenInline(admin.TabularInline):
    model = ProductPathogen
    extra = 3
    autocomplete_fields = ['pathogen']
    fields = ['pathogen', 'sort_order']


class ProductAssayDetailInline(admin.StackedInline):
    model = ProductAssayDetail
    extra = 0
    max_num = 1
    fields = ['assay_type', 'reaction_format', 'panel_name', 'catalog_number', 'target_count', 'is_active']


class ProductRelatedInfoInline(admin.TabularInline):
    model = ProductRelatedInfo
    extra = 3
    fields = ['title', 'content', 'sort_order', 'is_active']


class ProductAdminForm(forms.ModelForm):
    trademark_display  = forms.BooleanField(required=False, label="Show trademark")
    trademark_position = forms.ChoiceField(
        choices=[('pre', 'Pre (before name)'), ('post', 'Post (after name)')],
        label="Position",
    )
    trademark_text     = forms.CharField(max_length=50, required=False, label="Text (e.g. BPX)")
    trademark_symbol   = forms.ChoiceField(
        choices=[('TM', 'TM'), ('R', '®'), ('SM', '℠')],
        label="Symbol",
    )

    class Meta:
        model   = Product
        exclude = ['trademark']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tm = {}
        if self.instance and self.instance.pk:
            tm = self.instance.trademark or {}
        self.fields['trademark_display'].initial  = tm.get('display', False)
        self.fields['trademark_position'].initial = tm.get('postion', 'post')
        self.fields['trademark_text'].initial     = tm.get('text', 'BPX')
        self.fields['trademark_symbol'].initial   = tm.get('trademark', 'TM')

    def save(self, commit=True):
        self.instance.trademark = {
            'display':   self.cleaned_data.get('trademark_display', False),
            'postion':   self.cleaned_data.get('trademark_position', 'post'),
            'text':      self.cleaned_data.get('trademark_text', 'BPX'),
            'trademark': self.cleaned_data.get('trademark_symbol', 'TM'),
        }
        return super().save(commit=commit)


@admin.register(Product)
class ProductAdmin(CommentMixin,admin.ModelAdmin):
    form = ProductAdminForm

    list_display        = ['name', 'sku', 'get_categories', 'price', 'stock_quantity', 'is_active','is_customizable', 'is_featured', 'created_at']
    list_filter         = ['is_active', 'is_featured', 'categories', 'created_at']
    search_fields       = ['name', 'sku', 'description']
    prepopulated_fields = {'slug': ('name',)}
    filter_horizontal   = ('categories',)
    inlines             = [ProductImageInline, ProductSKUInline, ProductDocumentInline, ProductFaqInline, ProductAssayDetailInline, ProductRelatedInfoInline, CommentInline]
    change_form_template = 'admin/product/product/change_form.html'

    readonly_fields = [
        'variant_selector',
        'created_by', 'updated_by', 'created_at', 'updated_at', 'views_count'
    ]



    # Edit page — price/stock hidden (managed via SKUs)
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'slug', 'sku', 'trademark_display', 'trademark_position', 'trademark_text', 'trademark_symbol')}),
        ('Categories', {'fields': ('categories',)}),
        ('Description', {'fields': ('short_description', 'description')}),
        ('Pricing', {'fields': ('compare_price', 'cost_price')}),
        # ('Inventory', {'fields': ('low_stock_threshold',)}),
        ('Variants & SKU Generator', {
            'fields': ('has_variants','variant_selector',),
            'description': 'Select variant options to auto-generate SKU combinations.'
        }),
        # ('Dimensions', {'fields': ('weight', 'length', 'width', 'height'), 'classes': ('collapse',)}),
        ('SEO', {'fields': ('meta_title', 'meta_description'), 'classes': ('collapse',)}),
        ('Status', {'fields': ('is_active', 'is_featured', 'is_customizable', 'is_shipping_required', 'is_returnable')}),
        ('Metadata', {
            'fields': ('views_count', 'created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    # Create page — price/stock visible
    add_fieldsets = (
        ('Basic Info', {'fields': ('name', 'slug', 'sku', 'trademark_display', 'trademark_position', 'trademark_text', 'trademark_symbol')}),
        ('Categories', {'fields': ('categories',)}),
        ('Description', {'fields': ('short_description', 'description')}),
        ('Pricing', {'fields': ('price', 'compare_price', 'cost_price')}),
        ('Inventory', {'fields': ('stock_quantity', 'low_stock_threshold')}),
        ('Variants & SKU Generator', {
            'fields': ('has_variants','variant_selector',),
            'description': 'Select variant options to auto-generate SKU combinations.'
        }),
        ('Dimensions', {'fields': ('weight', 'length', 'width', 'height'), 'classes': ('collapse',)}),
        ('SEO', {'fields': ('meta_title', 'meta_description'), 'classes': ('collapse',)}),
        ('Status', {'fields': ('is_active', 'is_featured', 'is_customizable', 'is_shipping_required', 'is_returnable')}),
        ('Metadata', {
            'fields': ('created_by', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    
    def variant_selector(self, obj):
        selected_ids = []
        selected_category_ids = []
        if obj and obj.pk:
            selected_ids = list(
                ProductVariantOption.objects
                .filter(product=obj)
                .values_list('variant_option_id', flat=True)
            )
            selected_category_ids = list(
                obj.categories.values_list('id', flat=True)
            )
        selected_str = ','.join(str(i) for i in selected_ids)
        variant_groups_html = self._render_variant_groups_html(selected_ids, selected_category_ids)

        return mark_safe(f"""
        <div id="variant-sku-section" style="width:100%;">
            <input type="hidden" name="selected_variant_options"
                   id="selected_variant_options" value="{selected_str}">
            <input type="hidden" name="sku_combinations"
                   id="sku_combinations" value="">
            <div id="variant-checkboxes">
                {variant_groups_html}
            </div>
            <div id="sku-preview-section" style="margin-top:20px; display:none;">
                <h3 style="font-size:14px; margin-bottom:8px; color:#333;"> SKU Combinations</h3>
                <table style="width:100%; border-collapse:collapse; font-size:13px;">
                    <thead>
                        <tr style="background:#f0f0f0;">
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Combination</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">SKU Code</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Price</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Stock</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Low Stock Threshold</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Weight</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Length</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Width</th>
                            <th style="padding:8px; border:1px solid #ddd; text-align:left;">Height</th>
                        </tr>
                    </thead>
                    <tbody id="sku-preview-body"></tbody>
                </table>
            </div>
        </div>
        """)

    variant_selector.short_description = 'Variant Options'

    def _render_variant_groups_html(self, selected_ids, category_ids=None):
        def _expand_category_ids(ids):
            expanded = set(ids or [])
            if expanded:
                expanded.update(
                    Category.objects.filter(parent_id__in=expanded).values_list('id', flat=True)
                )
            return list(expanded)

        option_rows = (
            VariantOption.objects.select_related('variant')
            .filter(is_active=True, variant__is_active=True)
            .order_by('variant__order', 'order', 'id')
        )
        category_ids = list(category_ids or [])
        if category_ids:
            category_ids = _expand_category_ids(category_ids)
            option_rows = option_rows.filter(variant__category_id__in=category_ids)
        else:
            return '<p style="color:#999; font-size:13px;">Please select a category above to load variants.</p>'

        selected_ids = set(selected_ids or [])
        grouped = {}

        for opt in option_rows:
            variant = opt.variant
            if variant.id not in grouped:
                grouped[variant.id] = {
                    'variant': variant,
                    'options': [],
                }
            grouped[variant.id]['options'].append(opt)

        sections = []

        for group in grouped.values():
            variant = group['variant']
            options = group['options']

            option_html = []
            for opt in options:
                checked = "checked" if opt.id in selected_ids else ""
                option_html.append(f"""
                  <label class="option-chip" style="
                    display:inline-flex; align-items:center; gap:6px;
                    padding:5px 14px; border-radius:20px; cursor:pointer;
                    border:2px solid #ccc; background:#fff;
                    font-size:13px; font-weight:500; user-select:none;
                    transition:all 0.15s ease;">
                    <input type="checkbox"
                      class="variant-option-cb"
                      data-variant-id="{variant.id}"
                      data-option-id="{opt.id}"
                      data-option-value="{opt.value}"
                      {checked}
                      style="display:none;">
                    {opt.value}
                  </label>
                """)

            sections.append(f"""
              <div style="margin-bottom:16px; padding:14px 16px; border:1px solid #e0e0e0; border-radius:6px; background:#fafafa;">
                <div style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
                  <strong style="font-size:13px; color:#333; min-width:120px;">{variant.name}</strong>
                  <label style="font-size:12px; color:#666; cursor:pointer; display:flex; align-items:center; gap:4px;">
                    <input type="checkbox" class="select-all-toggle" data-variant-id="{variant.id}" style="margin:0;">
                    Select All
                  </label>
                </div>
                <div class="options-row" style="display:flex; flex-wrap:wrap; gap:8px;">
                  {''.join(option_html)}
                </div>
              </div>
            """)

        if not sections:
            return '<p style="color:#999; font-size:13px;">No variants found.</p>'

        return ''.join(sections)

    # add_view: no product yet → pass ALL variants grouped by
    # category so JS can filter client-side when user picks a category
    def add_view(self, request, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['all_variants_json']  = self._get_all_variants_json()
        extra_context['variants_json']      = self._get_all_variants_list_json()
        extra_context['category_descendants_json'] = self._get_category_descendants_json()
        extra_context['selected_json']      = '[]'
        extra_context['existing_skus_json'] = '[]'
        return super().add_view(request, form_url, extra_context)

    # 
    # change_view: product exists → filter by its categories
    def change_view(self, request, object_id, form_url='', extra_context=None):
        extra_context = extra_context or {}
        extra_context['all_variants_json'] = self._get_all_variants_json()
        extra_context['category_descendants_json'] = self._get_category_descendants_json()

        # Get product's current categories
        category_ids = list(
            Product.objects.filter(pk=object_id)
            .values_list('categories__id', flat=True)
        )
        extra_context['variants_json'] = self._get_all_variants_list_json()

        selected_ids = list(
            ProductVariantOption.objects
            .filter(product_id=object_id)
            .values_list('variant_option_id', flat=True)
        )
        extra_context['selected_json'] = json.dumps(selected_ids)

        existing_skus = ProductSKU.objects.filter(product_id=object_id).prefetch_related('sku_options')
        existing_skus_data = []
        for sku in existing_skus:
            option_ids = sorted([opt.variant_option_id for opt in sku.sku_options.all()])
            existing_skus_data.append({
                'sku_code': sku.sku_code,
                'option_ids': option_ids,
                'price': str(sku.price),
                'stock': sku.stock,
                'low_stock': sku.low_stock_threshold,
                'weight': str(sku.weight),
                'length': str(sku.length),
                'width': str(sku.width),
                'height': str(sku.height),
            })
        extra_context['existing_skus_json'] = json.dumps(existing_skus_data)

        return super().change_view(request, object_id, form_url, extra_context)

    # All variants grouped by category_id → for JS filtering
    def _get_all_variants_json(self):
        grouped = {}
        option_rows = (
            VariantOption.objects.select_related('variant')
            .filter(is_active=True, variant__is_active=True)
            .order_by('variant__order', 'order', 'id')
        )

        for opt in option_rows:
            variant = opt.variant
            key = str(variant.category_id) if variant.category_id else 'null'
            if key not in grouped:
                grouped[key] = []
            if not grouped[key] or grouped[key][-1]['id'] != variant.id:
                grouped[key].append({
                    'id': variant.id,
                    'name': variant.name,
                    'options': [],
                })
            grouped[key][-1]['options'].append({'id': opt.id, 'value': opt.value})
        return json.dumps(grouped)

    def _get_all_variants_list_json(self):
        variants_data = []
        option_rows = (
            VariantOption.objects.select_related('variant')
            .filter(is_active=True, variant__is_active=True)
            .order_by('variant__order', 'order', 'id')
        )
        for opt in option_rows:
            variant = opt.variant
            if not variants_data or variants_data[-1]['id'] != variant.id:
                variants_data.append({
                    'id': variant.id,
                    'name': variant.name,
                    'options': [],
                })
            variants_data[-1]['options'].append({'id': opt.id, 'value': opt.value})
        return json.dumps(variants_data)

    def _get_category_descendants_json(self):
        categories = list(Category.objects.filter(is_active=True).values('id', 'parent_id'))
        children_by_parent = {}
        for row in categories:
            children_by_parent.setdefault(row['parent_id'], []).append(row['id'])

        def collect_descendants(category_id):
            descendants = []
            stack = list(children_by_parent.get(category_id, []))
            while stack:
                child_id = stack.pop()
                descendants.append(child_id)
                stack.extend(children_by_parent.get(child_id, []))
            return descendants

        descendant_map = {
            str(row['id']): collect_descendants(row['id'])
            for row in categories
        }
        return json.dumps(descendant_map)

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
    

    def get_fieldsets(self, request, obj=None):
        if obj is None:
            return self.add_fieldsets
        return self.fieldsets

    def get_form(self, request, obj=None, **kwargs):
        exclude = list(kwargs.get('exclude') or [])

        if obj is not None:
            exclude += ['price', 'stock_quantity','low_stock_threshold','weight', 'length', 'width', 'height']

        for f in (self.readonly_fields or []):
            if f not in exclude:
                exclude.append(f)

        kwargs['exclude'] = exclude
        return super().get_form(request, obj, **kwargs)
    


    class Media:
        js = ('admin/js/variant_sku_generator.js',)

    # ── Cache helpers ─────────────────────────────────────────────────────────
    _ORDER_PARAMS = ['', 'asc', 'desc', 'popularity', 'rating', 'date', 'menu_order']

    def _clear_product_caches(self, obj):
        """Clear Django cache and trigger Next.js on-demand revalidation."""
        from django.conf import settings
        import urllib.request

        cache.delete(f"product_detail:{obj.slug}")

        cat_slugs = set()
        sub_pairs = []
        try:
            for cat in obj.categories.select_related('parent').filter(is_active=True):
                cat_slugs.add(cat.slug)
                if cat.parent:
                    cat_slugs.add(cat.parent.slug)
                    sub_pairs.append((cat.parent.slug, cat.slug))
                else:
                    sub_pairs.append((cat.slug, cat.slug))
        except Exception:
            pass

        for slug in cat_slugs:
            cache.delete(f"category_products:{slug}")

        keys_to_delete = []
        for parent_slug, sub_slug in sub_pairs:
            for order in self._ORDER_PARAMS:
                for page in range(1, 16):
                    keys_to_delete.append(
                        f"subcategory_products:{parent_slug}:{sub_slug}:{order or 'asc'}:{page}"
                    )
        if keys_to_delete:
            cache.delete_many(keys_to_delete)

        # Ping Next.js to bust its fetch cache immediately
        try:
            nextjs_url = getattr(settings, 'NEXTJS_URL', 'http://localhost:3000')
            secret     = getattr(settings, 'REVALIDATE_SECRET', '')
            first_pair = sub_pairs[0] if sub_pairs else (None, None)
            parent_slug, sub_slug = first_pair
            params = f"secret={secret}&slug={obj.slug}"
            if parent_slug:
                params += f"&category={parent_slug}"
            if sub_slug:
                params += f"&sub_category={sub_slug}"
            url = f"{nextjs_url}/api/revalidate?{params}"
            req = urllib.request.Request(url, method='POST')
            urllib.request.urlopen(req, timeout=3)
        except Exception:
            pass  # Never break admin save if Next.js is unreachable

    # ── Admin overrides ────────────────────────────────────────────────────────
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
        self._clear_product_caches(obj)

    def delete_model(self, request, obj):
        self._clear_product_caches(obj)
        super().delete_model(request, obj)
    
    def _delete_all_variant_data(self, obj):
        sku_ids = list(
            ProductSKU.objects.filter(product=obj).values_list('id', flat=True)
        )
        if sku_ids:
            ProductSKUOption.objects.filter(sku_id__in=sku_ids).delete()
            ProductSKU.objects.filter(id__in=sku_ids).delete()
        ProductVariantOption.objects.filter(product=obj).delete()

     # Wipe all variant data 
    def _delete_all_variant_data(self, obj):
        sku_ids = list(ProductSKU.objects.filter(product=obj).values_list('id', flat=True))
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
        
        old_has_variant = form.instance.has_variants

        super().save_related(request, form, formsets, change)
        obj = form.instance

        # Clear all caches after inlines (SKUs, images, etc.) are saved
        self._clear_product_caches(obj)

        # Category changed → delete everything and stop
        # JS resets the variant UI on category change and continute to create variants
        # Category changed → smart delete by removed categories 
        new_category_ids = set(obj.categories.values_list('id', flat=True))
        if old_category_ids != new_category_ids:
            removed_category_ids = old_category_ids - new_category_ids

            if removed_category_ids:
                # Find variant_option_ids that belong to removed categories
                removed_variant_option_ids = list(
                    VariantOption.objects.filter(
                        variant__category_id__in=list(removed_category_ids)
                    ).values_list('id', flat=True)
                )

                if removed_variant_option_ids:
                    # Delete SKUs that contain any of these options
                    sku_ids_to_delete = list(
                        ProductSKU.objects.filter(
                            product=obj,
                            sku_options__variant_option_id__in=removed_variant_option_ids
                        ).distinct().values_list('id', flat=True)
                    )
                    if sku_ids_to_delete:
                        ProductSKUOption.objects.filter(sku_id__in=sku_ids_to_delete).delete()
                        ProductSKU.objects.filter(id__in=sku_ids_to_delete).delete()

                    # Delete ProductVariantOptions for removed options
                    ProductVariantOption.objects.filter(
                        product=obj,
                        variant_option_id__in=removed_variant_option_ids
                    ).delete()

        #  No variant input submitted → nothing to do 
        if 'selected_variant_options' not in request.POST:
            return

        selected_ids_raw     = request.POST.get('selected_variant_options', '')
        sku_combinations_raw = request.POST.get('sku_combinations', '')

        new_selected_ids = set(
            int(i) for i in selected_ids_raw.split(',') if i.strip().isdigit()
        )

        print("obj.has_variant====> ",obj.has_variants)

        # No variants selected → create single default SKU from product
        if not new_selected_ids or not obj.has_variants:
            print("obj.has_variant====> Entered")

            # Only delete SKUs that are variant-based (have sku_options).
            # Leave the default/manual SKU intact so stock edits are preserved.
            variant_sku_ids = list(
                ProductSKUOption.objects.filter(sku__product=obj)
                .values_list('sku_id', flat=True)
                .distinct()
            )
            if variant_sku_ids:
                ProductSKUOption.objects.filter(sku_id__in=variant_sku_ids).delete()
                ProductSKU.objects.filter(id__in=variant_sku_ids).delete()
            ProductVariantOption.objects.filter(product=obj).delete()

            # Create default SKU only if none exists
            if not ProductSKU.objects.filter(product=obj).exists():
                ProductSKU.objects.create(
                    product  = obj,
                    sku_code = obj.sku,
                    price    = obj.price,
                    stock    = obj.stock_quantity,
                    low_stock_threshold = obj.low_stock_threshold,
                    is_active= obj.is_active,
                )
            return
        
        if obj.has_variants:
            sku_option_len = ProductSKUOption.objects.filter(sku__product__id=obj.id).count()
            print("sku_option_len",sku_option_len,"obj.has_variants",obj.has_variants)
            if sku_option_len == 0:
                ProductSKU.objects.filter(product__id=obj.id).delete()



        #  Sync ProductVariantOptions (add new, remove deselected) 
        existing_option_ids = set(
            ProductVariantOption.objects
            .filter(product=obj)
            .values_list('variant_option_id', flat=True)
        )

        to_add    = new_selected_ids - existing_option_ids   # new selections
        to_remove = existing_option_ids - new_selected_ids   # deselected

        # Delete removed variant options + their SKUs
        if to_remove:
            sku_ids_to_delete = list(
                ProductSKU.objects.filter(
                    product=obj,
                    sku_options__variant_option_id__in=list(to_remove)
                ).distinct().values_list('id', flat=True)
            )
            if sku_ids_to_delete:
                ProductSKUOption.objects.filter(sku_id__in=sku_ids_to_delete).delete()
                ProductSKU.objects.filter(id__in=sku_ids_to_delete).delete()
            ProductVariantOption.objects.filter(
                product=obj, variant_option_id__in=list(to_remove)
            ).delete()

        # Add new variant options
        if to_add:
            ProductVariantOption.objects.bulk_create([
                ProductVariantOption(product=obj, variant_option_id=vid)
                for vid in to_add
            ])

        # Sync SKUs (add new combinations, keep existing) 
        try:
            combinations = json.loads(sku_combinations_raw) if sku_combinations_raw else []
        except (json.JSONDecodeError, ValueError):
            combinations = []

        # Build a map of existing SKUs keyed by frozenset of their option_ids
        existing_skus_qs = ProductSKU.objects.filter(product=obj).prefetch_related('sku_options')
        existing_sku_by_options = {}
        for existing_sku in existing_skus_qs:
            key = frozenset(opt.variant_option_id for opt in existing_sku.sku_options.all())
            existing_sku_by_options[key] = existing_sku

        from decimal import Decimal, InvalidOperation

        for combo in combinations:
            sku_code   = combo.get('sku_code', '').strip()
            option_ids = combo.get('option_ids', [])
            if not sku_code or not option_ids:
                continue
            key = frozenset(option_ids)
            if key in existing_sku_by_options:
                existing = existing_sku_by_options[key]
                update_fields = []

                if existing.sku_code != sku_code:
                    existing.sku_code = sku_code
                    update_fields.append('sku_code')

                for db_field, combo_key in [
                    ('price', 'price'), ('weight', 'weight'),
                    ('length', 'length'), ('width', 'width'), ('height', 'height'),
                ]:
                    raw = combo.get(combo_key)
                    if raw is not None:
                        try:
                            new_val = Decimal(str(raw))
                            if getattr(existing, db_field) != new_val:
                                setattr(existing, db_field, new_val)
                                update_fields.append(db_field)
                        except (InvalidOperation, ValueError):
                            pass

                for db_field, combo_key in [('stock', 'stock'), ('low_stock_threshold', 'low_stock')]:
                    raw = combo.get(combo_key)
                    if raw is not None:
                        try:
                            new_val = int(raw)
                            if getattr(existing, db_field) != new_val:
                                setattr(existing, db_field, new_val)
                                update_fields.append(db_field)
                        except (ValueError, TypeError):
                            pass

                if update_fields:
                    existing.save(update_fields=update_fields)
            else:
                # New combination → create
                sku = ProductSKU.objects.create(
                    product  = obj,
                    sku_code = sku_code,
                    price    = combo.get('price', 0.00),
                    stock    = combo.get('stock', 0),
                    low_stock_threshold = combo.get('low_stock', 0),
                    weight = combo.get('weight', 0),
                    length = combo.get('length', 0),
                    width  = combo.get('width', 0),
                    height = combo.get('height', 0),
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


class ProductSKUOptionInline(admin.TabularInline):
    model = ProductSKUOption
    extra = 0
    readonly_fields = ['variant_option']
    can_delete = False
    verbose_name = "Variant Option"
    verbose_name_plural = "Variant Options (read-only)"


@admin.register(ProductSKU)
class ProductSKUAdmin(admin.ModelAdmin):
    inlines         = [ProductSKUOptionInline]
    list_display    = ['id','product', 'sku_code', 'price', 'stock','low_stock_threshold', 'is_active', 'created_at']
    list_filter     = ['is_active', 'created_at']
    search_fields   = ['sku_code', 'product__name']
    list_editable   = ['price', 'stock','low_stock_threshold', 'is_active']
    readonly_fields = ['product', 'created_at']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product')

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        try:
            if obj.product_id and obj.product.slug:
                cache.delete(f"product_detail:{obj.product.slug}")
        except Exception:
            pass


@admin.register(ProductDocument)
class ProductDocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'title', 'section', 'sku', 'sort_order', 'is_active', 'updated_at']
    list_filter = ['section', 'is_active', 'updated_at']
    search_fields = ['title', 'product__name', 'product__sku', 'sku__sku_code', 'target_search_text', 'extracted_target_text']
    autocomplete_fields = ['product', 'sku']
    readonly_fields = ['extracted_target_text']


@admin.register(Pathogen)
class PathogenAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'scientific_name', 'pathogen_type', 'is_active', 'created_at']
    list_filter = ['pathogen_type', 'is_active']
    search_fields = ['name', 'scientific_name']
    list_editable = ['pathogen_type', 'is_active']
    ordering = ['pathogen_type', 'name']

    def get_model_perms(self, request):
        return {}


@admin.register(ProductPathogen)
class ProductPathogenAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'pathogen', 'sort_order']
    list_filter = ['pathogen__pathogen_type']
    search_fields = ['product__name', 'pathogen__name']
    autocomplete_fields = ['product', 'pathogen']

    def get_model_perms(self, request):
        return {}


@admin.register(ProductAssayDetail)
class ProductAssayDetailAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'assay_type', 'catalog_number', 'reaction_format', 'target_count', 'is_active']
    list_filter = ['assay_type', 'is_active']
    search_fields = ['product__name', 'panel_name', 'catalog_number']
    autocomplete_fields = ['product']

    def get_model_perms(self, request):
        return {}


@admin.register(AssayPanelTargetDocument)
class AssayPanelTargetDocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'panel_type', 'document_type', 'title', 'target_count', 'view_file', 'sort_order', 'is_active', 'updated_at']
    list_filter = ['panel_type', 'document_type', 'is_active', 'updated_at']
    search_fields = ['title']
    list_editable = ['target_count', 'sort_order', 'is_active']

    @admin.display(description='View')
    def view_file(self, obj):
        if not obj.file:
            return ''
        return format_html('<a href="{}" target="_blank" rel="noopener noreferrer">View file</a>', obj.file.url)
