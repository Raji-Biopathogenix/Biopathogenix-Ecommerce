import json

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from order.models import Order
from payments.models import QBConfig
from payments.qb_payment_sync import inspect_order_accounting, sync_order_payment
from payments.utils import get_valid_qb_token, get_qb_accounting_base_url


class Command(BaseCommand):
    help = 'Inspect an order payment and linked deposits; optionally resume accounting without charging a card.'

    def add_arguments(self, parser):
        parser.add_argument('order_id', type=int)
        parser.add_argument('--resume', action='store_true',
                            help='Retry pending accounting or repair a historical payment with an existing invoice link.')

    def handle(self, *args, **options):
        config = QBConfig.get()
        token = get_valid_qb_token()
        failure = None
        try:
            with transaction.atomic():
                order = Order.objects.select_for_update().get(pk=options['order_id'])
                if options['resume']:
                    if not order.qb_payment_sync_pending:
                        if not order.qb_invoice_id or not order.qb_customer_id or not order.qb_realm_id:
                            raise CommandError('Historical order has no verified invoice/customer link. Review existing QuickBooks records first.')
                        # Explicit recovery only. The provider charge, invoice,
                        # amount and any existing Payment are verified by sync.
                        # Do not enroll historical orders in automatic retries.
                        order.qb_payment_sync_pending = True
                    try:
                        sync_order_payment(order, token)
                    except Exception as exc:
                        # Commit any invoice linkage obtained before failure.
                        failure = exc
                else:
                    report = inspect_order_accounting(order, token, config.realm_id,
                                                      get_qb_accounting_base_url(config))
                    self.stdout.write(json.dumps(report, indent=2))
            if failure:
                raise CommandError('Accounting remains pending; check provider connectivity and existing records.') from failure
            if options['resume']:
                self.stdout.write(self.style.SUCCESS('Invoice/payment synchronization complete. Run without --resume to inspect deposit linkage.'))
        except Order.DoesNotExist as exc:
            raise CommandError('Order not found.') from exc
        except ValueError as exc:
            raise CommandError(str(exc)) from exc
