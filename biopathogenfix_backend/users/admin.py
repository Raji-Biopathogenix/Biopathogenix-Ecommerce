from django.contrib import admin
from django.utils.safestring import mark_safe
from .models import CustomUser, Roles, UserRole, userTypes,Product,Laboratory,CustomizableProductprices
from .tasks import send_welcome_email
from django import forms
from django.utils.crypto import get_random_string
import logging


logger = logging.getLogger(__name__)


def send_welcome_email_safe(email, context):
    try:
        send_welcome_email(email, context)
    except Exception as exc:
        logger.exception("Failed to send welcome email to %s: %s", email, exc)




class CustomizableProductpricesInline(admin.TabularInline):
    model = CustomizableProductprices
    extra = 1
    fields = ('product', 'price')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'product':
            kwargs['queryset'] = Product.objects.filter(is_customizable=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
@admin.register(Laboratory)
class LaboratoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    inlines = [CustomizableProductpricesInline]


@admin.register(userTypes)
class userTypesAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')





@admin.register(CustomUser)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'last_name', 'get_roles', 'is_active', 'is_staff', 'date_joined']
    list_filter = ("is_active", "is_staff")
    search_fields = ("email", "first_name", "last_name", "Company_name")


    def get_roles(self, obj):
        return ", ".join([role.name for role in obj.role.all()])
    get_roles.short_description = 'Roles'

    def save_model(self, request, obj, form, change):
        was_active = False
        if change and obj.pk:
            was_active = (
                CustomUser.objects.filter(pk=obj.pk).values_list("is_active", flat=True).first()
                or False
            )

        activated_now = obj.is_active and not was_active and not obj.is_superuser
        generated_password = None
        if activated_now:
            generated_password = get_random_string(12)
            obj.set_password(generated_password)

        super().save_model(request, obj, form, change)

        if obj.is_active and obj.is_staff:
            roles = Roles.objects.filter(name__in=['customer', 'laboratory'])
            for role in roles:
                user_role, created = UserRole.objects.get_or_create(user=obj, role=role)
                if created:
                    user_role.save()

        if activated_now and generated_password:
            send_welcome_email_safe(
                obj.email,
                {
                    "subject": "Welcome To BioPathogenix",
                    "first_name": obj.first_name,
                    "last_name": obj.last_name,
                    "email": obj.email,
                    "password": generated_password,
                    "msg": "Your account has been activated. Use the credentials below to log in.",
                },
            )
            

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['row_highlight_js'] = mark_safe("""
        <style>
            .row-red td   { background-color: #FCEBEB !important; }
            .row-green td { background-color: #EAF3DE !important; }
        </style>
        <script>
        (function() {
            function applyRowColors() {
                const rows = document.querySelectorAll('#result_list tbody tr');
                rows.forEach(function(row) {
                    const isActiveCell = row.querySelector('td.field-is_active');
                    const isStaffCell  = row.querySelector('td.field-is_staff');
                    if (!isActiveCell || !isStaffCell) return;

                    const isActive = !!isActiveCell.querySelector('img[alt="True"], [class*="yes"]');
                    const isStaff  = !!isStaffCell.querySelector('img[alt="True"], [class*="yes"]');

                    // is_staff=False AND is_active=False → RED
                    if (!isStaff && !isActive) {
                        row.classList.add('row-red');
                    }
                    // is_staff=True AND is_active=False → GREEN
                    else if (isStaff && !isActive) {
                        row.classList.add('row-green');
                    }
                    // is_staff=True  AND is_active=True  → no color
                    // is_staff=False AND is_active=True  → no color
                });
            }
            document.addEventListener('DOMContentLoaded', applyRowColors);
        })();
        </script>
        """)
        return super().changelist_view(request, extra_context=extra_context)


@admin.register(Roles)
class RolesAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']
    ordering = ['name']


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'assigned_date']
    list_filter = ['role', 'assigned_date']
    search_fields = ['user__email', 'role__name']
    ordering = ['-assigned_date']
