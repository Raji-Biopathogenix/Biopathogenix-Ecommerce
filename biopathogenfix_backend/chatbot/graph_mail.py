import os
import requests

TOKEN_URL = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
GRAPH_SENDMAIL_URL = "https://graph.microsoft.com/v1.0/users/{sender}/sendMail"


def get_graph_token() -> str:
    tenant_id = os.environ["MS_TENANT_ID"]
    client_id = os.environ["MS_CLIENT_ID"]
    client_secret = os.environ["MS_CLIENT_SECRET"]

    url = TOKEN_URL.format(tenant_id=tenant_id)

    # Client credentials flow with .default scope
    data = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "client_credentials",
        "scope": "https://graph.microsoft.com/.default",
    }

    r = requests.post(url, data=data, timeout=20)
    r.raise_for_status()
    return r.json()["access_token"]


def send_intake_email(subject: str, html_body: str, to_email: str) -> None:
    token = get_graph_token()
    sender = os.environ["MS_SENDER_UPN"]

    url = GRAPH_SENDMAIL_URL.format(sender=sender)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    payload = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "HTML",
                "content": html_body,
            },
            "toRecipients": [
                {"emailAddress": {"address": to_email}}
            ],
        },
        "saveToSentItems": "true",
    }

    r = requests.post(url, headers=headers, json=payload, timeout=20)
    r.raise_for_status()
