from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("product", "0032_productrelatedinfo"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="productrelatedinfo",
            options={
                "ordering": ["sort_order", "id"],
                "verbose_name": "Related Information",
                "verbose_name_plural": "Related Information",
            },
        ),
    ]
