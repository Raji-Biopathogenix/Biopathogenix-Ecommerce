from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("order", "0033_orderitem_discount_value")]
    operations = [
        migrations.AddField(
            model_name="order", name=name,
            field=models.CharField(max_length=100, blank=True, default=""),
        )
        for name in ("qb_invoice_id", "qb_realm_id", "qb_customer_id")
    ]
