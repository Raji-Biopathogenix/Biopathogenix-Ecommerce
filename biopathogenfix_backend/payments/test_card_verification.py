from types import SimpleNamespace
from unittest.mock import Mock, patch

import requests
from django.test import SimpleTestCase

from payments import utils, qb_cards
from payments.card_verification import (
    CardVerificationRejected, PaymentReviewRequired, verification_error,
)


class CardVerificationTests(SimpleTestCase):
    def setUp(self):
        self.config = SimpleNamespace(realm_id='company', environment='sandbox')
        self.charge = {'status': 'CAPTURED', 'id': 'charge-1', 'avsStreet': 'Pass',
                       'avsZip': 'Pass', 'cardSecurityCodeMatch': 'Pass'}
        self.billing = {'line1': '100 Main St', 'postal_code': '40517',
                        'city': 'Lexington', 'state_code': 'KY'}
        self.card = {'card_name': 'Test', 'card_number': '4111111111111111',
                     'card_exp_month': '12', 'card_exp_year': '2099', 'card_cvv': '123'}

    def response(self, data):
        return Mock(status_code=200, json=lambda: data)

    def test_independent_street_zip_and_cvv_results_are_required(self):
        self.assertIsNone(verification_error(self.charge))
        for field in ('avsStreet', 'avsZip', 'cardSecurityCodeMatch'):
            for value in ('Fail', 'NotAvailable', None, '', 'unknown', 'Y', 'N'):
                with self.subTest(field=field, value=value):
                    self.assertIsNotNone(verification_error({**self.charge, field: value}))

    def test_nested_fields_do_not_override_top_level_failure(self):
        charge = {**self.charge, 'avsZip': 'Fail', 'card': {'avsZip': 'Pass'}}
        self.assertIn('ZIP', verification_error(charge))
        charge = {'card': self.charge, 'avsDetail': self.charge}
        self.assertIsNotNone(verification_error(charge))

    def test_saved_card_cvv_unavailable_allowed_but_not_failure_or_unknown(self):
        for value in ('NotAvailable', None, ''):
            self.assertIsNone(verification_error({**self.charge, 'cardSecurityCodeMatch': value}, saved_card=True))
        for value in ('Fail', 'unknown'):
            self.assertIsNotNone(verification_error({**self.charge, 'cardSecurityCodeMatch': value}, saved_card=True))
        self.assertIsNotNone(verification_error({**self.charge, 'avsStreet': 'NotAvailable'}, saved_card=True))

    @patch('payments.utils._void_charge')
    @patch('payments.utils.requests.post')
    @patch('payments.utils.QBConfig.get')
    def test_verified_new_card_accepts_and_sends_selected_billing_address(self, config, post, void):
        config.return_value = self.config
        post.return_value = self.response(self.charge)
        self.assertEqual(utils.charge_card('token', self.card, 20, 'key', self.billing)['id'], 'charge-1')
        address = post.call_args.kwargs['json']['card']['address']
        self.assertEqual(address['streetAddress'], '100 Main St')
        self.assertEqual(address['postalCode'], '40517')
        void.assert_not_called()

    @patch('payments.utils._void_charge', return_value=True)
    @patch('payments.utils.requests.post')
    @patch('payments.utils.QBConfig.get')
    def test_mismatch_is_rejected_only_after_confirmed_reversal(self, config, post, void):
        config.return_value = self.config
        post.return_value = self.response({**self.charge, 'avsZip': 'Fail'})
        with self.assertRaises(CardVerificationRejected):
            utils.charge_card('token', self.card, 20, 'key', self.billing)
        request_id = post.call_args.kwargs['headers']['Request-Id']
        void.assert_called_once_with('token', 'charge-1', request_id)

    @patch('payments.utils._void_charge', return_value=False)
    @patch('payments.utils.requests.post')
    @patch('payments.utils.QBConfig.get')
    def test_unconfirmed_reversal_requires_review(self, config, post, void):
        config.return_value = self.config
        post.return_value = self.response({**self.charge, 'avsStreet': 'Fail'})
        with self.assertRaises(PaymentReviewRequired) as caught:
            utils.charge_card('token', self.card, 20, 'key', self.billing)
        self.assertEqual(caught.exception.transaction_id, 'charge-1')

    @patch('payments.utils.requests.post')
    @patch('payments.utils.QBConfig.get')
    def test_captured_response_without_charge_id_cannot_create_an_order(self, config, post):
        config.return_value = self.config
        post.return_value = self.response({**self.charge, 'id': None})
        with self.assertRaises(PaymentReviewRequired):
            utils.charge_card('token', self.card, 20, 'key', self.billing)

    @patch('payments.utils.QBConfig.get', side_effect=Exception('configuration unavailable'))
    def test_void_configuration_failure_is_unconfirmed(self, config):
        self.assertFalse(utils._void_charge('token', 'charge-1', 'request'))

    @patch('payments.utils.requests.post')
    @patch('payments.utils.QBConfig.get')
    def test_void_uses_original_request_id_and_stable_reversal_key(self, config, post):
        config.return_value = self.config
        post.return_value = self.response({'id': 'void-1', 'status': 'ISSUED', 'type': 'VOID'})
        self.assertTrue(utils._void_charge('token', 'charge-1', 'original-request'))
        first_id = post.call_args.kwargs['headers']['Request-Id']
        self.assertTrue(post.call_args.args[0].endswith('/txn-requests/original-request/void'))
        self.assertTrue(utils._void_charge('token', 'charge-1', 'original-request'))
        self.assertEqual(post.call_args.kwargs['headers']['Request-Id'], first_id)

    @patch('payments.utils.requests.post')
    @patch('payments.utils.QBConfig.get')
    def test_http_success_without_confirmed_void_is_not_enough(self, config, post):
        config.return_value = self.config
        for data in ({}, {'status': 'ISSUED'}, {'id': 'void-1', 'type': 'VOID', 'status': 'DECLINED'},
                     {'id': 'void-1', 'type': 'REFUND', 'status': 'ISSUED'}):
            with self.subTest(data=data):
                post.return_value = self.response(data)
                self.assertFalse(utils._void_charge('token', 'charge-1', 'request'))
        post.side_effect = requests.Timeout()
        self.assertFalse(utils._void_charge('token', 'charge-1', 'request'))

    @patch('payments.qb_cards._request')
    def test_saved_card_checkout_address_matches_vault_without_exposing_it(self, request):
        request.return_value = {'id': 'card-1', 'expMonth': '12', 'expYear': '2099',
            'address': {'streetAddress': '100 Main St.', 'postalCode': '40517', 'country': 'US'}}
        result = qb_cards.get_owned_card(SimpleNamespace(), 'card-1', 'token', billing_address=self.billing)
        self.assertEqual(result['id'], 'card-1')
        self.assertNotIn('address', result)

    @patch('payments.qb_cards._request')
    def test_saved_card_missing_or_different_address_is_rejected_before_charging(self, request):
        for address in ({}, {'streetAddress': 'Wrong Street', 'postalCode': '40517'},
                        {'streetAddress': '100 Main St', 'postalCode': '89119'}):
            with self.subTest(address=address):
                request.return_value = {'id': 'card-1', 'expMonth': '12', 'expYear': '2099', 'address': address}
                with self.assertRaises(ValueError):
                    qb_cards.get_owned_card(SimpleNamespace(), 'card-1', 'token', billing_address=self.billing)

    def test_unconfirmed_reversal_never_creates_order_or_offers_retry(self):
        from order import views
        user = SimpleNamespace(id=1, email='test@example.test')
        with patch.object(views, 'get_valid_qb_token', return_value='token'), \
             patch.object(views, 'charge_card', side_effect=PaymentReviewRequired('charge-1')), \
             patch.object(views, 'notify_admin_critical') as alert, \
             patch.object(views, '_create_order') as create:
            result = views._handle_card_payment(None, {'shipping': {}}, user, 20, 'key', [])
            self.assertEqual(result.status_code, 503)
            self.assertFalse(result.data['retry'])
            self.assertNotIn('reset_payment_attempt', result.data)
            self.assertEqual(result.data['transaction_id'], 'charge-1')
            create.assert_not_called()
            alert.assert_called_once()

    def test_confirmed_reversal_allows_corrected_fresh_attempt_without_order(self):
        from order import views
        with patch.object(views, 'get_valid_qb_token', return_value='token'), \
             patch.object(views, 'charge_card', side_effect=CardVerificationRejected('ZIP mismatch')), \
             patch.object(views, '_create_order') as create:
            result = views._handle_card_payment(None, {'shipping': {}}, SimpleNamespace(), 20, 'key', [])
            self.assertEqual(result.status_code, 402)
            self.assertTrue(result.data['reset_payment_attempt'])
            create.assert_not_called()

    def test_saved_card_checkout_passes_the_selected_billing_address_to_ownership_check(self):
        from order import views
        with patch.object(views, 'get_valid_qb_token', return_value='token'), \
             patch.object(views, 'get_owned_card', side_effect=ValueError('Address mismatch')) as own, \
             patch.object(views, 'charge_card') as charge:
            result = views._handle_card_payment(None,
                {'shipping': {}, 'billing': {'address_line1': '100 Main St', 'postal_code': '40517'},
                 'useSameAddress': False, 'saved_payment_method_id': 'card-1'}, SimpleNamespace(), 20, 'key', [])
            self.assertEqual(result.status_code, 402)
            self.assertEqual(own.call_args.kwargs['billing_address']['line1'], '100 Main St')
            charge.assert_not_called()
