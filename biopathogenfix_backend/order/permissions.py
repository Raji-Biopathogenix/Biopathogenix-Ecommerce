from rest_framework.permissions import BasePermission
from users.models import UserRole


def is_order_admin(user):
    return bool(user.is_authenticated and user.is_active and (
        user.is_staff or user.is_superuser
        or UserRole.objects.filter(user=user, role__name='superadmin').exists()
    ))


class IsOrderAdmin(BasePermission):
    def has_permission(self, request, view):
        return is_order_admin(request.user)


def accessible_orders(user):
    from .models import Order
    return Order.objects.all() if is_order_admin(user) else Order.objects.filter(user=user)
