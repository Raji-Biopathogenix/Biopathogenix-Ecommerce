from django.contrib import admin
from django.contrib import messages

# Register your models here.
from django import forms
from .career_constants import CAREER_DEPARTMENTS, normalize_department
from .models import HeaderMenus, Category, CareerOpenRole, CareerApplication,Search,LandingPageContext,LandingPageType,LandingPageImage ,DiscountProducts,BlogPost,BlogPostImage



@admin.register(Search)
class SearchAdmin(admin.ModelAdmin):
    list_display = ['name','value','date','count']


@admin.register(LandingPageType)
class LandingPageTypeAdmin(admin.ModelAdmin):
    list_display = ['name','order','is_active','created_at','updated_at']


@admin.register(DiscountProducts)
class DiscountProductsAdmin(admin.ModelAdmin):
    list_display = ['landing_page_context','product']
    autocomplete_fields = ['product'] 


@admin.register(LandingPageImage)
class LandingPageImageAdmin(admin.ModelAdmin):
    list_display = ["landing_page_type", "order", "is_active", "alt_text"]
    list_filter = ["landing_page_type", "is_active"]
    search_fields = ["landing_page_type__name", "alt_text"]
    fieldsets = (
        ("Image Upload", {
            "fields": ("landing_page_type", "image", "alt_text"),
            "description": (
                "Recommended image sizes: Hero section 1920x900 px. "
                "All other homepage sections should use 1200x800 px for clear display."
            ),
        }),
        ("Display Settings", {
            "fields": ("order", "is_active"),
        }),
    )


@admin.register(LandingPageContext)
class LandingPageContextAdmin(admin.ModelAdmin):
    list_display = ["title", "landing_page_type", "btn_text", "btn_url", "is_active"]
    list_editable = ["is_active"]
    list_filter = ["landing_page_type", "is_active"]
    search_fields = ["title", "btn_text", "btn_url"]
    fieldsets = (
        ("Content", {
            "fields": ("landing_page_type", "title", "short_description", "description"),
        }),
        ("Button", {
            "fields": ("btn_text", "btn_url", "download_file"),
            "description": "Upload a file in 'Download file' for download buttons. If no file is uploaded, the button will use the URL field.",
        }),
        ("Schedule", {
            "fields": ("start_date", "end_date", "discount_value"),
        }),
        ("Visibility", {
            "fields": ("is_active",),
        }),
    )



class HeaderMenuAdminForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['category'].queryset = Category.objects.filter(parent=None)

    class Meta:
        model  = HeaderMenus
        fields = '__all__'


class CareerOpenRoleAdminForm(forms.ModelForm):
    department = forms.ChoiceField(
        choices=[("", "Select Department")] + [(department, department) for department in CAREER_DEPARTMENTS],
        required=True,
    )

    class Meta:
        model = CareerOpenRole
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        current_department = (self.instance.department or "").strip()
        if current_department and current_department not in CAREER_DEPARTMENTS:
            self.fields["department"].choices = list(self.fields["department"].choices) + [
                (current_department, current_department)
            ]

    def clean_department(self):
        return normalize_department(self.cleaned_data.get("department", ""))


@admin.register(HeaderMenus)
class HeaderMenusAdmin(admin.ModelAdmin):
    form         = HeaderMenuAdminForm
    list_display = ['title', 'type', 'category', 'hide_menu_items','navigation_flag']


@admin.register(CareerOpenRole)
class CareerOpenRoleAdmin(admin.ModelAdmin):
    form = CareerOpenRoleAdminForm
    list_display = ["title", "slug", "department", "location", "employment_type", "sort_order", "is_active"]
    list_filter = ["is_active", "department", "employment_type", "location"]
    search_fields = ["title", "slug", "department", "location"]
    prepopulated_fields = {"slug": ("title",)}
    ordering = ["sort_order", "title"]


@admin.register(CareerApplication)
class CareerApplicationAdmin(admin.ModelAdmin):
    list_display = ["full_name", "email", "role", "status", "created_at"]
    list_filter = ["status", "created_at", "role"]
    search_fields = ["full_name", "email", "role__title"]
    autocomplete_fields = ["role"]
    readonly_fields = ["created_at", "updated_at"]
    actions = ["mark_selected_as_rejected"]

    @admin.action(description="Mark selected as rejected and notify candidates")
    def mark_selected_as_rejected(self, request, queryset):
        updated_count = 0
        for application in queryset.exclude(status="rejected"):
            application.status = "rejected"
            application.save()
            updated_count += 1

        if updated_count:
            self.message_user(
                request,
                f"{updated_count} application(s) marked as rejected and notification email triggered.",
                level=messages.SUCCESS,
            )
        else:
            self.message_user(
                request,
                "No application status changed. Selected records were already rejected.",
                level=messages.INFO,
            )


class BlogPostImageInline(admin.TabularInline):
    model = BlogPostImage
    fk_name = "blog_post"
    extra = 1
    fields = ("image", "alt_text", "order", "show_in_gallery")
    template = "admin/edit_inline/tabular.html"


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    inlines = [BlogPostImageInline]
    list_display = ["title", "slug", "published_at", "is_published", "sort_order", "created_at"]
    list_filter = ["is_published", "published_at"]
    search_fields = ["title", "slug", "excerpt", "content_html"]
    prepopulated_fields = {"slug": ("title",)}
    ordering = ["-published_at", "-created_at"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        ("Content", {
            "fields": ("title", "slug", "excerpt", "content_html"),
            "description": "Paste trusted HTML here if you want rich formatting, including embedded images.",
        }),
        ("Media", {
            "fields": ("featured_image", "image_alt"),
        }),
        ("Publishing", {
            "fields": ("published_at", "is_published", "sort_order"),
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at"),
        }),
    )
