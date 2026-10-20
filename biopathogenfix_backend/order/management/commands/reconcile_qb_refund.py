import json

from django.core.management.base import BaseCommand, CommandError
from order.models import OrderRefund
from order.whole_refunds import process, recover, summary


class Command(BaseCommand):
    help = 'Inspect or recover a saved whole-order refund; never submit another provider refund.'

    def add_arguments(self, parser):
        parser.add_argument('refund_operation_id', type=int)
        parser.add_argument('--provider-refund-id', default='')
        parser.add_argument('--retry-accounting', action='store_true')

    def handle(self, *args, **options):
        try:
            refund = OrderRefund.objects.get(pk=options['refund_operation_id'])
            if options['provider_refund_id']:
                refund = recover(refund.pk, options['provider_refund_id'])
            if options['retry_accounting']:
                if refund.state not in ('provider_pending', 'accounting_pending', 'complete'):
                    raise CommandError('Verify the provider refund ID before retrying accounting.')
                refund = process(refund.pk)
            self.stdout.write(json.dumps(summary(refund), indent=2))
        except (OrderRefund.DoesNotExist, ValueError) as exc:
            raise CommandError(str(exc)) from exc
