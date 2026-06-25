import logging
import base64
from typing import Iterable, Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def _graph_enabled() -> bool:
    return bool(getattr(settings, "GRAPH_ENABLED", False))


def _get_graph_token() -> str:
    tenant_id = settings.GRAPH_TENANT_ID
    client_id = settings.GRAPH_CLIENT_ID
    client_secret = settings.GRAPH_CLIENT_SECRET
    scope = settings.GRAPH_SCOPE

    token_url = f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
        "scope": scope,
    }

    response = requests.post(token_url, data=data, timeout=20)
    if response.status_code != 200:
        raise RuntimeError(f"Graph token error: {response.status_code} {response.text}")

    payload = response.json()
    access_token = payload.get("access_token")
    if not access_token:
        raise RuntimeError("Graph token missing access_token")

    return access_token


def send_graph_email(
    to_list: Iterable[str],
    subject: str,
    html_body: Optional[str] = None,
    text_body: Optional[str] = None,
    from_email: Optional[str] = None,
    cc_list: Optional[Iterable[str]] = None,
    attachments: Optional[Iterable[dict]] = None,
) -> None:
    if not _graph_enabled():
        raise RuntimeError("Graph email is not configured")

    sender = from_email or settings.GRAPH_SENDER or settings.DEFAULT_FROM_EMAIL
    if not sender:
        raise RuntimeError("Graph sender email is not configured")

    content = html_body or text_body or ""
    content_type = "HTML" if html_body else "Text"

    token = _get_graph_token()
    url = f"{settings.GRAPH_API_BASE}/users/{sender}/sendMail"

    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": content_type, "content": content},
            "toRecipients": [
                {"emailAddress": {"address": address}} for address in to_list
            ],
            "ccRecipients": [
                {"emailAddress": {"address": address}} for address in (cc_list or [])
            ],
        },
        "saveToSentItems": "false",
    }

    if attachments:
        payload["message"]["attachments"] = [
            {
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": attachment["name"],
                "contentType": attachment.get("content_type") or "application/octet-stream",
                "contentBytes": base64.b64encode(attachment["content"]).decode("ascii"),
            }
            for attachment in attachments
        ]

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    response = requests.post(url, json=payload, headers=headers, timeout=20)
    if response.status_code not in (200, 202):
        raise RuntimeError(f"Graph sendMail error: {response.status_code} {response.text}")

    logger.info("Graph email sent to %s", ", ".join(to_list))
