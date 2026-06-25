from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0012_discountproducts"),
    ]

    operations = [
        migrations.AddField(
            model_name="landingpagecontext",
            name="download_file",
            field=models.FileField(blank=True, upload_to="landing_page_downloads/"),
        ),
    ]
