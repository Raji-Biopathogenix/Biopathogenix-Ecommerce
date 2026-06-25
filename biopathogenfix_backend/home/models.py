import logging
from django.core.validators import FileExtensionValidator
from django.db import models, transaction
from django.utils import timezone
from django.utils.text import slugify
from category.models import Category
from product.models import Product

logger = logging.getLogger(__name__)


class HeaderMenus(models.Model):
    MENU_TYPES = (('default',"Default"),("product_cat","Product Categories"))
    
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='header_categories',
        limit_choices_to={'parent': None},   # ← only root/parent categories
    )
    title = models.CharField(max_length=50, db_index=True)
    type = models.CharField(max_length=20, choices=MENU_TYPES, default="default")
    hide_menu_items = models.BooleanField(default=True)
    navigation_flag = models.BooleanField(default=False)

class Search(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    value = models.CharField(max_length=255, db_index=True)
    date   = models.DateField()
    count = models.IntegerField(default=0)

    def __str__(self):
        return self.name
    

class LandingPageType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Landing Page Type"
        verbose_name_plural = "Landing Page Types"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)



class LandingPageContext(models.Model):
    landing_page_type = models.ForeignKey(LandingPageType, on_delete=models.CASCADE, related_name="contexts")
    title = models.CharField(max_length=250)
    short_description = models.TextField(blank=True)
    description = models.TextField(blank=True)
    btn_text = models.CharField(max_length=100, blank=True)
    btn_url = models.URLField(blank=True)
    download_file = models.FileField(upload_to="landing_page_downloads/", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    start_date   = models.DateField(null=True,blank=True)
    end_date     = models.DateField(null=True,blank=True)
    discount_value = models.DecimalField(max_digits=10,default=0.00, decimal_places=2,help_text="10 = '10%'")
    is_active    = models.BooleanField(default=True, db_index=True)
    

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Landing Page Context"
        verbose_name_plural = "Landing Page Contexts"
    
    def __str__(self):
        return self.title


class LandingPageImage(models.Model):
    landing_page_type = models.ForeignKey(LandingPageType, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="landing_page_images/",help_text="Recommended dimensions for Herosection : 1920×900px, Other sections 1200×800px")
    is_active = models.BooleanField(default=True, db_index=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    alt_text = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "Landing Page Image"
        verbose_name_plural = "Landing Page Images"

    def __str__(self):
        return self.landing_page_type.name
    


class DiscountProducts(models.Model):
    landing_page_context = models.ForeignKey(LandingPageContext, on_delete=models.CASCADE, related_name="discount")
    product= models.ForeignKey(Product, on_delete=models.CASCADE, related_name="discount_products")

    class Meta:
        unique_together = ('landing_page_context', 'product')
    
    def __str__(self):
        return self.landing_page_context.title

class CareerOpenRole(models.Model):
    title = models.CharField(max_length=150)
    slug = models.SlugField(max_length=170, unique=True, null=True, blank=True)
    department = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    short_description = models.TextField(blank=True)
    description = models.TextField(blank=True)
    responsibilities = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    salary_range = models.CharField(max_length=100, blank=True)
    employment_type = models.CharField(max_length=50, blank=True)
    apply_url = models.URLField(blank=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "title"]
        verbose_name = "Career Open Role"
        verbose_name_plural = "Career Open Roles"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:160] or "career-role"
            generated_slug = base_slug
            counter = 2
            while CareerOpenRole.objects.exclude(pk=self.pk).filter(slug=generated_slug).exists():
                suffix = f"-{counter}"
                generated_slug = f"{base_slug[:160 - len(suffix)]}{suffix}"
                counter += 1
            self.slug = generated_slug
        super().save(*args, **kwargs)


class CareerApplication(models.Model):
    STATUS_CHOICES = (
        ("new", "New"),
        ("reviewed", "Reviewed"),
        ("shortlisted", "Shortlisted"),
        ("rejected", "Rejected"),
    )

    role = models.ForeignKey(CareerOpenRole, on_delete=models.CASCADE, related_name="applications")
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    linkedin_url = models.URLField(blank=True)
    message = models.TextField(blank=True)
    resume = models.FileField(
        upload_to="careers/resumes/%Y/%m/%d/",
        max_length=500,
        validators=[FileExtensionValidator(["pdf", "doc", "docx"])],
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Career Application"
        verbose_name_plural = "Career Applications"

    def __str__(self):
        return f"{self.full_name} - {self.role.title}"

    def save(self, *args, **kwargs):
        previous_status = None
        if self.pk:
            previous_status = (
                CareerApplication.objects.filter(pk=self.pk).values_list("status", flat=True).first()
            )

        super().save(*args, **kwargs)

        if previous_status != "rejected" and self.status == "rejected":
            application_id = self.pk

            def _send_rejection_notice():
                from .career_email_service import send_candidate_rejection_email

                try:
                    application = CareerApplication.objects.select_related("role").get(pk=application_id)
                    send_candidate_rejection_email(application)
                except Exception:
                    logger.exception(
                        "Failed to send rejection email for career application id=%s",
                        application_id,
                    )

            transaction.on_commit(_send_rejection_notice)


class BlogPost(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    excerpt = models.TextField(blank=True)
    content_html = models.TextField(
        blank=True,
        help_text="Trusted HTML only. You can include images, links, and headings here.",
    )
    featured_image = models.ImageField(upload_to="blog_posts/", blank=True, null=True)
    image_alt = models.CharField(max_length=255, blank=True)
    published_at = models.DateTimeField(default=timezone.now, db_index=True)
    is_published = models.BooleanField(default=True, db_index=True)
    sort_order = models.PositiveIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-published_at", "-created_at", "-id"]
        verbose_name = "Blog Post"
        verbose_name_plural = "Blog Posts"

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:240] or "blog-post"
            generated_slug = base_slug
            counter = 2
            while BlogPost.objects.exclude(pk=self.pk).filter(slug=generated_slug).exists():
                suffix = f"-{counter}"
                generated_slug = f"{base_slug[:240 - len(suffix)]}{suffix}"
                counter += 1
            self.slug = generated_slug
        super().save(*args, **kwargs)


class BlogPostImage(models.Model):
    blog_post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="blog_posts/")
    alt_text = models.CharField(max_length=255, blank=True)
    order = models.PositiveIntegerField(default=0, db_index=True)
    show_in_gallery = models.BooleanField(default=False, help_text="Check to display this image at the bottom of the blog post.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "created_at"]
        verbose_name = "Blog Post Image"
        verbose_name_plural = "Blog Post Images"

    def __str__(self):
        return f"{self.blog_post.title} - {self.order}"
