from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase

from .utils import get_qb_company_name, get_or_create_qb_customer, create_qb_invoice


class CompanyCustomerTests(SimpleTestCase):
    def setUp(self):
        self.user = SimpleNamespace(
            laboratory=SimpleNamespace(name=' Example Lab '), Company_name='Old company',
            quickbook_customer_id='personal-id', save=Mock(),
        )
        self.order = SimpleNamespace(
            id=90, user=self.user, shipping_email='member@example.com', shipping_phone='555-0100',
            billing_address_line1='123 Main St', billing_city='Lexington',
            billing_state='Kentucky', billing_postal_code='40517',
        )

    def test_lab_name_takes_priority_with_company_and_personal_fallbacks(self):
        self.assertEqual(get_qb_company_name(self.user), 'Example Lab')
        self.user.laboratory = None
        self.assertEqual(get_qb_company_name(self.user), 'Old company')
        self.user.Company_name = None
        self.assertEqual(get_qb_company_name(self.user), '')

    @patch('payments.utils.requests.post')
    @patch('payments.utils.requests.get')
    def test_new_lab_customer_uses_company_name_for_both_fields(self, get, post):
        get.return_value = Mock(json=lambda: {'QueryResponse': {}})
        post.return_value = Mock(json=lambda: {'Customer': {'Id': 'lab-id'}})
        self.assertEqual(get_or_create_qb_customer('t', 'r', 'url', self.order), 'lab-id')
        payload = post.call_args.kwargs['json']
        self.assertEqual(payload['CompanyName'], 'Example Lab')
        self.assertEqual(payload['DisplayName'], 'Example Lab')
        self.assertIn("CompanyName = 'Example Lab'", get.call_args.kwargs['params']['query'])

    @patch('payments.utils.requests.post')
    @patch('payments.utils.requests.get')
    def test_existing_company_customer_display_name_is_updated(self, get, post):
        get.return_value = Mock(json=lambda: {'QueryResponse': {'Customer': [
            {'Id': 'lab-id', 'SyncToken': '3', 'CompanyName': 'Example Lab',
             'DisplayName': 'Individual member', 'Active': True},
        ]}})
        post.return_value = Mock(json=lambda: {'Customer': {'Id': 'lab-id'}})
        self.assertEqual(get_or_create_qb_customer('t', 'r', 'url', self.order), 'lab-id')
        self.assertEqual(post.call_args.kwargs['json'], {
            'Id': 'lab-id', 'SyncToken': '3', 'sparse': True,
            'CompanyName': 'Example Lab', 'DisplayName': 'Example Lab',
        })

    @patch('payments.utils.requests.post')
    @patch('payments.utils.requests.get')
    def test_lab_members_reuse_existing_company_customer(self, get, post):
        get.return_value = Mock(json=lambda: {'QueryResponse': {'Customer': [
            {'Id': 'lab-id', 'CompanyName': 'Example Lab',
             'DisplayName': 'Example Lab', 'Active': True},
        ]}})
        for email in ('first@example.com', 'second@example.com'):
            self.order.shipping_email = email
            self.assertEqual(get_or_create_qb_customer('t', 'r', 'url', self.order), 'lab-id')
        post.assert_not_called()

    @patch('payments.utils.requests.post')
    @patch('payments.utils.requests.get')
    def test_company_lookup_failure_does_not_create_duplicate_customer(self, get, post):
        get.return_value.raise_for_status.side_effect = RuntimeError('lookup failed')
        with self.assertRaises(RuntimeError):
            get_or_create_qb_customer('t', 'r', 'url', self.order)
        post.assert_not_called()

    @patch('payments.utils.get_or_create_qb_item', side_effect=RuntimeError('stop after customer resolution'))
    @patch('payments.utils.is_qb_customer_active')
    @patch('payments.utils.get_or_create_qb_customer', return_value='lab-id')
    @patch('payments.utils.QBConfig.get')
    def test_invoice_replaces_cached_personal_customer_with_lab_customer(self, config, resolve, active, item):
        config.return_value = SimpleNamespace(realm_id='realm', environment='sandbox')
        with self.assertRaisesMessage(RuntimeError, 'stop after customer resolution'):
            create_qb_invoice('t', self.order, [], 'invoice', self.user)
        resolve.assert_called_once()
        active.assert_not_called()
        self.assertEqual(self.user.quickbook_customer_id, 'lab-id')
        self.user.save.assert_called_once_with(update_fields=['quickbook_customer_id'])
