import logging

from celery import shared_task
from django.db import transaction

logger = logging.getLogger(__name__)


@shared_task(name='payments.retry_pending_qb_payments')
def retry_pending_qb_payments():
    from order.models import Order
    from .qb_payment_sync import sync_order_payment
    from .utils import get_valid_qb_token

    order_ids = list(Order.objects.filter(qb_payment_sync_pending=True)
                     .order_by('id').values_list('id', flat=True))
    if not order_ids:
        return 0
    token = get_valid_qb_token()
    synced = 0
    for order_id in order_ids:
        try:
            with transaction.atomic():
                order = Order.objects.select_for_update().get(pk=order_id)
                if order.qb_payment_sync_pending:
                    sync_order_payment(order, token)
                    synced += 1
        except Exception:
            # Keep the pending flag for the next scheduled attempt; do not
            # expose provider responses/card details in task logs.
            logger.warning('QuickBooks payment sync pending for order %s', order_id)
    return synced
