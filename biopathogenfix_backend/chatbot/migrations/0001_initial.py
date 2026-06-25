from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="KnowledgeBaseEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                (
                    "doc_type",
                    models.CharField(
                        default="other",
                        help_text="Examples: products, company, faq, policies.",
                        max_length=100,
                    ),
                ),
                ("content", models.TextField(help_text="Markdown/plain text content for RAG ingestion.")),
                (
                    "access",
                    models.CharField(
                        choices=[("public", "Public"), ("private", "Private")],
                        default="public",
                        max_length=10,
                    ),
                ),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "verbose_name": "Knowledge Base Entry",
                "verbose_name_plural": "Knowledge Base Entries",
                "ordering": ["sort_order", "id"],
                "indexes": [models.Index(fields=["is_active", "doc_type", "sort_order"], name="chatbot_kno_is_acti_31745a_idx")],
            },
        ),
    ]
