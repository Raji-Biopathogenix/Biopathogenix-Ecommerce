from django.db import models

# Create your models here.


class Country(models.Model):
    name = models.CharField(max_length=50, unique=True)  
    code = models.CharField(max_length=6, null=True, blank=True, unique=True)
    status=models.BooleanField(default=False)

    class Meta:
        verbose_name_plural = "Countries"
        ordering = ['name'] 

    def __str__(self):
        return self.name



class State(models.Model):
    name=models.CharField(max_length=50)
    code=models.CharField(max_length=6,null=True,blank=True)
    status=models.BooleanField(default=False)
    country = models.ForeignKey(
        Country, 
        on_delete=models.CASCADE,
        related_name='states'  
    )

    class Meta:
        verbose_name_plural = "States"
        ordering = ['country', 'name'] 
        unique_together = ['name', 'country'] 
    

    def __str__(self):
        return self.name

