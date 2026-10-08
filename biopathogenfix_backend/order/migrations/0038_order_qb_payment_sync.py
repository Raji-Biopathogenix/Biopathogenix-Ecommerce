from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('order', '0037_orderitem_sku')]
    operations = [
        migrations.AddField(model_name='order', name='qb_payment_id',
            field=models.CharField(max_length=100, blank=True, default='')),
        # Existing payments may already be deposited or manually recorded.
        # Do not automatically rewrite their accounting history.
        migrations.AddField(model_name='order', name='qb_payment_sync_pending',
            field=models.BooleanField(default=False, db_index=True)),
    ]
