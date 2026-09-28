from decimal import Decimal

from django.db import migrations


def mark_refunded(apps, schema_editor):
    """Orders whose items were all cancelled and fully refunded one by one are refunded, not cancelled."""
    Order = apps.get_model('order', 'Order')
    for order in Order.objects.filter(status='cancelled', item_cancellations__isnull=False).distinct():
        if order.items.filter(is_cancelled=False).exists():
            continue
        confirmed = sum((op.amount for op in order.item_cancellations.all()
                         if op.refund_status in ('issued', 'succeeded')), Decimal('0'))
        if confirmed.quantize(Decimal('0.01')) == order.amount.quantize(Decimal('0.01')):
            Order.objects.filter(pk=order.pk).update(status='refunded')


class Migration(migrations.Migration):

    dependencies = [
        ('order', '0035_item_cancellation_ledger'),
    ]

    operations = [
        migrations.RunPython(mark_refunded, migrations.RunPython.noop),
    ]
