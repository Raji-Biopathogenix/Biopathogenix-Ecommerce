from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TaxConfig",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("provider", models.CharField(choices=[("taxjar", "TaxJar"), ("fallback", "Fallback Table")], default="taxjar", max_length=20)),
                ("enabled", models.BooleanField(default=True)),
                ("api_key", models.CharField(blank=True, help_text="Tax provider API key", max_length=255)),
                ("use_sandbox", models.BooleanField(default=True)),
                ("nexus_country", models.CharField(default="US", max_length=10)),
                ("nexus_zip", models.CharField(default="40356", max_length=20)),
                ("nexus_state", models.CharField(default="KY", max_length=10)),
                ("nexus_city", models.CharField(default="Nicholasville", max_length=100)),
                ("nexus_street", models.CharField(default="120 Dewey Drive", max_length=255)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "verbose_name": "Tax Config",
                "verbose_name_plural": "Tax Config",
            },
        ),
    ]

