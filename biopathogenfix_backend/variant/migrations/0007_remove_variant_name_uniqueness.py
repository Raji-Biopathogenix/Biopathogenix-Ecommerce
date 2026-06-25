from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("variant", "0006_variant_is_active_variantoption_is_active"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="variant",
            name="unique_variant_per_category",
        ),
        migrations.RemoveConstraint(
            model_name="variant",
            name="unique_variant_no_category",
        ),
    ]
