from django.db import models

# Create your models here.






class DocumentType(models.Model):
    name = models.CharField(max_length=255, unique=True , db_index=True)
    sort_order = models.IntegerField(default=0)



    def __str__(self):
        return f"{self.name}"
    