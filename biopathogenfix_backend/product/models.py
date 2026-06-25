# products/models.py
from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.core.validators import FileExtensionValidator
from category.models import Category  # Import Category
from documet.models import DocumentType
from .target_documents import extract_target_text_from_file
from django.contrib.contenttypes.fields import GenericRelation
from comment.models import Comment

def trademark_default():
    return {
        "display": False,
        "postion": 'pre',
        "text": "BPX",
        'trademark':'TM'
    }



class Product(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    slug = models.SlugField(max_length=255, unique=True, db_index=True, blank=True) 
    categories = models.ManyToManyField(Category,blank=True,related_name='all_products')
    description = models.TextField(blank=True)
    short_description = models.TextField(blank=True, max_length=500,help_text="you allowed to write upto 500 characters")
    links = models.TextField(blank=True)
    trademark = models.JSONField(
        default=trademark_default,   
        blank=True,
        help_text="Position value should be pre/post ,if the product has trademark mark display as True "
    )

    
    # Pricing
    sku = models.CharField(max_length=100, unique=True, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,help_text="Original price before discount")
    cost_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,help_text="Your cost to acquire this product")
    
    # Inventory
    stock_quantity = models.IntegerField(default=0)
    low_stock_threshold = models.IntegerField(default=5)
    
    # Status
    is_active = models.BooleanField(default=True, db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    has_variants = models.BooleanField(default=False, db_index=True)
    is_customizable = models.BooleanField(default=False, db_index=True)
    is_shipping_required = models.BooleanField(default=False,db_index=True)
    is_returnable = models.BooleanField(default=False,db_index=True)
    
    # Dimensions
    weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,help_text="Weight in kg")
    length = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,help_text="Length in cm")
    width = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,help_text="Width in cm")
    height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,help_text="Height in cm")
    
    # SEO
    meta_title = models.CharField(max_length=255, blank=True)
    meta_description = models.TextField(blank=True)
    
    # Analytics
    views_count = models.IntegerField(default=0, editable=False)
    
    # Timestamps & Users
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products_created',
        editable=False
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products_updated',
        null=True,
        blank=True
    )

    # comments = GenericRelation(Comment)
    discount_value = models.DecimalField(max_digits=10,default=0.00, decimal_places=2,help_text="10 = '10%'") 


    def __str__(self):
        return self.name

  
    def _generate_unique_slug(self):
        base_slug = slugify(self.name) or "product"
        
        if self.slug and self.slug.startswith(base_slug):
            return self.slug

        slug = base_slug
        counter = 2
        while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return slug


    def save(self, *args, **kwargs):
        self.slug = self._generate_unique_slug()  
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['slug']),
            models.Index(fields=['sku']),
            models.Index(fields=['is_active', 'is_featured']),
            models.Index(fields=[ 'is_active']), 
            #  
        ]

    @property
    def is_in_stock(self):
        return self.stock_quantity > 0

    @property
    def is_low_stock(self):
        return 0 < self.stock_quantity <= self.low_stock_threshold

    @property
    def discount_percentage(self):
        if self.compare_price and self.compare_price > self.price:
            discount = ((self.compare_price - self.price) / self.compare_price) * 100
            return round(discount, 2)
        return 0

    @property
    def has_discount(self):
        return self.discount_percentage > 0

    @property
    def profit_margin(self):
        if self.cost_price and self.cost_price > 0:
            profit = ((self.price - self.cost_price) / self.price) * 100
            return round(profit, 2)
        return 0


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/%Y/%m/%d/', max_length=500)
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False, db_index=True) 
    hover = models.BooleanField(default=False, db_index=True) 
    sort_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def _compress_image(self):
        import io, os
        from PIL import Image as PilImage
        from django.core.files.base import ContentFile
        try:
            img = PilImage.open(self.image)
            if img.mode not in ('RGB', 'L'):
                bg = PilImage.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    bg.paste(img, mask=img.split()[3])
                else:
                    bg.paste(img.convert('RGB'))
                img = bg
            img.thumbnail((1200, 1200), PilImage.LANCZOS)
            buf = io.BytesIO()
            img.save(buf, format='JPEG', quality=85, optimize=True)
            buf.seek(0)
            name = os.path.splitext(os.path.basename(self.image.name))[0] + '.jpg'
            self.image = ContentFile(buf.read(), name=name)
        except Exception:
            pass

    def save(self, *args, **kwargs):
        if self.is_primary:
            ProductImage.objects.filter(
                product=self.product,
                is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)
        elif not ProductImage.objects.filter(
            product=self.product,
            is_primary=True
        ).exclude(pk=self.pk).exists():
            self.is_primary = True

        if self.image and not self.image._committed:
            self._compress_image()

        super().save(*args, **kwargs)

    class Meta:
        ordering = ['sort_order', '-is_primary']
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'

    def __str__(self):
        return f"{self.product.name} - Image {self.id}"
    

class ProductDocument(models.Model):
    SECTION_CHOICES = [
        ('ifu', 'Information for Use'),
        ('sds', 'Safety Data Sheet(s)'),
        ('other', 'Other Documents'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='documents')
    sku = models.ForeignKey(
        'prd_variant.ProductSKU',
        on_delete=models.SET_NULL,
        related_name='documents',
        null=True,
        blank=True,
        help_text='Optional: assign to a specific SKU/variant combination',
    )
    section = models.ForeignKey(DocumentType,on_delete=models.CASCADE,related_name='prd_documents')    
    title = models.CharField(max_length=255)
    file = models.FileField(
        upload_to='product_docs/%Y/%m/%d/',
        db_column='file_url',
        max_length=500,
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'])],
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    target_search_text = models.TextField(
        blank=True,
        help_text='Optional: paste target/pathogen names for product search.',
    )
    extracted_target_text = models.TextField(blank=True, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['section', 'sort_order', 'id']
        verbose_name = 'Product Document'
        verbose_name_plural = 'Product Documents'
        indexes = [
            models.Index(fields=['product', 'is_active', 'section', 'sort_order']),
            models.Index(fields=['sku', 'is_active']),
        ]

    def __str__(self):
        sku_label = f" [{self.sku.sku_code}]" if self.sku_id else ''
        return f"{self.product.name}{sku_label} - {self.title}"

    def save(self, *args, **kwargs):
        self.extracted_target_text = extract_target_text_from_file(self.file)
        super().save(*args, **kwargs)

    @property
    def certificate_type(self):
        return self.section.name


class ProductFaQ(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='faq')
    question = models.TextField(blank=True, max_length=500,help_text="you allowed to write upto 500 characters")
    answer = models.TextField(blank=True)
    sort_order = models.PositiveIntegerField(default=0) 
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.product.name} - {self.question}"


class Pathogen(models.Model):
    PATHOGEN_TYPE_CHOICES = [
        ('viral', 'Viral'),
        ('bacterial', 'Bacterial'),
        ('fungal', 'Fungal'),
        ('parasitic', 'Parasitic'),
        ('protozoal', 'Protozoal'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=255, db_index=True)
    scientific_name = models.CharField(max_length=255, blank=True)
    pathogen_type = models.CharField(max_length=20, choices=PATHOGEN_TYPE_CHOICES, default='bacterial', db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Pathogen'
        verbose_name_plural = 'Pathogens'
        ordering = ['pathogen_type', 'name']

    def __str__(self):
        return f"{self.name} ({self.get_pathogen_type_display()})"


class ProductPathogen(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='product_pathogens')
    pathogen = models.ForeignKey(Pathogen, on_delete=models.CASCADE, related_name='product_pathogens')
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Product Pathogen'
        verbose_name_plural = 'Product Pathogens'
        ordering = ['sort_order', 'pathogen__name']
        unique_together = [('product', 'pathogen')]

    def __str__(self):
        return f"{self.product.name} — {self.pathogen.name}"


class ProductAssayDetail(models.Model):
    ASSAY_TYPE_CHOICES = [
        ('respiratory', 'Respiratory'),
        ('uti', 'UTI (Urinary Tract Infection)'),
        ('sti', 'STI (Sexually Transmitted Infection)'),
        ('wound', 'Wound Panel'),
        ('gi', 'Gastrointestinal'),
        ('meningitis', 'Meningitis'),
        ('sepsis', 'Sepsis'),
        ('other', 'Other'),
        # Quality Control & Validation Kits
        ('qpcr_qc', 'qPCR Quality Control'),
        ('semi_quant', 'Semi-Quant Verification Kits'),
        ('validation_sets', 'Validation Sets'),
        ('inclusivity_sets', 'Inclusivity Sets'),
    ]

    product = models.OneToOneField(Product, on_delete=models.CASCADE, related_name='assay_detail')
    assay_type = models.CharField(max_length=30, choices=ASSAY_TYPE_CHOICES, db_index=True)
    reaction_format = models.CharField(max_length=100, blank=True, help_text="e.g. 96-well / 384-well")
    panel_name = models.CharField(max_length=255, blank=True, help_text="Short display name for the panel")
    catalog_number = models.CharField(max_length=100, blank=True, help_text="Assay-specific catalog number shown on assay cards.")
    target_count = models.PositiveIntegerField(default=0, help_text="Enter the number of assay targets shown on the product card.")
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = 'Product Assay Detail'
        verbose_name_plural = 'Product Assay Details'

    def __str__(self):
        return f"{self.product.name} — {self.get_assay_type_display()}"

class ProductRelatedInfo(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='related_information')
    title = models.CharField(max_length=255, help_text='Accordion header shown to customers.')
    content = models.TextField(help_text='Accordion body. HTML is allowed for formatting.')
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Related Information'
        verbose_name_plural = 'Related Information'
        ordering = ['sort_order', 'id']
        indexes = [
            models.Index(fields=['product', 'is_active', 'sort_order']),
        ]

    def __str__(self):
        return f"{self.product.name} â€” {self.title}"


class AssayPanelTargetDocument(models.Model):
    PANEL_TYPE_CHOICES = [
        ('all', 'All Assay Panels'),
        ('respiratory', 'RPP / Respiratory'),
        ('uti', 'UTI (Urinary Tract Infection)'),
        ('sti', 'STI / Urogenital'),
        ('wound', 'Wound and Nail'),
        ('gi', 'Gastrointestinal'),
        ('meningitis', 'Meningitis'),
        ('sepsis', 'Sepsis'),
        ('other', 'Other'),
    ]
    DOCUMENT_TYPE_CHOICES = [
        ('all_targets', 'All Targets List'),
        ('custom_targets', 'Custom Targets List'),
        ('panel_targets', 'Panel Targets List'),
    ]

    panel_type = models.CharField(max_length=30, choices=PANEL_TYPE_CHOICES, db_index=True)
    document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPE_CHOICES, default='panel_targets', db_index=True)
    title = models.CharField(max_length=255)
    file = models.FileField(
        upload_to='assay_target_docs/%Y/%m/%d/',
        max_length=500,
        validators=[FileExtensionValidator(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'])],
    )
    target_count = models.PositiveIntegerField(default=0, help_text="Optional number of targets included in this uploaded list.")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['panel_type', 'document_type', 'sort_order', 'id']
        verbose_name = 'Assay Target Document'
        verbose_name_plural = 'Assay Target Documents'
        indexes = [
            models.Index(
                fields=['panel_type', 'document_type', 'is_active', 'sort_order'],
                name='product_ass_panel_t_763ff1_idx',
            ),
        ]

    def __str__(self):
        return f"{self.get_panel_type_display()} - {self.title}"
