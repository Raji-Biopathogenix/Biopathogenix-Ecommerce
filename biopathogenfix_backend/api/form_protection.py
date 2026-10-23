"""Shared abuse controls for public forms, before any email is generated."""
import hashlib
import ipaddress
import json
import logging
import time
from functools import wraps

import requests
from django.conf import settings
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from rest_framework.response import Response

logger = logging.getLogger(__name__)
CONTROL_FIELDS = {"website", "turnstile_token", "cf-turnstile-response"}
LONG_FIELDS = {"message", "reason", "targets", "notes", "additional_notes", "additional_details"}


def _key(kind, value):
    # Do not put contact details or raw IP addresses in cache keys or logs.
    digest = hashlib.sha256(value.encode()).hexdigest()
    return f"public-form:{kind}:{digest}"


def _limited(kind, identity, limit, seconds):
    key = _key(kind, f"{identity}:{int(time.time()) // seconds}")
    if cache.add(key, 1, timeout=seconds + 1):
        return False
    try:
        # incr gives None if the cache is unreachable; don't block real people over a cache outage.
        return (cache.incr(key) or 0) > limit
    except ValueError:
        return not cache.add(key, 1, timeout=seconds + 1)


def _reject(message, code=400):
    response = Response({"message": message}, status=code)
    if code == 429:
        response["Retry-After"] = "900"
    return response


def _client_ip(request):
    peer = request.META.get("REMOTE_ADDR", "unknown")
    trusted = settings.FORM_TRUSTED_PROXY_IPS
    if peer not in trusted:
        return peer
    # Walk from our proxy toward the visitor, ignoring only explicitly trusted hops.
    # A forged prefix on X-Forwarded-For cannot override the last untrusted address.
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR", "")
    for candidate in reversed(forwarded.split(",")):
        candidate = candidate.strip()
        try:
            candidate = str(ipaddress.ip_address(candidate))
        except ValueError:
            return peer
        if candidate not in trusted:
            return candidate
    return peer


def protect_form(handler):
    @wraps(handler)
    def protected(self, request, *args, **kwargs):
        ip = _client_ip(request)
        if _limited("ip", ip, settings.FORM_SUBMISSIONS_PER_15_MINUTES, 900):
            return _reject("Too many requests. Please wait 15 minutes before trying again.", 429)

        data = request.data
        if not hasattr(data, "items"):
            return _reject("Invalid form data.")
        if data.get("website"):
            logger.info("Public form rejected: honeypot (%s)", self.__class__.__name__)
            return _reject("Unable to submit this request.")

        clean = {}
        for field, value in data.items():
            if field in CONTROL_FIELDS or field in request.FILES:
                continue
            if isinstance(value, list):
                if field != "validating_for" or len(value) > 3 or any(not isinstance(v, str) for v in value):
                    return _reject("Invalid form data.")
            elif not isinstance(value, str):
                # Registration selects a numeric state; it is optional in the API.
                if not (field == "state" and (value is None or type(value) is int)):
                    return _reject("Invalid form data.")
            else:
                if len(value) > (5000 if field in LONG_FIELDS else 254):
                    return _reject("One or more fields are too long.")
                if field not in LONG_FIELDS and ("\r" in value or "\n" in value):
                    return _reject("Please enter a single line for contact details.")
                value = value.strip()
            clean[field] = value

        email = str(clean.get("email") or clean.get("work_email") or "").lower()
        if email:
            try:
                validate_email(email)
            except ValidationError:
                return _reject("Please enter a valid email address.")
            if _limited("email", email, settings.FORM_SUBMISSIONS_PER_EMAIL_PER_HOUR, 3600):
                return _reject("Too many requests for this email address. Please try again later.", 429)

        secret = settings.TURNSTILE_SECRET_KEY
        if secret:
            token = data.get("turnstile_token", "")
            if not isinstance(token, str) or not token or len(token) > 2048:
                return _reject("Please complete the spam protection check and try again.")
            try:
                result = requests.post(
                    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                    data={"secret": secret, "response": token}, timeout=8,
                )
                result.raise_for_status()
                verification = result.json()
                valid = (
                    isinstance(verification, dict)
                    and verification.get("success") is True
                    and verification.get("action") == "contact_form"
                    and verification.get("hostname") in settings.TURNSTILE_ALLOWED_HOSTNAMES
                )
            except (requests.RequestException, ValueError):
                logger.warning("Public form verification service unavailable")
                return _reject("Spam protection is temporarily unavailable. Please try again shortly.", 503)
            if not valid:
                return _reject("Spam protection check failed. Please try again.")

        # The endpoint class covers /api, /api/v1 and slash aliases equally.
        # Reserve atomically so simultaneous double-clicks cannot send duplicate mail.
        fingerprint = json.dumps([self.__class__.__name__, clean], sort_keys=True)
        for name, upload in request.FILES.items():
            fingerprint += f"|{name}:{upload.name}:{upload.size}"
        key = _key("duplicate", fingerprint)
        if not cache.add(key, True, timeout=900):
            return _reject("This request has already been received. Please wait before sending it again.", 429)
        try:
            response = handler(self, request, *args, **kwargs)
        except Exception:
            cache.delete(key)
            raise
        if response.status_code >= 400:
            # Failed validation or delivery must remain retryable.
            cache.delete(key)
        return response

    return protected
