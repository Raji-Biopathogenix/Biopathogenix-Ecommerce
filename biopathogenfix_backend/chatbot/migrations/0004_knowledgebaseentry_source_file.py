from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chatbot", "0003_alter_knowledgebaseentry_doc_type"),
    ]

    operations = [
        migrations.AddField(
            model_name="knowledgebaseentry",
            name="source_file",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
