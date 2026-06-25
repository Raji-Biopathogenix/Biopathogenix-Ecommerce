from django.db import models

# Create your models here.
from django.utils import timezone
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from country.models import State
import uuid

from product.models import Product


# Roles
ROLE_SUPERADMIN = "superadmin"
ROLE_CUSTOMER = "customer"
ROLE_LABORATORY = "Laboratory(manually reviewed)"

ROLE_CHOICES = [
    (ROLE_SUPERADMIN, "superadmin"),
    (ROLE_CUSTOMER, "customer"),
]

ROLE_TYPE = [
    (ROLE_LABORATORY, "Laboratory(manually reviewed)"),
]




class Roles(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.name
    class Meta:
        db_table = 'users_roles'
        verbose_name_plural = "Roles"



class userTypes(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    class Meta:
        db_table = 'users_userTypes'
        verbose_name_plural = "User Types"


class Laboratory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    class Meta:
        db_table = 'users_Laboratories'
        verbose_name_plural = "Laboratories"



class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be set")

        email = self.normalize_email(email).lower()
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(email, password, **extra_fields)




class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=255, unique=True,db_index=True)
    role = models.ManyToManyField(Roles,through='UserRole',blank=True,related_name='users')
    state =  models.ForeignKey(State, on_delete=models.CASCADE,null=True,blank=True,db_index=True ,related_name='state_users')
    first_name = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    last_name = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    Company_name = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    Street_Address = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    Address_Line_2 = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    Town_City = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    Zip_Code = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    stripe_customer_id = models.CharField(max_length=150,null=True,blank=True,default="")
    quickbook_customer_id = models.CharField(max_length=150,null=True,blank=True,default="")

    uid = models.UUIDField(default=uuid.uuid4,editable=False)
    active_uuid = models.UUIDField(default=uuid.uuid4,editable=False)
    is_verified = models.BooleanField(default=False)
    laboratory = models.ForeignKey(Laboratory, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')


    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    
    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"
        indexes = [
            models.Index(fields=["email"]),
        ]

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        super().save(*args, **kwargs)

    # def clean(self):
    #     allowed_roles = {r[0] for r in ROLE_CHOICES}
    #     if self.role not in allowed_roles:
    #         raise ValidationError({'role': 'Invalid role value.'})

    # @staticmethod
    # def can_create_role(creator_role, target_role):
    #     if creator_role == ROLE_SUPERADMIN:
    #         return target_role == ROLE_CUSTOMER
    #     return False

    @property
    def is_superadmin(self):
        return self.role == ROLE_SUPERADMIN

    @property
    def is_customer(self):
        return self.role == ROLE_CUSTOMER
    
    @property
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        else:
            return self.email


    def __str__(self):
        return self.email
    


    
class UserRole(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Roles, on_delete=models.CASCADE, related_name='role_users')
    assigned_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users_userrole'
        constraints = [
            models.UniqueConstraint(fields=['user', 'role'], name='unique_user_role')
        ]
        indexes = [
            models.Index(fields=['user', 'role']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.role.name}"


class CustomizableProductprices(models.Model):
    product  = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='customizable_product_prices')
    laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE, related_name='laboratory_product_prices')
    created_at = models.DateTimeField(auto_now_add=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    class Meta:
        db_table = 'customizabel_laboratory_product_prices'

        constraints = [
            models.UniqueConstraint(fields=['laboratory','product'], name='unique_laboratory_product_price')
        ]

        indexes = [
            models.Index(fields=['laboratory', 'product']),
        ]


    def __str__(self):
        return f" {self.product}"


# class CustomerProductPrices(models.Model):
#     product  = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='customer_product_prices')
#     laboratory = models.ForeignKey(Laboratory, on_delete=models.CASCADE, related_name='laboratory_product_prices')
#     created_at = models.DateTimeField(auto_now_add=True)
#     price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
#     class Meta:
#         db_table = 'laboratory_product_prices'

#         constraints = [
#             models.UniqueConstraint(fields=['laboratory','product'], name='unique_laboratory_product_price')
#         ]

#         indexes = [
#             models.Index(fields=['laboratory', 'product']),
#         ]


    # def __str__(self):
    #     return f" {self.product}"
    
    # @property
    # def user_details(self):
    #     return {"is_active": self.is_active}

    # @property
    # def price_details(self):
    #     return {"amount": self.user_type.price}
