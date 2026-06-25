from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chatbot", "0004_knowledgebaseentry_source_file"),
    ]

    operations = [
        migrations.AlterField(
            model_name="knowledgebaseentry",
            name="doc_type",
            field=models.CharField(
                choices=[
                    ("products", "Products"),
                    ("company", "About Company"),
                    ("faq", "FAQ"),
                    ("policies", "Policies"),
                    ("service", "Services"),
                    ("quality_control", "Quality Control"),
                    ("resources", "Resources"),
                    ("other", "Other"),
                ],
                default="other",
                help_text="Category of this knowledge base entry.",
                max_length=100,
            ),
        ),
    ]
