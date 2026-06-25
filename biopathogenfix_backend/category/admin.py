from django.contrib import admin
from django.utils.html import format_html

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = [
        'id',
        'name',
        'slug',
        'parent',
        'category_image',
        'is_active',
        'created_by',
        'created_at',
        'updated_at',
        'display_type',
    ]
    list_display_links = ['id', 'name']
    list_filter = ['is_active', 'created_at', 'created_by', 'parent']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_by', 'created_at', 'updated_at', 'category_image']

    fieldsets = (
        ('Category Info', {
            'fields': ('name', 'slug', 'parent', 'is_active', 'short_description','display_type')
        }),
        ('Image', {
            'fields': ('image', 'category_image'),
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    @admin.display(description='Image')
    def category_image(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" width="60" height="60" style="object-fit:cover; border-radius:4px;" />',
                obj.image.url,
            )
        return '-'

    def has_change_permission(self, request, obj=None):
        # If a staff user can add categories, allow editing categories too.
        if super().has_change_permission(request, obj=obj):
            return True
        return self.has_add_permission(request)

    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related('created_by', 'parent')
