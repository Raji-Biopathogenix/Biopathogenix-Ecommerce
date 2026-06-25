from django.db import models

# Create your models here.
from django.utils.text import slugify
from django.conf import settings


class Category(models.Model):
    STATUS_CHOICES = [
        ("product_card", "Product Card"),
        ("default_card", "Default Card"),
        ("multi_level_cat", "Multi-Level Category"),
        ("none","None")
    ]

    name = models.CharField(max_length=255, unique=True , db_index=True)
    slug = models.SlugField(max_length=255, unique=True, db_index=True)
    is_active = models.BooleanField(default=True ,  db_index=True)
    parent = models.ForeignKey('self', null=True, blank=True,on_delete=models.CASCADE,related_name='children')
    image = models.ImageField(upload_to='categories/%Y/%m/%d/',null=True,blank=True, max_length=750)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='categories',editable=False)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL,on_delete=models.CASCADE,related_name='categories_updated',null=True,blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    level     = models.PositiveIntegerField(default=0)
    short_description = models.TextField(blank=True, max_length=750)
    sort_order = models.IntegerField(default=0)
    url = models.SlugField(max_length=500,null=True,blank=True , db_index=True)
    display_type = models.CharField(max_length=20, choices=STATUS_CHOICES,default="none")



    def __str__(self):
        return self.name
    
    def _generate_unique_slug(self):
        base_slug = slugify(self.name) or "category"
        
        if self.slug and self.slug.startswith(base_slug):
            return self.slug

        slug = base_slug
        counter = 2
        while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug


    def save(self, *args, **kwargs):
        self.slug = self._generate_unique_slug()  
        if self.parent:
            self.level = self.parent.level + 1
        else:
            self.level = 0
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
        ]

     

