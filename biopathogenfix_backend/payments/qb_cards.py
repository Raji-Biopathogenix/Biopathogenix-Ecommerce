"""QuickBooks card vault. Only masked card summaries leave this module."""
import re
import uuid
from datetime import date
from urllib.parse import quote

import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import QBConfig
from .utils import get_qb_base_url, get_valid_qb_token


def wallet_id(user, config):
    # Payments customer IDs belong to our app, independently of accounting
    # customers (which may be shared by multiple laboratory users).
    return uuid.uuid5(uuid.NAMESPACE_URL,
        f'biopathogenix:cards:{config.environment}:{config.realm_id}:{user.uid}').hex


def _request(user, method, *, token=None, card_id=None, payload=None, request_id=None):
    config = QBConfig.get()
    url = f'{get_qb_base_url(config)}/quickbooks/v4/customers/{wallet_id(user, config)}/cards'
    if card_id:
        url += '/' + quote(card_id, safe='')
    try:
        response = requests.request(method, url, headers={
            'Authorization': f'Bearer {token or get_valid_qb_token()}',
            'Content-Type': 'application/json', 'Accept': 'application/json',
            'Request-Id': request_id or str(uuid.uuid4()),
        }, json=payload, params={'count': 100} if method == 'GET' and not card_id else None, timeout=20)
        if response.status_code == 404 and method == 'GET':
            return None if card_id else []
        if not response.ok:
            raise ValueError('Unable to access saved cards. Please try again or use a new card.')
        if method == 'DELETE':
            return None  # Intuit returns an empty body for a successful delete.
        return response.json()
    except (requests.RequestException, ValueError):
        # Never expose provider responses or raw card details in errors/logs.
        raise ValueError('Unable to access saved cards. Please try again or use a new card.') from None


def card_summary(card):
    return {'id': str(card['id']), 'brand': card.get('cardType', 'Card'),
        'last4': re.sub(r'\D', '', str(card.get('number', '')))[-4:],
        'exp_month': int(card['expMonth']), 'exp_year': int(card['expYear']),
        'name': card.get('name', ''), 'country': card.get('address', {}).get('country', ''),
        'fingerprint': '', 'is_default': False}


def get_owned_card(user, card_id, token, *, check_expiry=True):
    if not isinstance(card_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,150}', card_id):
        raise ValueError('Please select a valid saved card.')
    card = _request(user, 'GET', token=token, card_id=card_id)
    if not isinstance(card, dict) or str(card.get('id', '')) != card_id:
        raise ValueError('This saved card is not available for your account. Please use another card.')
    summary = card_summary(card)
    if check_expiry and (summary['exp_year'], summary['exp_month']) < (date.today().year, date.today().month):
        raise ValueError('This saved card has expired. Please use another card.')
    return summary


def save_card(user, data, billing, *, token=None, request_key=None):
    if data.get('save_payment_method') is not True:
        raise ValueError('Please confirm that you want to save this card.')
    number = re.sub(r'\s', '', str(data.get('card_number', '')))
    name = str(data.get('card_name', '')).strip()
    try:
        month, year = int(data.get('card_exp_month', 0)), int(data.get('card_exp_year', 0))
    except (ValueError, TypeError):
        raise ValueError('Please enter a valid card expiration date.') from None
    if not name or not re.fullmatch(r'\d{13,19}', number):
        raise ValueError('Please enter a cardholder name and valid card number.')
    digits = [int(value) for value in reversed(number)]
    if sum(value if index % 2 == 0 else (value * 2 - 9 if value > 4 else value * 2)
           for index, value in enumerate(digits)) % 10:
        raise ValueError('Please enter a valid card number.')
    if not re.fullmatch(r'\d{5}', str(billing.get('postal_code', ''))):
        raise ValueError('Please enter a valid 5-digit billing ZIP code.')
    if not 1 <= month <= 12 or (year, month) < (date.today().year, date.today().month):
        raise ValueError('Please enter a valid card expiration date.')
    payload = {'name': name, 'number': number, 'expMonth': f'{month:02}', 'expYear': str(year),
        'address': {'postalCode': billing.get('postal_code', ''), 'country': 'US',
            'region': billing.get('state_code', ''), 'streetAddress': billing.get('line1', ''),
            'city': billing.get('city', '')}}
    # CVV is used only for the charge, never sent to the card vault.
    request_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f'save-card:{user.uid}:{request_key}')) if request_key else None
    card = _request(user, 'POST', token=token, payload=payload, request_id=request_id)
    if not isinstance(card, dict) or not card.get('id'):
        raise ValueError('Unable to save this card. Please try again.')
    return card_summary(card)


@api_view(['GET', 'POST', 'DELETE'])
@permission_classes([IsAuthenticated])
def payment_methods(request):
    try:
        if request.method == 'GET':
            cards = _request(request.user, 'GET')
            if not isinstance(cards, list):
                raise ValueError('Unable to load saved cards. Please try again.')
            result = [card_summary(card) for card in cards]
        elif request.method == 'DELETE':
            token = get_valid_qb_token()
            card = get_owned_card(request.user, request.data.get('payment_method_id'), token, check_expiry=False)
            _request(request.user, 'DELETE', token=token, card_id=card['id'])
            result = {'id': card['id']}
        else:
            result = save_card(request.user, request.data, request.data.get('billing', {}))
        response = Response({'status': 'success', 'result': {'data': result}})
    except ValueError as exc:
        response = Response({'status': 'error', 'message': str(exc)}, status=400)
    except Exception:
        response = Response({'status': 'error', 'message': 'Saved cards are temporarily unavailable.'}, status=503)
    response['Cache-Control'] = 'private, no-store'
    return response
