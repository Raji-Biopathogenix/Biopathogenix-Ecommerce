from django.db import models

# Create your models here.



class Settings(models.Model):
    name = models.CharField(max_length=25)
    value = models.CharField(max_length=25)
    description = models.TextField(null=True,blank=True)

    def __str__(self):
        return f"{self.name}"
