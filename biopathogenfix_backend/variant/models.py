from django.db import models

from category.models import Category


class Variant(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="variants",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.name}"


class VariantOption(models.Model):
    variant = models.ForeignKey(Variant, on_delete=models.CASCADE, related_name="options")
    value = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["order"]
        constraints = [
            models.UniqueConstraint(fields=["variant", "value"], name="unique_variant_option")
        ]

    def __str__(self):
        return f"{self.variant.name} -> {self.value}"
