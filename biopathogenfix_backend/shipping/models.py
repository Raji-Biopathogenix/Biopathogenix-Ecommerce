from django.db import models
from django.conf import settings
from country.models import State,Country

# Create your models here.



class Address(models.Model):
    shippingTypes= (('shipping_addr', 'Shipping Address'),('billing_addr', 'Billing Address'))
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    address_line1 = models.CharField(max_length=255)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    state =  models.ForeignKey(State, on_delete=models.CASCADE,db_index=True ,related_name='state_address')
    country =  models.ForeignKey(Country, on_delete=models.CASCADE,db_index=True ,related_name='country_address')
    postal_code = models.CharField(max_length=20)
    shipping_type =models.CharField(max_length=15,choices=shippingTypes,default='shipping_addr') 
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,null=True,blank=True ,related_name='address')

    def __str__(self):
        return self.first_name







