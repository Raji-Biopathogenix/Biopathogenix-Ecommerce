import re

from django.db import models


def normalize_lookup_text(value: str) -> str:
    cleaned = (value or "").replace("\xa0", " ").lower()
    cleaned = re.sub(r"[^a-z0-9]+", " ", cleaned)
    return re.sub(r"\s+", " ", cleaned).strip()


class KnowledgeBaseEntry(models.Model):
    ACCESS_PUBLIC = "public"
    ACCESS_PRIVATE = "private"
    ACCESS_CHOICES = [
        (ACCESS_PUBLIC, "Public"),
        (ACCESS_PRIVATE, "Private"),
    ]

    title = models.CharField(max_length=255)
    DOC_TYPE_CHOICES = [
        ("products", "Products"),
        ("company", "About Company"),
        ("faq", "FAQ"),
        ("policies", "Policies"),
        ("service", "Services"),
        ("quality_control", "Quality Control"),
        ("resources", "Resources"),
        ("other", "Other"),
    ]

    doc_type = models.CharField(
        max_length=100,
        default="other",
        choices=DOC_TYPE_CHOICES,
        help_text="Category of this knowledge base entry.",
    )
    source_file = models.CharField(max_length=255, blank=True, default="")
    content = models.TextField(help_text="Markdown/plain text content for RAG ingestion.")
    access = models.CharField(max_length=10, choices=ACCESS_CHOICES, default=ACCESS_PUBLIC)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "Knowledge Base Entry"
        verbose_name_plural = "Knowledge Base Entries"
        indexes = [
            models.Index(fields=["is_active", "doc_type", "sort_order"]),
        ]

    def __str__(self) -> str:
        return self.title


class PathogenPanelLookup(models.Model):
    pathogen_target = models.CharField(max_length=255, unique=True)
    normalized_name = models.CharField(max_length=255, unique=True, db_index=True)
    panel_count = models.PositiveIntegerField(default=0)
    panels = models.JSONField(default=list, blank=True)
    source_sheet = models.CharField(max_length=100, default="Pathogen Panel Lookup")
    source_row = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["pathogen_target"]
        verbose_name = "Pathogen Panel Lookup"
        verbose_name_plural = "Pathogen Panel Lookup"
        indexes = [
            models.Index(fields=["is_active", "normalized_name"]),
        ]

    def save(self, *args, **kwargs):
        self.pathogen_target = (self.pathogen_target or "").replace("\xa0", " ").strip()
        self.normalized_name = normalize_lookup_text(self.pathogen_target)
        self.panels = [str(panel).strip() for panel in (self.panels or []) if str(panel).strip()]
        self.panel_count = len(self.panels)
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return self.pathogen_target
