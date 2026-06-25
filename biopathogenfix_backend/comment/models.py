from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
# Create your models here


class Comment(models.Model):
    table_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL,  on_delete=models.SET_NULL, related_name='comments', null=True, blank=True)
    content_type = models.ForeignKey(ContentType,on_delete=models.CASCADE,null=True,blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')  
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        indexes = [models.Index(fields=['content_type', 'object_id'])]

    # def __str__(self):
    #     return f"Comment by {self.created_by} on {self.content_type} ({self.object_id})"
    
    def __str__(self):
        try:
            user = self.created_by
        except Exception:
            user = "Unknown"
        return f"Comment by {user} on {self.table_name} ({self.object_id})"
