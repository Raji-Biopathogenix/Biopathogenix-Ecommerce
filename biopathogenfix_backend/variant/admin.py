from django.contrib import admin
from .models import Variant, VariantOption


class VariantOptionInline(admin.TabularInline):
    model = VariantOption
    extra = 1                    # Show 3 empty rows by default
    min_num = 1                  # At least 1 option required
    can_delete = True            # Allow deleting options
    fields = ('value', 'order','is_active')
    ordering = ('order',)

    # Allow adding more rows dynamically
    def get_extra(self, request, obj=None, **kwargs):
        # If editing existing variant, show fewer extra rows
        if obj:
            return 1
        return 1


@admin.register(Variant)
class VariantAdmin(admin.ModelAdmin):
    list_display   = ('category','category__id', 'name','is_active', 'order', 'option_count')
    list_editable  = ('order',)
    search_fields  = ('name',)
    ordering       = ('order',)
    inlines        = [VariantOptionInline]

    autocomplete_fields = ['category'] 

    fieldsets = (
        (None, {
            'fields': ('category','name', 'order','is_active'),
            'description': 'Create a variant (e.g. Reactions, System, Type, Well Format) and add its options below.'
        }),
    )
    def has_delete_permission(self, request, obj=None):
        return False   

    def option_count(self, obj):
        count = obj.options.count()
        return f"{count} option{'s' if count != 1 else ''}"
    option_count.short_description = 'Options'


@admin.register(VariantOption)
class VariantOptionAdmin(admin.ModelAdmin):
    list_display  = ('value', 'variant', 'order','is_active')
    list_filter   = ('variant',)
    search_fields = ('value', 'variant__name')
    list_editable = ('order',)
    ordering      = ('variant', 'order')

    def has_delete_permission(self, request, obj=None):
        return False   