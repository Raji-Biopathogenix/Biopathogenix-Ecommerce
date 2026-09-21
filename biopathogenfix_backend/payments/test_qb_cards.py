import uuid
from types import SimpleNamespace
from unittest.mock import Mock, patch

from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from payments import qb_cards, utils
from payments.validators import validate_checkout_payload


class SavedCardTests(SimpleTestCase):
    def setUp(self):
        self.user = SimpleNamespace(uid=uuid.uuid4(), id=1, pk=1, is_authenticated=True)
        self.config = SimpleNamespace(realm_id='company', environment='sandbox')
        self.card = {'id': 'card-1', 'cardType': 'Visa', 'number': 'xxxxxxxxxxxx1111',
            'expMonth': '12', 'expYear': '2099', 'name': 'Test customer', 'cvc': 'hidden'}
        self.data = {'save_payment_method': True, 'card_name': 'Test customer',
            'card_number': '4111111111111111', 'card_exp_month': '12', 'card_exp_year': '2099',
            'card_cvv': '123'}

    def test_wallet_is_stable_and_isolated_by_user_company_and_environment(self):
        original = qb_cards.wallet_id(self.user, self.config)
        self.assertEqual(original, qb_cards.wallet_id(self.user, self.config))
        self.assertNotEqual(original, qb_cards.wallet_id(SimpleNamespace(uid=uuid.uuid4()), self.config))
        self.assertNotEqual(original, qb_cards.wallet_id(self.user, SimpleNamespace(realm_id='other', environment='sandbox')))
        self.assertNotEqual(original, qb_cards.wallet_id(self.user, SimpleNamespace(realm_id='company', environment='production')))

    def test_save_requires_explicit_consent(self):
        for consent in (False, None, 'true'):
            with self.subTest(consent=consent), patch.object(qb_cards, '_request') as send:
                with self.assertRaises(ValueError):
                    qb_cards.save_card(self.user, dict(self.data, save_payment_method=consent), {})
                send.assert_not_called()

    def test_save_excludes_cvv_and_returns_only_summary(self):
        with patch.object(qb_cards, '_request', return_value=self.card) as send:
            result = qb_cards.save_card(self.user, self.data, {'postal_code': '40517'}, token='test', request_key='checkout-key')
            first_id = send.call_args.kwargs['request_id']
            self.assertNotIn('cvc', send.call_args.kwargs['payload'])
            self.assertEqual(result['last4'], '1111')
            self.assertNotIn('number', result)
            self.assertNotIn('cvc', result)
            qb_cards.save_card(self.user, self.data, {'postal_code': '40517'}, token='test', request_key='checkout-key')
            self.assertEqual(first_id, send.call_args.kwargs['request_id'])

    def test_other_users_or_expired_cards_are_rejected(self):
        for card in (None, dict(self.card, id='someone-elses-card'), dict(self.card, expYear='2000')):
            with self.subTest(card=card), patch.object(qb_cards, '_request', return_value=card):
                with self.assertRaises(ValueError):
                    qb_cards.get_owned_card(self.user, 'card-1', 'token')

    def test_saved_card_lookup_is_scoped_to_authenticated_wallet(self):
        with patch.object(qb_cards.QBConfig, 'get', return_value=self.config), \
             patch.object(qb_cards.requests, 'request', return_value=Mock(ok=True, status_code=200, json=lambda: self.card)) as send:
            result = qb_cards.get_owned_card(self.user, 'card-1', 'token')
            self.assertEqual(result['id'], 'card-1')
            self.assertIn(f'/customers/{qb_cards.wallet_id(self.user, self.config)}/cards/card-1', send.call_args.args[1])

    def test_provider_failure_is_not_reported_as_empty_list(self):
        with patch.object(qb_cards.QBConfig, 'get', return_value=self.config), \
             patch.object(qb_cards.requests, 'request', return_value=Mock(ok=False, status_code=500)):
            with self.assertRaises(ValueError):
                qb_cards._request(self.user, 'GET', token='token')

    def test_api_requires_login_and_returns_masked_list(self):
        factory = APIRequestFactory()
        self.assertIn(qb_cards.payment_methods(factory.get('/')).status_code, (401, 403))
        request = factory.get('/')
        force_authenticate(request, self.user)
        with patch.object(qb_cards, '_request', return_value=[self.card]):
            response = qb_cards.payment_methods(request)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['result']['data'][0]['last4'], '1111')
        self.assertNotIn('cvc', response.data['result']['data'][0])
        self.assertEqual(response['Cache-Control'], 'private, no-store')

    def test_saved_charge_uses_card_reference_not_raw_card(self):
        captured = {'status': 'CAPTURED', 'id': 'charge-1', 'card': {}}
        with patch.object(utils.QBConfig, 'get', return_value=self.config), \
             patch.object(utils.requests, 'post', return_value=Mock(status_code=200, json=lambda: captured)) as send:
            utils.charge_card('token', {}, 20, 'retry-key', {}, saved_card_id='card-1')
            first_id = send.call_args.kwargs['headers']['Request-Id']
            payload = send.call_args.kwargs['json']
            self.assertEqual(payload['cardOnFile'], 'card-1')
            self.assertNotIn('card', payload)
            utils.charge_card('token', {}, 20, 'retry-key', {}, saved_card_id='card-1')
            self.assertEqual(first_id, send.call_args.kwargs['headers']['Request-Id'])

    def test_new_card_charge_still_uses_card_details(self):
        with patch.object(utils.QBConfig, 'get', return_value=self.config), \
             patch.object(utils.requests, 'post', return_value=Mock(status_code=200, json=lambda: {'status': 'CAPTURED'})) as send:
            utils.charge_card('token', self.data, 20, 'new-key', {})
            self.assertEqual(send.call_args.kwargs['json']['card']['cvc'], '123')
            self.assertNotIn('cardOnFile', send.call_args.kwargs['json'])

    def test_validation_allows_saved_card_without_raw_fields(self):
        data = {'shipping': dict(first_name='Test', last_name='User', email='test@example.com',
            address_line1='Test', city='Test', state='KY', postal_code='40517', country='US'),
            'useSameAddress': True, 'amount': 20, 'idempotency_key': 'key',
            'payment_method': 'card', 'saved_payment_method_id': 'card-1'}
        validate_checkout_payload(data)
        del data['saved_payment_method_id']
        from rest_framework.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            validate_checkout_payload(data)

    def test_checkout_never_charges_unowned_card(self):
        from order import views
        data = {'saved_payment_method_id': 'other-card', 'shipping': {}}
        with patch.object(views, 'get_valid_qb_token', return_value='token'), \
             patch.object(views, 'get_owned_card', side_effect=ValueError('Card unavailable')), \
             patch.object(views, 'charge_card') as charge, patch.object(views, '_create_order') as create:
            result = views._handle_card_payment(None, data, self.user, 20, 'key', [])
            self.assertEqual(result.status_code, 402)
            charge.assert_not_called()
            create.assert_not_called()

    def test_checkout_uses_verified_saved_card_and_does_not_save_again(self):
        from order import views
        data = {'saved_payment_method_id': 'card-1', 'save_payment_method': True, 'shipping': {}}
        with patch.object(views, 'get_valid_qb_token', return_value='token'), \
             patch.object(views, 'get_owned_card', return_value=qb_cards.card_summary(self.card)), \
             patch.object(views, 'charge_card', return_value={'id': 'charge-1', 'card': {}}) as charge, \
             patch.object(views, 'save_card') as save, patch.object(views, '_create_order') as create:
            views._handle_card_payment(None, data, self.user, 20, 'key', [])
            self.assertEqual(charge.call_args.kwargs['saved_card_id'], 'card-1')
            save.assert_not_called()
            create.assert_called_once()

    def test_checkout_saves_new_card_only_with_explicit_consent(self):
        from order import views
        for consent in (True, False):
            with self.subTest(consent=consent), \
                 patch.object(views, 'get_valid_qb_token', return_value='token'), \
                 patch.object(views, 'save_card') as save, \
                 patch.object(views, 'charge_card', return_value={'id': 'charge-1', 'card': {}}) as charge, \
                 patch.object(views, '_create_order'):
                views._handle_card_payment(None, dict(self.data, save_payment_method=consent, shipping={}), self.user, 20, 'key', [])
                self.assertEqual(save.call_count, int(consent))
                charge.assert_called_once()

    def test_save_failure_does_not_charge_customer(self):
        from order import views
        with patch.object(views, 'get_valid_qb_token', return_value='token'), \
             patch.object(views, 'save_card', side_effect=ValueError('Unable to save card')), \
             patch.object(views, 'charge_card') as charge:
            result = views._handle_card_payment(None, dict(self.data, shipping={}), self.user, 20, 'key', [])
            self.assertEqual(result.status_code, 402)
            charge.assert_not_called()

    def delete_request(self, card_id='card-1'):
        request = APIRequestFactory().delete('/', {'payment_method_id': card_id}, format='json')
        force_authenticate(request, self.user)
        return request

    def test_remove_own_expired_card(self):
        expired = dict(self.card, expYear='2000')
        with patch.object(qb_cards, 'get_valid_qb_token', return_value='token'), \
             patch.object(qb_cards, '_request', side_effect=[expired, None]) as send:
            response = qb_cards.payment_methods(self.delete_request())
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['result']['data']['id'], 'card-1')
        self.assertEqual(send.call_args.args, (self.user, 'DELETE'))
        self.assertEqual(send.call_args.kwargs['card_id'], 'card-1')

    def test_remove_cannot_delete_another_users_card(self):
        with patch.object(qb_cards, 'get_valid_qb_token', return_value='token'), \
             patch.object(qb_cards, '_request', return_value=None) as send:
            response = qb_cards.payment_methods(self.delete_request())
        self.assertEqual(response.status_code, 400)
        self.assertEqual(send.call_count, 1)
        self.assertEqual(send.call_args.args[1], 'GET')

    def test_remove_requires_authentication_and_valid_card_id(self):
        request = APIRequestFactory().delete('/', {'payment_method_id': 'card-1'}, format='json')
        self.assertIn(qb_cards.payment_methods(request).status_code, (401, 403))
        with patch.object(qb_cards, 'get_valid_qb_token', return_value='token'), \
             patch.object(qb_cards, '_request') as send:
            response = qb_cards.payment_methods(self.delete_request('../another-wallet'))
        self.assertEqual(response.status_code, 400)
        send.assert_not_called()

    def test_provider_delete_accepts_empty_success_body(self):
        response = Mock(ok=True, status_code=204)
        response.json.side_effect = ValueError('Empty body')
        with patch.object(qb_cards.QBConfig, 'get', return_value=self.config), \
             patch.object(qb_cards.requests, 'request', return_value=response) as send:
            self.assertIsNone(qb_cards._request(self.user, 'DELETE', token='token', card_id='card-1'))
        response.json.assert_not_called()
        self.assertIn(f'/customers/{qb_cards.wallet_id(self.user, self.config)}/cards/card-1', send.call_args.args[1])

    def test_provider_delete_failure_is_not_reported_as_success(self):
        with patch.object(qb_cards, 'get_valid_qb_token', return_value='token'), \
             patch.object(qb_cards, '_request', side_effect=[self.card, ValueError('Unable to remove')]):
            response = qb_cards.payment_methods(self.delete_request())
        self.assertEqual(response.status_code, 400)
