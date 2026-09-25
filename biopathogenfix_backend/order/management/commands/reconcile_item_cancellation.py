from django.core.management.base import BaseCommand, CommandError
from order.models import ItemCancellation
from order.item_cancellations import reconcile_existing, process, notify_customer


class Command(BaseCommand):
    help = 'Inspect an item cancellation, or verify existing provider records and resume its accounting step.'

    def add_arguments(self, parser):
        parser.add_argument('operation_id', type=int)
        parser.add_argument('--refund-id', default='')
        parser.add_argument('--receipt-id', default='')
        parser.add_argument('--resume', action='store_true')

    def handle(self, *args, **options):
        try:
            op = ItemCancellation.objects.select_related('order', 'item').get(pk=options['operation_id'])
            if options['resume']:
                if op.state == 'ready':
                    raise CommandError('Confirm this cancellation through the admin item dialog first.')
                op = reconcile_existing(op, options['refund_id'], options['receipt_id'])
                op = process(op)
                notify_customer(op)
            self.stdout.write(f'Cancellation {op.pk}: state={op.state}, amount=${op.amount}, '
                              f'refund={op.refund_id or "unconfirmed"}, receipt/invoice={op.accounting_id or "unconfirmed"}')
            if op.error:
                self.stdout.write(op.error)
        except (ItemCancellation.DoesNotExist, ValueError) as exc:
            raise CommandError(str(exc)) from exc
