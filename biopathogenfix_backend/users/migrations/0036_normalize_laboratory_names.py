import hashlib
import unicodedata

from django.db import migrations, models


def merge_laboratories(apps, schema_editor):
    database = schema_editor.connection.alias
    Lab = apps.get_model("users", "Laboratory")
    User = apps.get_model("users", "CustomUser")
    Price = apps.get_model("users", "CustomizableProductprices")
    labs = Lab.objects.using(database)
    prices = Price.objects.using(database)
    groups = {}
    for lab in labs.order_by("pk"):
        normalized = "".join(unicodedata.normalize("NFKC", lab.name).casefold().split())
        key = hashlib.sha256(normalized.encode("utf-8")).hexdigest()
        groups.setdefault(key, []).append(lab)

    # Do not silently change negotiated pricing while combining companies.
    for members in groups.values():
        seen = {}
        for product_id, price in prices.filter(laboratory_id__in=[lab.pk for lab in members]).values_list("product_id", "price"):
            if product_id in seen and seen[product_id] != price:
                raise RuntimeError(
                    f"Duplicate laboratories {[lab.pk for lab in members]} have conflicting prices "
                    f"for product {product_id}. Resolve those prices before rerunning this migration."
                )
            seen[product_id] = price

    for key, members in groups.items():
        canonical = members[0]
        for duplicate in members[1:]:
            User.objects.using(database).filter(laboratory_id=duplicate.pk).update(laboratory_id=canonical.pk)
            for price in prices.filter(laboratory_id=duplicate.pk):
                if prices.filter(laboratory_id=canonical.pk, product_id=price.product_id).exists():
                    price.delete(using=database)
                else:
                    prices.filter(pk=price.pk).update(laboratory_id=canonical.pk)
            labs.filter(pk=duplicate.pk).delete()
        labs.filter(pk=canonical.pk).update(name=" ".join(canonical.name.split()), name_key=key)


class Migration(migrations.Migration):
    atomic = False
    dependencies = [("users", "0035_repair_laboratory_foreign_key")]
    operations = [
        migrations.AddField(
            model_name="laboratory", name="name_key",
            field=models.CharField(max_length=64, null=True, editable=False),
        ),
        migrations.RunPython(merge_laboratories, reverse_code=migrations.RunPython.noop, atomic=True),
        migrations.AlterField(
            model_name="laboratory", name="name_key",
            field=models.CharField(max_length=64, unique=True, editable=False),
        ),
    ]
