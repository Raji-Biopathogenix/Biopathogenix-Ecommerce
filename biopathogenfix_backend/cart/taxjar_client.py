# taxes/taxjar_client.py
import requests
from django.conf import settings

TAXJAR_API_URL = 'https://api.taxjar.com/v2'
TAXJAR_SANDBOX_URL = 'https://api.sandbox.taxjar.com/v2'

def get_taxjar_headers(taxRecord):
    return {
        'Authorization': f'Bearer {taxRecord.api_key}',
        'Content-Type': 'application/json',
    }

def get_base_url(taxRecord):
    if taxRecord.use_sandbox:
        return TAXJAR_SANDBOX_URL
    return TAXJAR_API_URL